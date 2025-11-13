FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway automatically exposes the port, no need to specify EXPOSE here
# The $PORT environment variable is provided by Railway

CMD gunicorn --bind 0.0.0.0:$PORT server:app