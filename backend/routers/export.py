import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from clients import supabase
from dependencies import get_current_user
from services.exporter import build_export

router = APIRouter()

class ExportRequest(BaseModel):
    questionnaire_id: str
    format: str   # "pdf" | "docx" | "xlsx"


@router.post("/")
def export(body: ExportRequest, user_id: str = Depends(get_current_user)):
    qn = supabase.table("questionnaires").select("*") \
        .eq("id", body.questionnaire_id).eq("user_id", user_id).execute()
    if not qn.data:
        raise HTTPException(404, "Questionnaire not found.")

    questions = supabase.table("questions").select("*") \
        .eq("questionnaire_id", body.questionnaire_id).order("order_index").execute().data

    # Pair each question with its latest answer
    pairs = []
    for q in questions:
        ans = supabase.table("answers").select("*") \
            .eq("question_id", q["id"]).order("version", desc=True).limit(1).execute().data
        pairs.append({
            "order_index": q["order_index"],
            "question":    q["question_text"],
            "answer":      ans[0]["answer_text"]  if ans else "Not answered.",
            "citation":    ans[0]["citation"]      if ans else None,
            "confidence":  ans[0]["confidence"]    if ans else 0.0,
        })

    file_bytes, content_type = build_export(body.format, qn.data[0]["name"], pairs)

    # Persist export to Supabase storage
    ext  = body.format.lower()
    path = f"{user_id}/{body.questionnaire_id}_{uuid.uuid4()}.{ext}"
    supabase.storage.from_("exports").upload(path=path, file=file_bytes, file_options={"content-type": content_type})

    filename = f"{qn.data[0]['name'].replace(' ', '_')}.{ext}"
    return Response(content=file_bytes, media_type=content_type,
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})
