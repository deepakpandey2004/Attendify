"""
Attendance routes: login, logout, today status, history
"""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.attendance import AttendanceStatus
from app.schemas.attendance import (
    AttendanceActionResponse,
    AttendanceHistoryResponse,
    TodayStatusResponse,
)
from app.services import attendance_service
from app.utils.dependencies import get_verified_user

router = APIRouter(prefix="/api/v1/attendance", tags=["Attendance"])


@router.post(
    "/login",
    response_model=AttendanceActionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def attendance_login(
    file: UploadFile = File(..., description="Selfie image"),
    latitude: float = Form(..., description="Current GPS latitude"),
    longitude: float = Form(..., description="Current GPS longitude"),
    address: Optional[str] = Form(None, description="Optional readable address"),
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    """
    Mark daily LOGIN attendance.
    Requires: selfie + GPS location.
    Face is verified against reference selfie uploaded at signup.
    """
    attendance = await attendance_service.mark_login(
        db, current_user, file, latitude, longitude, address
    )
    return AttendanceActionResponse(
        message="Login attendance marked successfully! Have a great workday 🎉",
        attendance=attendance,
    )


@router.post("/logout", response_model=AttendanceActionResponse)
async def attendance_logout(
    file: UploadFile = File(..., description="Selfie image"),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: Optional[str] = Form(None),
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    """
    Mark daily LOGOUT attendance.
    Must have an active login for today.
    """
    attendance = await attendance_service.mark_logout(
        db, current_user, file, latitude, longitude, address
    )
    return AttendanceActionResponse(
        message="Logout attendance marked successfully! See you tomorrow 👋",
        attendance=attendance,
    )


@router.get("/today", response_model=TodayStatusResponse)
def get_today_status(
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    """Get today's attendance status for current user"""
    attendance = attendance_service.get_today_attendance(db, current_user.id)

    if not attendance:
        return TodayStatusResponse(
            date=date.today(),
            is_logged_in=False,
            attendance=None,
            message="No attendance marked yet today. Please login.",
        )

    is_active = attendance.status == AttendanceStatus.ACTIVE
    msg = (
        "You are currently logged in. Don't forget to logout by 10 PM."
        if is_active
        else f"Today's attendance: {attendance.status.value}."
    )
    return TodayStatusResponse(
        date=attendance.date,
        is_logged_in=is_active,
        attendance=attendance,
        message=msg,
    )


@router.get("/history", response_model=AttendanceHistoryResponse)
def get_history(
    limit: int = 200,
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    """
    Get attendance history including LEAVES (weekdays with no attendance).
    Skips weekends. Returns records + stats.
    """
    records = attendance_service.get_attendance_with_leaves(db, current_user, limit)
    stats = attendance_service.get_leave_stats(records)
    return AttendanceHistoryResponse(
        total_days=stats["total_days"],
        full_days=stats["full_days"],
        half_days=stats["half_days"],
        active_days=stats["active_days"],
        leaves=stats["leaves"],
        records=records,
    )