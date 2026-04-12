FROM python:3.11-slim

WORKDIR /app

# Install system deps for tree-sitter and git
RUN apt-get update && \
    apt-get install -y --no-install-recommends git build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Set PYTHONPATH so imports resolve correctly
ENV PYTHONPATH=/app

# Create unprivileged user for production safety
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
USER appuser

EXPOSE 8000

# Production: gunicorn with uvicorn workers for concurrency + process management
# Workers default to 4; override via GUNICORN_WORKERS env var
CMD ["gunicorn", "app.main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "4", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
