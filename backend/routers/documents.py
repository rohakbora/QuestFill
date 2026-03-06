import uuid, hashlib
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from qdrant_client.http import models as qmodels
from clients import supabase, qdrant, embed_batch, COLLECTION
from dependencies import get_current_user
from services.parser import pdf_pages
from services.chunker import chunk

router = APIRouter()

BATCH_SIZE = 50


@router.post("/upload")
def upload_document(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    ext = file.filename.lower().rsplit('.', 1)[-1]
    if ext not in ("pdf", "txt"):
        raise HTTPException(400, "Only PDF and TXT files accepted.")

    data      = file.file.read()
    file_hash = hashlib.sha256(data).hexdigest()

    # ── Dedup: skip if this exact file was already embedded for this user ──
    existing = supabase.table("documents") \
        .select("id, file_name") \
        .eq("user_id", user_id) \
        .eq("file_hash", file_hash) \
        .eq("file_type", "reference_document") \
        .limit(1).execute().data

    if existing:
        return {
            "id": existing[0]["id"],
            "file_name": existing[0]["file_name"],
            "chunks": 0,
            "duplicate": True,
        }

    doc_id = str(uuid.uuid4())
    path   = f"{user_id}/{doc_id}_{file.filename}"

    supabase.storage.from_("reference_documents").upload(
        path=path,
        file=data,
        file_options={"content-type": file.content_type or ("text/plain" if ext == "txt" else "application/pdf")},
    )

    file_url = supabase.storage.from_("reference_documents").get_public_url(path)

    supabase.table("documents").insert({
        "id":        doc_id,
        "user_id":   user_id,
        "file_name": file.filename,
        "file_type": "reference_document",
        "file_url":  file_url,
        "file_hash": file_hash,
    }).execute()

    if ext == "pdf":
        pages = pdf_pages(data)
    else:
        text  = data.decode(errors="ignore")
        pages = [{"page": 1, "text": text}]

    chunks = chunk(pages, doc_id, file.filename, user_id)

    if not chunks:
        raise HTTPException(422, "Could not extract text from this file.")

    # ── Chunk-level dedup ───────────────────────────────────────────────
    # REPLACE with:
    texts   = [c["text"] for c in chunks]
    vectors = embed_batch(texts)

    points = []
    for c, vec in zip(chunks, vectors):
        h = hashlib.sha256(f"{user_id}:{c['text']}".encode()).hexdigest()

        points.append(
            qmodels.PointStruct(
                id=int(h[:16], 16),
                vector=vec,
                payload={
                    "user_id":       user_id,
                    "document_id":   doc_id,
                    "document_name": file.filename,
                    "chunk_text":    c["text"],
                    "page":          c["page"],
                },
            )
        )

    # ── Batched Qdrant Upsert (prevents write timeouts) ─────────────────
    # ── Upsert in small batches with retry to avoid write timeouts ──────────
    UPSERT_BATCH = 32
    MAX_RETRIES  = 3

    for batch_start in range(0, len(points), UPSERT_BATCH):
        batch = points[batch_start : batch_start + UPSERT_BATCH]
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                qdrant.upsert(collection_name=COLLECTION, points=batch, wait=True)
                break
            except Exception as e:
                print(f"Qdrant upsert attempt {attempt} failed: {e}")
                if attempt == MAX_RETRIES:
                    raise HTTPException(503, f"Vector store unavailable after {MAX_RETRIES} attempts. Try again shortly.")
                import time
                time.sleep(2 ** attempt)   # exponential back-off: 2s, 4s

    return {"id": doc_id, "file_name": file.filename, "chunks": len(points)}


@router.get("/")
def list_documents(user_id: str = Depends(get_current_user)):
    return supabase.table("documents").select("*") \
        .eq("user_id", user_id).eq("file_type", "reference_document") \
        .order("created_at", desc=True).execute().data


@router.get("/file/{filename:path}")
def get_document_url(filename: str, user_id: str = Depends(get_current_user)):
    """Return the public URL for a reference document."""

    result = (
        supabase.table("documents")
        .select("file_url")
        .eq("user_id", user_id)
        .eq("file_name", filename)
        .eq("file_type", "reference_document")
        .limit(1)
        .execute()
    )
    doc = result.data

    if not doc:
        raise HTTPException(404, "Document not found.")

    return {"url": doc[0]["file_url"]}


@router.delete("/{doc_id}")
def delete_document(doc_id: str, user_id: str = Depends(get_current_user)):
    row = supabase.table("documents").select("id").eq("id", doc_id).eq("user_id", user_id).execute()
    if not row.data:
        raise HTTPException(404, "Document not found.")

    qdrant.delete(collection_name=COLLECTION, points_selector=qmodels.FilterSelector(
        filter=qmodels.Filter(must=[
            qmodels.FieldCondition(key="document_id", match=qmodels.MatchValue(value=doc_id)),
            qmodels.FieldCondition(key="user_id",     match=qmodels.MatchValue(value=user_id)),
        ])
    ), wait=True)

    supabase.table("documents").delete().eq("id", doc_id).execute()
    return {"deleted": doc_id}