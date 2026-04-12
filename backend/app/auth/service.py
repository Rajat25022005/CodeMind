"""
Authentication Business Logic.
"""

from __future__ import annotations

import secrets
import string
import time

from fastapi import HTTPException, status

from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.mail import send_verification_email
from app.core.graph_db import GraphDB


def generate_verification_code() -> str:
    """Generate a secure random 6-digit string."""
    return "".join(secrets.choice(string.digits) for _ in range(6))


class AuthService:
    __slots__ = ("db",)

    def __init__(self, db: GraphDB):
        self.db = db

    async def register_user(self, email: str, password: str) -> None:
        """Register a new user and send verification code."""
        existing = await self.db.get_user_by_email(email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        hashed_pw = get_password_hash(password)
        code = generate_verification_code()
        
        await self.db.create_user(email, hashed_pw, code)
        await send_verification_email(email, code)

    async def verify_email(self, email: str, code: str) -> None:
        """Verify the user's email using the 6-digit code."""
        user = await self.db.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.get("is_verified"):
            raise HTTPException(status_code=400, detail="User already verified")
            
        attempts = user.get("verification_attempts", 0)
        if attempts >= 5:
            raise HTTPException(status_code=429, detail="Too many attempts. Request a new code.")
            
        created_at = user.get("created_at", 0)
        if time.time() * 1000 - created_at > 15 * 60 * 1000:
            raise HTTPException(status_code=400, detail="Code expired. Request a new one.")
            
        await self.db.increment_verification_attempts(email)
        
        if user.get("verification_code") != code:
            raise HTTPException(status_code=400, detail="Invalid verification code")

        success = await self.db.verify_user(email)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to verify user")

    async def login(self, email: str, password: str) -> str:
        """Authenticate user and return a JWT access token."""
        user = await self.db.get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        if not user.get("is_verified"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify your email first.",
            )

        if not verify_password(password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        # Generate JWT
        user_id = user.get("id", user["email"])
        token = create_access_token(data={"sub": user_id, "email": user["email"]})
        return token
