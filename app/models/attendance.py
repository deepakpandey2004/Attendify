from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class AttendanceStatus(str, enum.Enum):
    ACTIVE = "active"       # logged in, not yet logged out
    FULL_DAY = "full_day"   # logged in + logged out normally
    HALF_DAY = "half_day"   # auto-logout at 11:59 PM


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Date of attendance
    date = Column(Date, nullable=False, index=True)

    # LOGIN details
    login_time = Column(DateTime(timezone=True), nullable=False)
    login_selfie_path = Column(String(255), nullable=False)
    login_latitude = Column(Float, nullable=False)
    login_longitude = Column(Float, nullable=False)
    login_address = Column(String(500), nullable=True)

    # LOGOUT details (nullable — filled later)
    logout_time = Column(DateTime(timezone=True), nullable=True)
    logout_selfie_path = Column(String(255), nullable=True)
    logout_latitude = Column(Float, nullable=True)
    logout_longitude = Column(Float, nullable=True)
    logout_address = Column(String(500), nullable=True)

    # Status
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.ACTIVE, nullable=False)

    # Auto-logout flag
    is_auto_logout = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship back to user
    user = relationship("User", back_populates="attendances")

    def __repr__(self):
        return f"<Attendance user_id={self.user_id} date={self.date} status={self.status}>"