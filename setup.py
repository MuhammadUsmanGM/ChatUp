from setuptools import setup, find_packages

setup(
    name="chattup",
    version="1.0.0",
    description="Advanced AI Chat Interface",
    packages=find_packages(),
    install_requires=[
        "Flask==2.3.3",
        "pymongo==4.5.0",
        "Flask-CORS==4.0.0",
        "Werkzeug==2.3.7",
        "openai-agents",
        "python-dotenv",
        "tavily-python",
        "dnspython",
        "gunicorn==21.2.0",
    ],
)