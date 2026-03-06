import io, re
import pandas as pd
import pdfplumber

def pdf_pages(data: bytes) -> list[dict]:
    pages = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            words = page.extract_words(x_tolerance=3, y_tolerance=3, keep_blank_chars=False)
            if words:
                text = " ".join(w["text"] for w in words)
                text = re.sub(r"\(cid:\d+\)", " ", text)
                text = re.sub(r"\s+", " ", text).strip()
                if text:
                    pages.append({"page": i, "text": text})
    return pages


def _pdf_lines(data: bytes) -> list[str]:
    """For questionnaires — extract_text preserves line breaks."""
    lines = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            text = page.extract_text(x_tolerance=3, y_tolerance=3)
            if text:
                for line in text.splitlines():
                    line = line.strip()
                    if line:
                        lines.append(line)
    return lines


def parse_questionnaire(data: bytes, filename: str) -> list[str]:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return _questions_from_pdf(data)
    if lower.endswith((".xlsx", ".xls", ".csv")):
        return _questions_from_spreadsheet(data, filename)
    if lower.endswith(".txt"):
        text = data.decode(errors="ignore")
        return [line.strip() for line in text.splitlines() if line.strip()]
    raise ValueError(f"Unsupported file type: {filename}")


def _questions_from_pdf(data: bytes) -> list[str]:
    lines = _pdf_lines(data)
    questions = []

    # Pass 1 — try to find explicitly numbered/bulleted questions
    numbered = []
    for line in lines:
        for pat in [
            r"^\d+[\.\)]\s+(.+)",       # 1. or 1)
            r"^[Qq]\d+[:\.\)]\s+(.+)",  # Q1: or q1.
            r"^[-•–]\s+(.+)",           # bullet
        ]:
            m = re.match(pat, line)
            if m and len(m.group(1)) > 10:
                numbered.append(m.group(1).strip())
                break

    if numbered:
        return numbered

    # Pass 2 — no numbering found, treat each line that looks like a question
    # as its own entry. Heuristics: ends with "?" OR is long enough to be a
    # question (>20 chars) and doesn't look like a header/page number.
    for line in lines:
        # Skip very short lines, page numbers, section headers
        if len(line) < 15:
            continue
        if re.match(r"^\d+$", line):          # pure page number
            continue
        if re.match(r"^(section|part|chapter|page)\s", line, re.I):
            continue

        questions.append(line)

    return questions


def _questions_from_spreadsheet(data: bytes, filename: str) -> list[str]:
    df = pd.read_csv(io.BytesIO(data)) if filename.endswith(".csv") else pd.read_excel(io.BytesIO(data))

    col_map = {str(c).lower().strip(): c for c in df.columns}
    col = next((col_map[k] for k in ("question", "questions", "q", "item", "prompt", "text") if k in col_map), None)
    if col is None:
        col = next((c for c in df.columns if df[c].dtype == object), None)
    if col is None:
        raise ValueError("Could not find a question column in this spreadsheet.")

    return [q for q in df[col].dropna().astype(str).str.strip().tolist()
            if not re.match(r"^(question|q|item|prompt)s?$", q.lower())]