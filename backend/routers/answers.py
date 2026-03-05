import uuid, re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from qdrant_client.http import models as qmodels
from clients import supabase, qdrant, embed, embed_batch, generate, COLLECTION
from dependencies import get_current_user


router = APIRouter()

TOP_K = 3
THRESHOLD = 0.45
MAX_CONTEXT_CHUNKS = 5


ANSWER_PROMPT = """\
You are completing a vendor questionnaire on behalf of a company.

Rules:
- Use ONLY the context passages provided.
- If the context doesn't support an answer, respond exactly: Not found in references.
- Be concise and factual.

Question: {question}

Context:
{context}

Reply in this exact format:
ANSWER: <your answer>
CITATION: <filename page N>  or  NONE
"""


IMPROVE_PROMPT = """\
Improve this answer using the context below. Keep it grounded — no invented facts.

Question: {question}
Previous answer: {previous}

Context:
{context}

Reply in this exact format:
ANSWER: <improved answer>
CITATION: <filename page N>  or  NONE
"""


class GenerateRequest(BaseModel):
    questionnaire_id: str


class ImproveRequest(BaseModel):
    questionnaire_id: str
    question_ids: list[str]


class AskRequest(BaseModel):
    question: str


class EditAnswer(BaseModel):
    answer_text: str


# ── helpers ───────────────────────────────────────────────────────────────────

def build_prompt(template: str, question: str, context: str = "", previous: str = ""):
    prompt = template.replace("{question}", question)

    # Only replace context if one is provided
    if context:
        prompt = prompt.replace("{context}", context)

    # Only replace previous if one is provided
    if previous:
        prompt = prompt.replace("{previous}", previous)

    return prompt

def retrieve(question: str, user_id: str) -> list[dict]:
    vec = embed(question, task="RETRIEVAL_QUERY")

    global_docs = supabase.table("documents") \
        .select("user_id") \
        .eq("is_global", True) \
        .eq("file_type", "reference_document") \
        .execute().data
    owner_ids = list({d["user_id"] for d in global_docs})

    print("DEBUG user_id:", user_id)
    print("DEBUG owner_ids:", owner_ids)

    should_conditions = [
        qmodels.FieldCondition(
            key="user_id",
            match=qmodels.MatchValue(value=uid)
        )
        for uid in set([user_id] + owner_ids)
    ]

    print("DEBUG should_conditions count:", len(should_conditions))

    try:
        hits = qdrant.search(
            collection_name=COLLECTION,
            query_vector=vec,
            query_filter=qmodels.Filter(should=should_conditions),
            limit=TOP_K,
            score_threshold=THRESHOLD,
            with_payload=True,
        )
        print("DEBUG hits before threshold:", len(hits))

        # Also try without threshold to see raw scores
        hits_raw = qdrant.search(
            collection_name=COLLECTION,
            query_vector=vec,
            query_filter=qmodels.Filter(should=should_conditions),
            limit=TOP_K,
            with_payload=True,
        )
        print("DEBUG raw hits (no threshold):", [(h.score, h.payload["user_id"]) for h in hits_raw])

    except Exception as e:
        print("QDRANT ERROR:", e)
        return []

    return [{
        "score": h.score,
        "text":  h.payload["chunk_text"],
        "doc":   h.payload["document_name"],
        "page":  h.payload["page"],
    } for h in hits]


def ask_llm(prompt: str, chunks: list[dict]) -> dict:
    if not chunks:
        return {
            "answer_text": "Not found in references.",
            "citation": None,
            "confidence": 0.0,
            "evidence": None,
        }

    # Limit context size
    chunks = chunks[:MAX_CONTEXT_CHUNKS]

    context_parts = [
    f"SOURCE: {c['doc']} page {c['page']}\n{c['text'][:1200]}"
    for c in chunks
]

    context = "\n\n".join(context_parts)

    prompt = prompt.replace("{context}", context)

    print("-------------Prompt Debug-------------")
    print(prompt)

    try:
        print("-------------LLM Response Debug-------------")
        text = generate(prompt)   # generate() already returns a string
        print(text)
    except Exception as e:
        print("LLM ERROR:", e)
        return {
            "answer_text": "Not found in references.",
            "citation": None,
            "confidence": 0.0,
            "evidence": None,
        }

    if not text:
        return {
            "answer_text": "Not found in references.",
            "citation": None,
            "confidence": 0.0,
            "evidence": None,
        }

    # Parse ANSWER and CITATION
    a = re.search(r"ANSWER:\s*(.+?)(?=\n*CITATION:|$)", text, re.DOTALL)
    c = re.search(r"CITATION:\s*(.+?)(?:\n|$)", text)

    answer = a.group(1).strip() if a else text.strip()
    citation = c.group(1).strip() if c else "NONE"

    return {
        "answer_text": answer,
        "citation": None if citation.upper() == "NONE" else citation,
        "confidence": round(max(x["score"] for x in chunks), 4),
        "evidence": chunks[0]["text"],
    }


