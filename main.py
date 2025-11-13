# main.py - Primary application entry point for Railway
import os
from server import app

if __name__ == "__main__":
    # Get the port from environment variable, with a default fallback
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting ChatUp server on port {port}")
    
    # Run the Flask application
    app.run(host="0.0.0.0", port=port, debug=False)