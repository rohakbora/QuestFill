from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from clients import supabase

bearer = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    try:
        resp = supabase.auth.get_user(creds.credentials)
        if not resp.user:
            raise HTTPException(401, "Invalid or expired token.")
        return resp.user.id
    except Exception:
        raise HTTPException(401, "Could not validate credentials.")
