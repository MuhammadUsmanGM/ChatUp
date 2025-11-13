# Compatibility script - imports and runs the main application
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run main
from main import app as application

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}")
    application.run(host="0.0.0.0", port=port, debug=False)