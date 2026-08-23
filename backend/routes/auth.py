# ==========================================
# Authentication Routes
# ==========================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.auth_service import authenticate_user, create_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ==========================================
# Login Request
# ==========================================

class LoginRequest(BaseModel):

    username: str

    password: str



# ==========================================
# Login
# ==========================================

@router.post("/login")
def login(request: LoginRequest):

    user = authenticate_user(
        request.username,
        request.password
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password."
        )

    token = create_access_token(user)

    return {
        "message": "Login successful.",

        "access_token": token,

        "token_type": "Bearer",

        "user": user
    }
