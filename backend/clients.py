import os
from dotenv import load_dotenv
from supabase import create_client
import httpx
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

load_dotenv()

# ── Supabase ──────────────────────────────────────────────────────────────
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
LLM_MODEL = "gemini-3.1-flash-lite-preview"
EMBED_MODEL = "gemini-embedding-001"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# ── Embeddings ────────────────────────────────────────────────────────────

def embed(text: str, task: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    """
    Embed a single text.
    """
    url = f"{GEMINI_API_URL}/{EMBED_MODEL}:embedContent"
    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "model": EMBED_MODEL,
        "content": {"parts": [{"text": text}]},
        "taskType": task
    }
    resp = httpx.post(url, headers=headers, json=payload)
    resp.raise_for_status()
    data = resp.json()
    # Gemini returns embeddings in 'embedding' field
    return data["embedding"]["values"]


def embed_batch(texts: list[str], task: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
    """
    Embed multiple texts safely in batches.
    Gemini supports ~100 per request.
    """
    BATCH_SIZE = 100
    vectors = []
    url = f"{GEMINI_API_URL}/{EMBED_MODEL}:embedContent"
    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json"
    }
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        payload = {
            "model": EMBED_MODEL,
            "content": {"parts": [{"text": t} for t in batch]},
            "taskType": task
        }
        resp = httpx.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        # Gemini returns embeddings in 'embedding' field
        vectors.extend([data["embedding"]["values"]])
    return vectors


# ── LLM generation ─────────────────────────────────────────────────────────

def generate(prompt: str) -> str:
    """
    Generate text using Gemini Flash.
    """
    url = f"{GEMINI_API_URL}/{LLM_MODEL}:generateContent"
    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }
    resp = httpx.post(url, headers=headers, json=payload)
    resp.raise_for_status()
    data = resp.json()
    # Get the first candidate's text
    candidates = data.get("candidates", [])
    if candidates and "content" in candidates[0]:
        parts = candidates[0]["content"].get("parts", [])
        if parts and "text" in parts[0]:
            return parts[0]["text"]
    return ""


# ── Qdrant ─────────────────────────────────────────────────────────────────

qdrant = QdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ.get("QDRANT_API_KEY"),
    timeout=120,        # 2 min total per request
)

COLLECTION = "documents"

#qdrant.delete_collection(collection_name=COLLECTION)

# Gemini embedding dimension
VECTOR_SIZE = 3072

existing = [c.name for c in qdrant.get_collections().collections]

# Create collection if needed
if COLLECTION not in existing:
    qdrant.create_collection(
        collection_name=COLLECTION,
        vectors_config=qmodels.VectorParams(
            size=VECTOR_SIZE,
            distance=qmodels.Distance.COSINE,
        ),
    )

# Ensure payload index exists for filtering
qdrant.create_payload_index(
    collection_name=COLLECTION,
    field_name="user_id",
    field_schema=qmodels.PayloadSchemaType.KEYWORD,
)
