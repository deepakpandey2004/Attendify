import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # JWT / Security
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

    # Upload folders
    UPLOAD_DIR: Path = BASE_DIR / "app" / "uploads"
    SELFIE_DIR: Path = UPLOAD_DIR / "selfies"
    REFERENCE_FACE_DIR: Path = UPLOAD_DIR / "reference_faces"

    # Face recognition
    FACE_MATCH_TOLERANCE: float = 0.5  

    # Attendance rules
    ALERT_START_HOUR: int = 22       # 10 PM = start alerts
    ALERT_INTERVAL_MINUTES: int = 30 # every 30 min alert
    AUTO_LOGOUT_HOUR: int = 23       # 11 PM
    AUTO_LOGOUT_MINUTE: int = 59     # :59 → 11:59 PM auto logout

    # Ensure upload dirs exist
    def __init__(self):
        self.SELFIE_DIR.mkdir(parents=True, exist_ok=True)
        self.REFERENCE_FACE_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()