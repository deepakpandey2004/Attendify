# ===== Attendify Dockerfile =====
FROM python:3.11-slim

# Prevent Python from writing .pyc + buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install lightweight system dependencies (dlib-bin pre-compiled, no build tools needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create working dir
WORKDIR /app

# Install Python dependencies (cache-friendly layer)
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install dlib-bin==20.0.1 && \
    pip install --no-deps face_recognition face_recognition_models && \
    pip install -r requirements.txt && \
    pip install --force-reinstall bcrypt==4.0.1

# Copy full project
COPY . .

# Create upload directories (persistence via volume in compose)
RUN mkdir -p /app/app/uploads/selfies /app/app/uploads/reference_faces

# Copy entrypoint script and make executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose FastAPI port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run migrations + start server
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]