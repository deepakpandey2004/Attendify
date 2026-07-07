"""
Alert model - stores notifications sent to users (e.g., logout reminders)
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    alert_type = Column(String(50), nullable=False)   # e.g. "logout_reminder", "auto_logout"
    title = Column(String(200), nullable=False)
    message = Column(String(500), nullable=False)

    is_read = Column(Boolean, default=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User")

    def __repr__(self):
        return f"<Alert user_id={self.user_id} type={self.alert_type}>"