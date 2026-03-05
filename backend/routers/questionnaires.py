import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from clients import supabase
from dependencies import get_current_user
from services.parser import parse_questionnaire

router = APIRouter()

class QuestionText(BaseModel):
    question_text: str

class BulkDeleteBody(BaseModel):
    question_ids: list[str]


@router.post("/upload")
def upload_questionnaire(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    data = file.file.read()

    try:
        questions = parse_questionnaire(data, file.filename)
    except Exception as e:
        raise HTTPException(422, f"Could not parse questionnaire: {e}")

    if not questions:
        raise HTTPException(422, "No questions found in this file.")

    doc_id = str(uuid.uuid4())
    q_id   = str(uuid.uuid4())
    path   = f"{user_id}/{q_id}_{file.filename}"

    supabase.storage.from_("questionnaires").upload(
        path=path, file=data,
        file_options={"content-type": file.content_type or "application/octet-stream"},
    )
    file_url = supabase.storage.from_("questionnaires").get_public_url(path)

    supabase.table("documents").insert({
        "id": doc_id, "user_id": user_id, "file_name": file.filename,
        "file_type": "questionnaire", "file_url": file_url,
    }).execute()

    name = file.filename.rsplit(".", 1)[0].replace("_", " ").title()
    supabase.table("questionnaires").insert({
        "id": q_id, "user_id": user_id, "file_id": doc_id, "name": name,
    }).execute()

    rows = [
        {"id": str(uuid.uuid4()), "questionnaire_id": q_id, "question_text": q, "order_index": i}
        for i, q in enumerate(questions)
    ]
    supabase.table("questions").insert(rows).execute()

    return {"questionnaire_id": q_id, "name": name, "question_count": len(rows), "questions": rows}


@router.get("/")
def list_questionnaires(user_id: str = Depends(get_current_user)):
    qs = supabase.table("questionnaires").select("*") \
        .eq("user_id", user_id).order("created_at", desc=True).execute().data

    # Attach live question count to each questionnaire
    for q in qs:
        count_resp = supabase.table("questions") \
            .select("id", count="exact") \
            .eq("questionnaire_id", q["id"]) \
            .execute()
        q["question_count"] = count_resp.count or 0

    return qs


@router.get("/{q_id}/questions")
def get_questions(q_id: str, user_id: str = Depends(get_current_user)):
    _own(q_id, user_id)
    return supabase.table("questions").select("*") \
        .eq("questionnaire_id", q_id).order("order_index").execute().data


@router.post("/{q_id}/questions")
def add_question(q_id: str, body: QuestionText, user_id: str = Depends(get_current_user)):
    _own(q_id, user_id)

    existing = supabase.table("questions").select("order_index") \
        .eq("questionnaire_id", q_id).order("order_index", desc=True).limit(1).execute()
    next_idx = (existing.data[0]["order_index"] + 1) if existing.data else 0

    row = {"id": str(uuid.uuid4()), "questionnaire_id": q_id,
           "question_text": body.question_text.strip(), "order_index": next_idx}
    supabase.table("questions").insert(row).execute()
    return row


@router.put("/{q_id}/questions/{question_id}")
def update_question(q_id: str, question_id: str, body: QuestionText, user_id: str = Depends(get_current_user)):
    _own(q_id, user_id)
    supabase.table("questions").update({"question_text": body.question_text.strip()}).eq("id", question_id).execute()
    return {"updated": question_id}


@router.delete("/{q_id}/questions/{question_id}")
def delete_question(q_id: str, question_id: str, user_id: str = Depends(get_current_user)):
    _own(q_id, user_id)
    supabase.table("questions").delete().eq("id", question_id).execute()
    return {"deleted": question_id}


@router.delete("/{q_id}")
def delete_questionnaire(q_id: str, user_id: str = Depends(get_current_user)):
    _own(q_id, user_id)

    q_rows = supabase.table("questions") \
        .select("id").eq("questionnaire_id", q_id).execute().data
    q_ids = [r["id"] for r in q_rows]

    if q_ids:
        supabase.table("answers").delete().in_("question_id", q_ids).execute()

    supabase.table("questions").delete().eq("questionnaire_id", q_id).execute()

    # ← this line is missing in your current file
    supabase.table("runs").delete().eq("questionnaire_id", q_id).execute()

    supabase.table("questionnaires").delete().eq("id", q_id).execute()

    return {"deleted": q_id}


@router.delete("/{q_id}/questions")
def bulk_delete_questions(q_id: str, body: BulkDeleteBody, user_id: str = Depends(get_current_user)):
    question_ids = body.question_ids
    """Delete multiple questions (and their answers) in one call.
    Pass question_ids as a JSON body array.
    """
    _own(q_id, user_id)

    if not question_ids:
        return {"deleted": []}

    # Verify all questions belong to this questionnaire
    owned = supabase.table("questions") \
        .select("id") \
        .eq("questionnaire_id", q_id) \
        .in_("id", question_ids) \
        .execute().data
    owned_ids = [r["id"] for r in owned]

    if owned_ids:
        supabase.table("answers").delete().in_("question_id", owned_ids).execute()
        supabase.table("questions").delete().in_("id", owned_ids).execute()

    return {"deleted": owned_ids}


def _own(q_id: str, user_id: str):
    """Raise 404 if the questionnaire doesn't belong to this user."""
    row = supabase.table("questionnaires").select("id").eq("id", q_id).eq("user_id", user_id).execute()
    if not row.data:
        raise HTTPException(404, "Questionnaire not found.")
