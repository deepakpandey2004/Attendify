"""
Attendance service: login/logout with face verification + geolocation
"""
import uuid
from datetime import datetime, date, timezone
from pathlib import Path
from typing import Optional, Tuple, List
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.user import User
from app.models.attendance import Attendance, AttendanceStatus
from app.services.face_service import (
    extract_face_encoding,
    string_to_encoding,
    compare_faces,
    get_face_distance,
)
from app.config import settings


async def _verify_face_and_save_selfie(
    user: User, file: UploadFile, action: str
) -> Tuple[str, bytes]:
    """
    Common helper: validate image, extract face, compare with reference,
    save selfie to disk. Returns (relative_path, file_bytes).
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )

    contents = await file.read()

    new_encoding = extract_face_encoding(contents)
    if new_encoding is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected OR multiple faces detected. Please take a clear selfie.",
        )

    if not user.face_encoding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No reference face on file. Please upload your reference selfie first.",
        )
    reference_encoding = string_to_encoding(user.face_encoding)

    if not compare_faces(reference_encoding, new_encoding):
        distance = get_face_distance(reference_encoding, new_encoding)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"User photo not matched. Face does not match reference. (distance={distance:.3f})",
        )

    file_ext = Path(file.filename).suffix or ".jpg"
    filename = f"user_{user.id}_{action}_{uuid.uuid4().hex}{file_ext}"
    file_path = settings.SELFIE_DIR / filename
    with open(file_path, "wb") as f:
        f.write(contents)

    return f"selfies/{filename}", contents


def get_today_attendance(db: Session, user_id: int) -> Optional[Attendance]:
    """Get today's attendance record for a user (if exists)"""
    today = date.today()
    return (
        db.query(Attendance)
        .filter(Attendance.user_id == user_id, Attendance.date == today)
        .first()
    )


async def mark_login(
    db: Session,
    user: User,
    file: UploadFile,
    latitude: float,
    longitude: float,
    address: Optional[str] = None,
) -> Attendance:
    """Mark login attendance"""
    existing = get_today_attendance(db, user.id)
    if existing:
        if existing.status == AttendanceStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already logged in. Please logout first.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Attendance for today already marked as {existing.status.value}.",
            )

    selfie_path, _ = await _verify_face_and_save_selfie(user, file, "login")

    now = datetime.now(timezone.utc)
    attendance = Attendance(
        user_id=user.id,
        date=date.today(),
        login_time=now,
        login_selfie_path=selfie_path,
        login_latitude=latitude,
        login_longitude=longitude,
        login_address=address,
        status=AttendanceStatus.ACTIVE,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


async def mark_logout(
    db: Session,
    user: User,
    file: UploadFile,
    latitude: float,
    longitude: float,
    address: Optional[str] = None,
) -> Attendance:
    """Mark logout attendance"""
    attendance = get_today_attendance(db, user.id)
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You haven't logged in today. Please login first.",
        )

    if attendance.status != AttendanceStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Already logged out today (status: {attendance.status.value}).",
        )

    selfie_path, _ = await _verify_face_and_save_selfie(user, file, "logout")

    attendance.logout_time = datetime.now(timezone.utc)
    attendance.logout_selfie_path = selfie_path
    attendance.logout_latitude = latitude
    attendance.logout_longitude = longitude
    attendance.logout_address = address
    attendance.status = AttendanceStatus.FULL_DAY

    db.commit()
    db.refresh(attendance)
    return attendance


def get_attendance_history(
    db: Session, user_id: int, limit: int = 100
) -> List[Attendance]:
    """Get user's attendance history (newest first)"""
    return (
        db.query(Attendance)
        .filter(Attendance.user_id == user_id)
        .order_by(desc(Attendance.date))
        .limit(limit)
        .all()
    )


def get_attendance_stats(records: List[Attendance]) -> dict:
    """Compute summary stats"""
    total = len(records)
    full_days = sum(1 for r in records if r.status == AttendanceStatus.FULL_DAY)
    half_days = sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY)
    return {"total_days": total, "full_days": full_days, "half_days": half_days}


def get_attendance_with_leaves(
    db: Session, user: User, limit: int = 200
) -> List[dict]:
    """
    Get attendance records + auto-fill LEAVE for missing weekdays.
    Returns list of dicts.
    """
    from datetime import timedelta

    records = (
        db.query(Attendance)
        .filter(Attendance.user_id == user.id)
        .order_by(desc(Attendance.date))
        .limit(limit)
        .all()
    )

    result = []
    record_dates = set()
    for r in records:
        record_dates.add(r.date)
        # Convert enum to string value for consistent comparison
        status_str = r.status.value if hasattr(r.status, 'value') else str(r.status)
        result.append({
            "id": r.id,
            "date": r.date,
            "login_time": r.login_time,
            "login_selfie_path": r.login_selfie_path,
            "login_latitude": r.login_latitude,
            "login_longitude": r.login_longitude,
            "login_address": r.login_address,
            "logout_time": r.logout_time,
            "logout_selfie_path": r.logout_selfie_path,
            "logout_latitude": r.logout_latitude,
            "logout_longitude": r.logout_longitude,
            "logout_address": r.logout_address,
            "status": status_str,
            "is_auto_logout": r.is_auto_logout or False,
        })

    # Determine range: from user signup date to today
    try:
        start_date = user.created_at.date() if user.created_at else date.today()
    except Exception:
        start_date = date.today()

    # Leaves are counted only up to YESTERDAY (today is not yet over)
    end_date = date.today() - timedelta(days=1)

    # Iterate: mark missing weekdays as LEAVE
    current = start_date
    while current <= end_date:
        # weekday(): Mon=0 ... Sat=5, Sun=6
        if current.weekday() < 5 and current not in record_dates:
            result.append({
                "id": None,
                "date": current,
                "login_time": None,
                "login_selfie_path": None,
                "login_latitude": None,
                "login_longitude": None,
                "login_address": None,
                "logout_time": None,
                "logout_selfie_path": None,
                "logout_latitude": None,
                "logout_longitude": None,
                "logout_address": None,
                "status": "leave",
                "is_auto_logout": False,
            })
        current += timedelta(days=1)

    # Sort newest first
    result.sort(key=lambda x: x["date"], reverse=True)
    return result


def get_leave_stats(records: List[dict]) -> dict:
    """Compute stats from mixed records list"""
    total = len(records)
    full_days = sum(1 for r in records if r["status"] == "full_day")
    half_days = sum(1 for r in records if r["status"] == "half_day")
    active_days = sum(1 for r in records if r["status"] == "active")
    leaves = sum(1 for r in records if r["status"] == "leave")
    return {
        "total_days": total,
        "full_days": full_days,
        "half_days": half_days,
        "active_days": active_days,
        "leaves": leaves,
    }