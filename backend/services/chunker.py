"""
Sliding window chunker.
chunk_size ≈ 500 tokens (375 words), overlap ≈ 100 tokens (75 words).
"""

CHUNK_WORDS   = 375
OVERLAP_WORDS = 75


def chunk(pages: list[dict], doc_id: str, doc_name: str, user_id: str) -> list[dict]:
    """Split pages into overlapping chunks with metadata."""
    chunks = []
    for page in pages:
        words = page["text"].split()
        start = 0
        while start < len(words):
            text = " ".join(words[start : start + CHUNK_WORDS])
            if text.strip():
                chunks.append({
                    "text":      text,
                    "doc_id":    doc_id,
                    "doc_name":  doc_name,
                    "user_id":   user_id,
                    "page":      page["page"],
                })
            start += CHUNK_WORDS - OVERLAP_WORDS
    return chunks
