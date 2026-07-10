import uuid
from pathlib import Path
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserSignup, UserLogin
from app.utils.security import hash_password, verify_password, create_access_token
from app.services.face_service import extract_face_encoding, encoding_to_string
from app.config import settings


def signup_user(db: Session, payload: UserSignup) -> User:
    """Create a new user account (without reference face yet)"""
    # Check if email already exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_verified=False   # will be True after reference selfie upload
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, payload: UserLogin) -> User:
    """Verify email + password and return user"""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    return user


def create_user_token(user: User) -> str:
    """Generate JWT token for a user"""
    return create_access_token(data={"sub": user.email, "user_id": user.id})


async def upload_reference_face(db: Session, user: User, file: UploadFile) -> User:
    """
    Save the reference selfie during signup.
    - Extract face encoding
    - Check face uniqueness (reject if same face exists for another user)
    - Save file to disk
    - Store encoding in DB
    - Mark user as verified
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )

    # Read file bytes
    contents = await file.read()

    # Extract face encoding
    encoding = extract_face_encoding(contents)
    if encoding is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected OR multiple faces detected. Please upload a clear selfie with only your face."
        )

    # 🛡️ DUPLICATE FACE CHECK — reject if this face is already registered
    from app.services.face_service import string_to_encoding, compare_faces, get_face_distance
    existing_users = db.query(User).filter(
        User.id != user.id,
        User.face_encoding.isnot(None)
    ).all()

    for other_user in existing_users:
        try:
            other_encoding = string_to_encoding(other_user.face_encoding)
            if compare_faces(other_encoding, encoding):
                distance = get_face_distance(other_encoding, encoding)
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"This face is already registered with another account. "
                        f"Each person can have only ONE account. "
                        f"(match distance: {distance:.3f})"
                    )
                )
        except HTTPException:
            raise
        except Exception as e:
            print(f"[upload_reference_face] Comparison error for user {other_user.id}: {e}")
            continue

    # Save file to disk
    file_ext = Path(file.filename).suffix or ".jpg"
    filename = f"user_{user.id}_{uuid.uuid4().hex}{file_ext}"
    file_path = settings.REFERENCE_FACE_DIR / filename

    with open(file_path, "wb") as f:
        f.write(contents)

    # Update user record
    user.reference_face_path = f"reference_faces/{filename}"
    user.face_encoding = encoding_to_string(encoding)
    user.is_verified = True

    db.commit()
    db.refresh(user)
    return user

    # Read file bytes
    contents = await file.read()

    # Extract face encoding
    encoding = extract_face_encoding(contents)
    if encoding is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected OR multiple faces detected. Please upload a clear selfie with only your face."
        )

    # Save file to disk
    file_ext = Path(file.filename).suffix or ".jpg"
    filename = f"user_{user.id}_{uuid.uuid4().hex}{file_ext}"
    file_path = settings.REFERENCE_FACE_DIR / filename

    with open(file_path, "wb") as f:
        f.write(contents)

    # Update user record
    user.reference_face_path = f"reference_faces/{filename}"
    user.face_encoding = encoding_to_string(encoding)
    user.is_verified = True

    db.commit()
    db.refresh(user)
    return user


def change_user_password(db: Session, user: User, current_password: str, new_password: str) -> User:
    # Verify current password
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Prevent same password
    if current_password == new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update to new hashed password
    user.hashed_password = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user