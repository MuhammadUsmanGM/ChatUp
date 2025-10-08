# ChatUp - Advanced Chat Interface

ChatUp is an advanced chat application with user authentication, MongoDB integration, and real-time messaging capabilities.

## Features

- User registration and authentication
- Real-time chat interface
- MongoDB database integration for user management
- Responsive design for all devices
- Secure password hashing

## Prerequisites

Before running the application, ensure you have the following installed:

- [Python 3.7+](https://www.python.org/downloads/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [pip](https://pip.pypa.io/en/stable/installation/) (Python package installer)

## Installation

1. **Clone or download the project** to your local machine.

2. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   
   If you don't have a requirements.txt file, install the required packages manually:
   ```bash
   pip install Flask pymongo Flask-CORS Werkzeug
   ```

## MongoDB Setup

1. **Start MongoDB server**:
   - On Windows: Open Command Prompt as Administrator and run `mongod`
   - On macOS/Linux: Run `mongod` in terminal

2. The application expects a MongoDB instance running on `localhost:27017` with a database named `Credentials` and a collection named `User_info`. The application will automatically create these if they don't exist.

## Running the Application

1. **Ensure MongoDB is running**:
   - On Windows: Open Command Prompt as Administrator and run `mongod`
   - On macOS/Linux: Run `mongod` in terminal

2. **Start the backend server** (which also serves frontend files):
   ```bash
   cd frontend
   python server.py
   ```
   
   The server will start on `http://localhost:5000` with debug mode enabled and will serve both the API endpoints and the frontend files.

3. **Access the application**:
   Navigate to `http://localhost:5000` in your web browser to access the ChatUp application.

## Usage

1. **Registration**: Click "Sign Up" to create a new account with your name, email, and password.

2. **Login**: Enter your registered email and password to access the chat interface.

3. **Chat**: Type messages in the input field at the bottom and click the send button or press Enter.

4. **Logout**: Click the "Logout" button in the top-right corner to log out.

## Project Structure

```
frontend/
├── index.html          # Main HTML file
├── server.py           # Flask backend server
├── requirements.txt    # Python dependencies
├── css/
│   └── style.css       # Stylesheet
├── js/
│   ├── auth.js         # Authentication logic
│   └── chat.js         # Chat functionality
├── mongodb_integration.md    # Database setup instructions
└── mongodb_frontend_integration.md  # Integration guide
```

## API Endpoints

- `POST /register` - User registration
- `POST /login` - User authentication
- `POST /chat` - Chat messaging (placeholder implementation)
- `GET /health` - Health check
- `GET /test-db` - Database connection test

## Troubleshooting

- **MongoDB Connection Issues**: Make sure MongoDB is running on `localhost:27017`
- **Port Already in Use**: The server runs on port 5000 by default; change in `server.py` if needed
- **CORS Issues**: The application has CORS enabled to allow frontend communication

## Technologies Used

- **Backend**: Python Flask
- **Database**: MongoDB with PyMongo
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: Werkzeug password hashing
- **CORS**: Flask-CORS for cross-origin requests