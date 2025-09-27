# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.13-slim

FROM python:${PYTHON_VERSION} AS builder
ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VENV_PATH=/opt/venv
WORKDIR /app


RUN python -m venv $VENV_PATH
ENV PATH="$VENV_PATH/bin:$PATH"

COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install -r requirements.txt


FROM python:${PYTHON_VERSION}
ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VENV_PATH=/opt/venv \
    PORT=8000
WORKDIR /app


# Create non-root runtime user
RUN useradd --create-home --home-dir /home/appuser --shell /bin/bash appuser

# Copy the prebuilt virtualenv from builder stage
COPY --from=builder $VENV_PATH $VENV_PATH
ENV PATH="$VENV_PATH/bin:$PATH"

# Copy application source
COPY . .
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000


# Use uvicorn to serve FastAPI app
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT} --proxy-headers"]


