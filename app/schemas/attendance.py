"""
Pydantic schemas for attendance requests and responses
"""
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List


class AttendanceRecord(BaseModel):
    id: Optional[int] = None
    date: date
    login_time: Optional[datetime] = None
    login_selfie_path: Optional[str] = None
    login_latitude: Optional[float] = None
    login_longitude: Optional[float] = None
    login_address: Optional[str] = None

    logout_time: Optional[datetime] = None
    logout_selfie_path: Optional[str] = None
    logout_latitude: Optional[float] = None
    logout_longitude: Optional[float] = None
    logout_address: Optional[str] = None

    status: str   # "active" | "full_day" | "half_day" | "leave"
    is_auto_logout: bool = False

    class Config:
        from_attributes = True


class AttendanceActionResponse(BaseModel):
    message: str
    success: bool = True
    attendance: AttendanceRecord


class AttendanceHistoryResponse(BaseModel):
    total_days: int
    full_days: int
    half_days: int
    active_days: int = 0
    leaves: int = 0
    records: List[AttendanceRecord]


class TodayStatusResponse(BaseModel):
    date: date
    is_logged_in: bool
    attendance: Optional[AttendanceRecord] = None
    message: str