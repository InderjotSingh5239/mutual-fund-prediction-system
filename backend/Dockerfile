FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /code

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . /code

EXPOSE 8000

ENV PORT=8000

# Shell form so $PORT is expanded at container start — Render (and similar
# PaaS providers) inject PORT dynamically; docker-compose overrides CMD
# anyway (it runs migrations first), so this only matters for `docker run`.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
