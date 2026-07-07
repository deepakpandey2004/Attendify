"""
Alerts routes: fetch and mark as read
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.alert import Alert
from app.schemas.alert import AlertListResponse, MarkReadResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])


@router.get("", response_model=AlertListResponse)
def get_my_alerts(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all alerts for current user (newest first)"""
    alerts = (
        db.query(Alert)
        .filter(Alert.user_id == current_user.id)
        .order_by(desc(Alert.created_at))
        .limit(limit)
        .all()
    )
    unread = sum(1 for a in alerts if not a.is_read)
    return AlertListResponse(unread_count=unread, total=len(alerts), alerts=alerts)


@router.post("/mark-all-read", response_model=MarkReadResponse)
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all alerts as read for current user"""
    count = (
        db.query(Alert)
        .filter(Alert.user_id == current_user.id, Alert.is_read == False)  # noqa: E712
        .update({"is_read": True})
    )
    db.commit()
    return MarkReadResponse(message="All alerts marked as read", marked_count=count)