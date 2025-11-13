# WSGI Application Entry Point for Railway
import os
from server import app

# This file serves as the WSGI application entry point
# Railway will use this to run the application

if __name__ == "__main__":
    # This will only run if this file is executed directly
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)