def latest_answer(question_id: str) -> dict | None:
    rows = supabase.table("answers").select("*") \
        .eq("question_id", question_id) \
        .order("version", desc=True) \
        .limit(1) \
        .execute().data

    return rows[0] if rows else None


def save_answer(question_id: str, result: dict) -> str:
    prev = latest_answer(question_id)
    version = (prev["version"] + 1) if prev else 1
    aid = str(uuid.uuid4())

    supabase.table("answers").insert({
        "id": aid,
        "question_id": question_id,
        "answer_text": result["answer_text"],   # ← was result["answer"]
        "citation": result["citation"],
        "confidence": result["confidence"],
        "evidence": result["evidence"],
        "version": version,
    }).execute()

    return aid


# ── endpoints ─────────────────────────────────────────────────────────────────


@router.post("/generate")
def generate_answers(body: GenerateRequest, user_id: str = Depends(get_current_user)):
    _own_q(body.questionnaire_id, user_id)

    questions = supabase.table("questions") \
        .select("*") \
        .eq("questionnaire_id", body.questionnaire_id) \
        .order("order_index") \
        .execute().data

    run_id = str(uuid.uuid4())

    supabase.table("runs").insert({
        "id": run_id,
        "questionnaire_id": body.questionnaire_id
    }).execute()

    results = []

    for q in questions:
        chunks = retrieve(q["question_text"], user_id)

        prompt = build_prompt(
            ANSWER_PROMPT,
            q["question_text"],
            ""
        )

        result = ask_llm(prompt, chunks)

        aid = save_answer(q["id"], result)

        # In generate_answers — replace the existing results.append block:
        results.append({
            "question_id": q["id"],
            "answer_id":   aid,
            "id":          aid,
            "answer_text": result["answer_text"],   # ← was result["answer"]
            "citation":    result["citation"],
            "confidence":  result["confidence"],
            "evidence":    result["evidence"],
        })

    return {"run_id": run_id, "answers": results}


@router.post("/improve")
def improve(body: ImproveRequest, user_id: str = Depends(get_current_user)):
    _own_q(body.questionnaire_id, user_id)

    questions = supabase.table("questions") \
        .select("*") \
        .in_("id", body.question_ids) \
        .execute().data

    results = []

    for q in questions:
        prev = latest_answer(q["id"])

        chunks = retrieve(q["question_text"], user_id)

        prompt = build_prompt(
            IMPROVE_PROMPT,
            q["question_text"],
            "",
            prev["answer_text"] if prev else ""
        )

        result = ask_llm(prompt, chunks)

        aid = save_answer(q["id"], result)

        # In improve — replace the existing results.append block:
        results.append({
            "question_id": q["id"],
            "answer_id":   aid,
            "id":          aid,
            "answer_text": result["answer_text"],   # ← was result["improved"]
            "citation":    result["citation"],
            "confidence":  result["confidence"],
            "evidence":    result["evidence"],
        })

    return {"improved": results}


@router.post("/ask")
def ask(body: AskRequest, user_id: str = Depends(get_current_user)):
    chunks = retrieve(body.question, user_id)

    prompt = build_prompt(
        ANSWER_PROMPT,
        body.question,
        ""
    )

    return ask_llm(prompt, chunks)


@router.put("/{answer_id}")
def edit_answer(answer_id: str, body: EditAnswer, user_id: str = Depends(get_current_user)):
    ans = supabase.table("answers") \
        .select("question_id") \
        .eq("id", answer_id) \
        .single() \
        .execute().data

    if not ans:
        raise HTTPException(404, "Answer not found.")

    q = supabase.table("questions") \
        .select("questionnaire_id") \
        .eq("id", ans["question_id"]) \
        .single() \
        .execute().data

    qn = supabase.table("questionnaires") \
        .select("user_id") \
        .eq("id", q["questionnaire_id"]) \
        .single() \
        .execute().data

    if qn["user_id"] != user_id:
        raise HTTPException(403, "Forbidden.")

    supabase.table("answers") \
        .update({"answer_text": body.answer_text}) \
        .eq("id", answer_id) \
        .execute()

    return {"updated": answer_id}


@router.get("/{questionnaire_id}")
def get_answers(questionnaire_id: str, user_id: str = Depends(get_current_user)):
    _own_q(questionnaire_id, user_id)

    questions = supabase.table("questions") \
        .select("id") \
        .eq("questionnaire_id", questionnaire_id) \
        .execute().data

    out = {}

    for q in questions:
        ans = latest_answer(q["id"])
        if ans:
            out[q["id"]] = ans

    return out


def _own_q(q_id: str, user_id: str):
    row = supabase.table("questionnaires") \
        .select("id") \
        .eq("id", q_id) \
        .eq("user_id", user_id) \
        .execute()

    if not row.data:
        raise HTTPException(404, "Questionnaire not found.")