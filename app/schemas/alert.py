"""
Pydantic schemas for alerts
"""
from pydantic import BaseModel
from datetime import datetime
from typing import List


class AlertResponse(BaseModel):
    id: int
    alert_type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    unread_count: int
    total: int
    alerts: List[AlertResponse]


class MarkReadResponse(BaseModel):
    message: str
    marked_count: int