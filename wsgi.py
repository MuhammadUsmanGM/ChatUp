# WSGI entry point for the application
from server import app

# This is the standard WSGI callable
application = app

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)