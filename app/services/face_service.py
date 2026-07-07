import json
import numpy as np
import face_recognition
from PIL import Image
from io import BytesIO
from typing import Optional
from app.config import settings


def extract_face_encoding(image_bytes: bytes) -> Optional[np.ndarray]:
    try:
        # Open image and convert to RGB (face_recognition needs RGB)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        image_array = np.array(image)

        # Detect face locations
        face_locations = face_recognition.face_locations(image_array, model="hog")

        if len(face_locations) == 0:
            return None  # no face detected

        if len(face_locations) > 1:
            return None  # multiple faces — reject

        # Get face encoding (128-d vector)
        encodings = face_recognition.face_encodings(image_array, face_locations)
        if not encodings:
            return None

        return encodings[0]
    except Exception as e:
        print(f"[face_service] extract_face_encoding error: {e}")
        return None


def encoding_to_string(encoding: np.ndarray) -> str:
    """Convert numpy array encoding to JSON string for DB storage"""
    return json.dumps(encoding.tolist())


def string_to_encoding(encoding_str: str) -> np.ndarray:
    """Convert JSON string back to numpy array"""
    return np.array(json.loads(encoding_str))


def compare_faces(
    reference_encoding: np.ndarray,
    new_encoding: np.ndarray,
    tolerance: float = None
) -> bool:
    """
    Compare two face encodings.
    Returns True if same person, False otherwise.
    Lower tolerance = stricter match (default 0.6, we use 0.5).
    """
    if tolerance is None:
        tolerance = settings.FACE_MATCH_TOLERANCE

    distance = face_recognition.face_distance([reference_encoding], new_encoding)[0]
    return bool(distance <= tolerance)


def get_face_distance(
    reference_encoding: np.ndarray,
    new_encoding: np.ndarray
) -> float:
    """Return raw distance for logging/debugging (0 = identical, 1 = totally different)"""
    return float(face_recognition.face_distance([reference_encoding], new_encoding)[0])