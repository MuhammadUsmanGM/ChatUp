import os
from gunicorn.app.base import BaseApplication
from server import app

class StandaloneApplication(BaseApplication):
    def __init__(self, application, options=None):
        self.application = application
        self.options = options or {}
        super().__init__()

    def load_config(self):
        config = {key: value for key, value in self.options.items()
                  if key in self.cfg.settings and value is not None}
        for key, value in config.items():
            self.cfg.set(key.lower(), value)

    def load(self):
        return self.application

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    options = {
        'bind': f'0.0.0.0:{port}',
        'workers': 4,
        'timeout': 120,
        'keepalive': 5,
        'max_requests': 1000,
        'max_requests_jitter': 100,
    }
    StandaloneApplication(app, options).run()