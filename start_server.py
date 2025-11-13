import os
from server import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}")
    
    # Use gunicorn if available, otherwise use Flask's development server
    try:
        from gunicorn.app.base import BaseApplication
        
        class GunicornApplication(BaseApplication):
            def __init__(self, app, options=None):
                self.options = options or {}
                self.application = app
                super().__init__()

            def load_config(self):
                config = {key: value for key, value in self.options.items()
                          if key in self.cfg.settings and value is not None}
                for key, value in config.items():
                    self.cfg.set(key.lower(), value)

            def load(self):
                return self.application

        options = {
            "bind": f"0.0.0.0:{port}",
            "workers": 3,
            "timeout": 120,
            "keepalive": 5,
            "max_requests": 1000,
            "max_requests_jitter": 100,
            "preload_app": True,
        }
        GunicornApplication(app, options).run()
    except ImportError:
        # If gunicorn is not available, use Flask's development server
        print("Gunicorn not found, using Flask development server")
        app.run(host="0.0.0.0", port=port, debug=False)