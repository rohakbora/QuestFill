from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from clients import supabase

router = APIRouter()

class Credentials(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup(body: Credentials):
    resp = supabase.auth.sign_up({"email": body.email, "password": body.password})
    if not resp.user:
        raise HTTPException(400, "Signup failed.")
    return {"access_token": resp.session.access_token, "user_id": resp.user.id, "email": resp.user.email}


@router.post("/login")
def login(body: Credentials):
    try:
        resp = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception:
        raise HTTPException(401, "Invalid credentials.")
    return {"access_token": resp.session.access_token, "user_id": resp.user.id, "email": resp.user.email}
