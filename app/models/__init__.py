"""
Import all models so Alembic can detect them
"""
from app.models.user import User
from app.models.attendance import Attendance, AttendanceStatus
from app.models.alert import Alert

__all__ = ["User", "Attendance", "AttendanceStatus", "Alert"]