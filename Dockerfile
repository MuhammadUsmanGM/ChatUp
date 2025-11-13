FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create a Python script to run the application with proper port handling
RUN echo 'from server import app\nimport os\n\nif __name__ == "__main__":\n    port = int(os.environ.get("PORT", 8000))\n    print(f"Starting server on port {port}")\n    app.run(host="0.0.0.0", port=port, debug=False)' > run_app.py

# Start the application
CMD ["python", "run_app.py"]