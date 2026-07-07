"""
Scheduler service:
- Runs background jobs (alerts + auto-logout)
- Uses APScheduler
"""
from datetime import datetime, date, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.attendance import Attendance, AttendanceStatus
from app.models.alert import Alert
from app.config import settings

# Global scheduler instance
scheduler = BackgroundScheduler(timezone="Asia/Kolkata")


def _create_alert(db: Session, user_id: int, alert_type: str, title: str, message: str):
    """Helper: insert an alert into DB"""
    alert = Alert(
        user_id=user_id,
        alert_type=alert_type,
        title=title,
        message=message,
    )
    db.add(alert)


def send_logout_reminders():
    """
    Job runs every 30 min between 10:00 PM and 11:30 PM.
    Sends a reminder to each user still logged in.
    """
    db: Session = SessionLocal()
    try:
        today = date.today()
        active_attendances = (
            db.query(Attendance)
            .filter(
                Attendance.date == today,
                Attendance.status == AttendanceStatus.ACTIVE,
            )
            .all()
        )
        if not active_attendances:
            print(f"[Scheduler] {datetime.now()} - No active users. Skipping reminder.")
            return

        for att in active_attendances:
            _create_alert(
                db,
                user_id=att.user_id,
                alert_type="logout_reminder",
                title="⏰ Please logout!",
                message=(
                    "You are still logged in. Please mark your logout attendance. "
                    "If you don't logout by 11:59 PM, your day will be marked as HALF DAY."
                ),
            )
        db.commit()
        print(f"[Scheduler] {datetime.now()} - Sent {len(active_attendances)} logout reminders.")
    except Exception as e:
        db.rollback()
        print(f"[Scheduler] send_logout_reminders ERROR: {e}")
    finally:
        db.close()


def auto_logout_pending_users():
    """
    Job runs at 11:59 PM.
    Auto-logs out any user still ACTIVE and marks their day as HALF_DAY.
    """
    db: Session = SessionLocal()
    try:
        today = date.today()
        active_attendances = (
            db.query(Attendance)
            .filter(
                Attendance.date == today,
                Attendance.status == AttendanceStatus.ACTIVE,
            )
            .all()
        )
        if not active_attendances:
            print(f"[Scheduler] {datetime.now()} - No pending auto-logouts.")
            return

        now = datetime.now(timezone.utc)
        for att in active_attendances:
            att.logout_time = now
            att.status = AttendanceStatus.HALF_DAY
            att.is_auto_logout = True
            # Note: no logout selfie/location since it's automated

            _create_alert(
                db,
                user_id=att.user_id,
                alert_type="auto_logout",
                title="⚠️ Auto-logged out (Half Day)",
                message=(
                    "You didn't logout by 11:59 PM. System has auto-logged you out "
                    "and marked today as HALF DAY."
                ),
            )

        db.commit()
        print(f"[Scheduler] {datetime.now()} - Auto-logged out {len(active_attendances)} users.")
    except Exception as e:
        db.rollback()
        print(f"[Scheduler] auto_logout_pending_users ERROR: {e}")
    finally:
        db.close()


def start_scheduler():
    """Register jobs + start the scheduler. Call on app startup."""
    if scheduler.running:
        return

    # Logout reminders: 10:00, 10:30, 11:00, 11:30 PM
    scheduler.add_job(
        send_logout_reminders,
        CronTrigger(hour="22-23", minute="0,30"),
        id="logout_reminders",
        replace_existing=True,
    )

    # Auto-logout: 11:59 PM daily
    scheduler.add_job(
        auto_logout_pending_users,
        CronTrigger(
            hour=settings.AUTO_LOGOUT_HOUR,
            minute=settings.AUTO_LOGOUT_MINUTE,
        ),
        id="auto_logout",
        replace_existing=True,
    )

    scheduler.start()
    print("[Scheduler] Started ✅ — jobs registered:")
    for job in scheduler.get_jobs():
        print(f"  • {job.id} → next run: {job.next_run_time}")


def shutdown_scheduler():
    """Stop scheduler cleanly on app shutdown"""
    if scheduler.running:
        scheduler.shutdown()
        print("[Scheduler] Stopped 🛑")