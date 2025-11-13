import os
from server import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}")
    
    # Use the Flask development server which is more compatible with Railway
    app.run(host="0.0.0.0", port=port, debug=False)