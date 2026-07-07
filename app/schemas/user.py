from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# ============ REQUEST SCHEMAS ============

class UserSignup(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ============ RESPONSE SCHEMAS ============

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True   # allow ORM object → schema


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class SignupResponse(BaseModel):
    """After signup — user must upload reference face next"""
    message: str
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
    next_step: str = "upload_reference_selfie"


class MessageResponse(BaseModel):
    message: str
    success: bool = True