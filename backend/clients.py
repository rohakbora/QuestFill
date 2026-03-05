import os
from dotenv import load_dotenv
from supabase import create_client
from google import genai
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

load_dotenv()

# ── Supabase ──────────────────────────────────────────────────────────────
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)

# ── Gemini (new SDK) ──────────────────────────────────────────────────────
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

LLM_MODEL = "gemini-3.1-flash-lite-preview"
EMBED_MODEL = "gemini-embedding-001"

# ── Embeddings ────────────────────────────────────────────────────────────

def embed(text: str, task: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    """
    Embed a single text.
    """
    response = client.models.embed_content(
        model=EMBED_MODEL,
        contents=text,
        config={"task_type": task},
    )

    return response.embeddings[0].values


def embed_batch(texts: list[str], task: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
    """
    Embed multiple texts safely in batches.
    Gemini supports ~100 per request.
    """
    BATCH_SIZE = 100
    vectors = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]

        response = client.models.embed_content(
            model=EMBED_MODEL,
            contents=batch,
            config={"task_type": task},
        )

        vectors.extend([e.values for e in response.embeddings])

    return vectors


# ── LLM generation ─────────────────────────────────────────────────────────

def generate(prompt: str) -> str:
    """
    Generate text using Gemini Flash.
    """
    response = client.models.generate_content(
        model=LLM_MODEL,
        contents=prompt,
    )

    return response.text


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
