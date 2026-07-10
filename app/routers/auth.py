from fastapi import APIRouter, Depends, UploadFile, File, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import (
    UserSignup, UserLogin, UserResponse,
    TokenResponse, SignupResponse, MessageResponse,
    ChangePasswordRequest
)
from app.services import auth_service
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    """Register a new user account."""
    user = auth_service.signup_user(db, payload)
    token = auth_service.create_user_token(user)
    return SignupResponse(
        message="Account created! Please upload your reference selfie to complete registration.",
        user=user,
        access_token=token
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Login with email + password (JSON body), returns JWT token."""
    user = auth_service.authenticate_user(db, payload)
    token = auth_service.create_user_token(user)
    return TokenResponse(access_token=token, user=user)


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 form-based login — used by Swagger UI 'Authorize' button.
    Username field = email.
    """
    # OAuth2PasswordRequestForm uses `username` field — treat it as email
    payload = UserLogin(email=form_data.username, password=form_data.password)
    user = auth_service.authenticate_user(db, payload)
    token = auth_service.create_user_token(user)
    return TokenResponse(access_token=token, user=user)


@router.post("/upload-reference-face", response_model=MessageResponse)
async def upload_reference_face(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload the reference selfie (called after signup)."""
    if current_user.is_verified:
        return MessageResponse(
            message="Reference face already uploaded. Ready to mark attendance!",
            success=True
        )

    await auth_service.upload_reference_face(db, current_user, file)
    return MessageResponse(
        message="Reference selfie uploaded successfully! You can now mark attendance.",
        success=True
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current logged-in user's profile"""
    return current_user

@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user's password"""
    auth_service.change_user_password(
        db, current_user,
        payload.current_password,
        payload.new_password
    )
    return MessageResponse(
        message="Password changed successfully!",
        success=True
    )