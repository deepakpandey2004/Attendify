"""
Attendify — FastAPI application entry point
"""
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings

# Register models with SQLAlchemy
from app.models import User, Attendance, Alert  # noqa: F401

# Routers
from app.routers import auth, attendance, alerts

# Scheduler
from app.services.scheduler_service import start_scheduler, shutdown_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(
    title="Attendify API",
    description="Face-verified attendance system with geolocation and auto-logout",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static: uploaded selfies
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# API Routers
app.include_router(auth.router)
app.include_router(attendance.router)
app.include_router(alerts.router)


# ========== FRONTEND SERVING ==========
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")


@app.get("/favicon.ico", include_in_schema=False)
@app.get("/favicon.svg", include_in_schema=False)
def favicon():
    return FileResponse(FRONTEND_DIR / "favicon.svg", media_type="image/svg+xml")


@app.get("/")
def serve_index():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/reference-face")
def serve_reference_face():
    return FileResponse(FRONTEND_DIR / "reference-face.html")


@app.get("/dashboard")
def serve_dashboard():
    return FileResponse(FRONTEND_DIR / "dashboard.html")


@app.get("/history")
def serve_history():
    return FileResponse(FRONTEND_DIR / "history.html")


@app.get("/capture")
def serve_capture():
    return FileResponse(FRONTEND_DIR / "capture.html")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "attendify"}


@app.get("/api")
def api_info():
    return {
        "service": "Attendify API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }