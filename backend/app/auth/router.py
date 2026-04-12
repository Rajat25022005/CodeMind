"""
Authentication API Endpoints.
"""
from fastapi import APIRouter, Depends, status
from app.auth.schemas import RegisterRequest, VerifyRequest, LoginRequest, TokenResponse, UserProfile
from app.auth.service import AuthService
from app.core.security import get_current_user

router = APIRouter(tags=["auth"])

_graph_db = None

def set_auth_clients(graph_db):
    """Injected by main.py at startup."""
    global _graph_db
    _graph_db = graph_db

def get_auth_service() -> AuthService:
    return AuthService(_graph_db)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, auth_service: AuthService = Depends(get_auth_service)):
    """Register a new user account."""
    await auth_service.register_user(request.email, request.password)
    return {"message": "Verification code sent to email"}


@router.post("/verify")
async def verify(request: VerifyRequest, auth_service: AuthService = Depends(get_auth_service)):
    """Verify email using the 6-digit code."""
    await auth_service.verify_email(request.email, request.code)
    return {"message": "Email verified successfully"}


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    """Authenticate and get a JWT."""
    token = await auth_service.login(request.email, request.password)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserProfile)
async def get_me(user: dict = Depends(get_current_user), auth_service: AuthService = Depends(get_auth_service)):
    """Get the current authenticated user's profile."""
    # Re-fetch from DB to check verification status
    db_user = await auth_service.db.get_user_by_email(user["email"])
    return UserProfile(
        email=db_user["email"],
        is_verified=db_user.get("is_verified", False)
    )
