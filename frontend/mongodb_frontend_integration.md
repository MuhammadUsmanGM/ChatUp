# Complete ChatUp Application Setup Guide

## Overview
This project includes a complete frontend with login/signup functionality and backend for MongoDB integration. The frontend is fully prepared to connect to MongoDB via the Python backend.

## Database Configuration (as specified)
- **Database Name**: Credentials
- **Collection Name**: User_info
- **Connection URL**: mongodb://localhost:27017

## Project Structure
```
frontend/
├── index.html              # Main HTML file with login/signup and chat UI
├── css/
│   └── style.css           # Advanced styling
├── js/
│   ├── auth.js             # Authentication functionality
│   ├── chat.js             # Chat interface functionality
│   └── auth-api.js         # API functions for auth
├── server.py               # Python backend server
├── requirements.txt        # Python dependencies
├── mongodb_integration.md  # Original MongoDB notes
└── mongodb_frontend_integration.md  # This file
```

## Backend Implementation (server.py)

A complete Python backend has been implemented with:

### 1. User Registration (MongoDB)
- Endpoint: `POST /register`
- Stores user data in MongoDB with hashed passwords
- Prevents duplicate registrations
- Returns success/error responses

### 2. User Login (MongoDB)
- Endpoint: `POST /login`
- Validates credentials against MongoDB
- Returns success/error responses

### 3. Chat Message Processing
- Endpoint: `POST /chat`
- Processes user messages

## MongoDB Collection Schema

### User_info Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String, 
  password: String,  // Hashed using pbkdf2:sha256
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

1. **Password Security**:
   - Passwords are hashed using pbkdf2:sha256
   - Never stored in plain text

2. **Input Validation**:
   - All inputs are validated
   - Required fields are checked

3. **CORS Support**:
   - Enabled for frontend communication

## How to Run the Complete Application

### Step 1: Start MongoDB
1. Make sure MongoDB is installed and running on your system
2. MongoDB should be accessible at `mongodb://localhost:27017`

### Step 2: Set up Python Backend
1. Navigate to the frontend directory
2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the server:
```bash
python server.py
```

The server will run on `http://localhost:5000`

### Step 3: Open the Frontend
1. Open `frontend/index.html` in a web browser
2. The frontend is configured to connect to `http://localhost:5000`

### Step 4: Test the Application
1. Register a new user - data will be stored in MongoDB
2. Login with the registered credentials - validated against MongoDB
3. Use the chat functionality

## API Endpoints

### 1. User Registration
- **Endpoint**: `POST http://localhost:5000/register`
- **Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```
- **Response on Success**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "ObjectId string",
    "name": "string",
    "email": "string"
  }
}
```

### 2. User Login
- **Endpoint**: `POST http://localhost:5000/login`
- **Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response on Success**:
```json
{
  "success": true,
  "message": "Login successful",
  "name": "string",
  "email": "string"
}
```

### 3. Chat Message Processing
- **Endpoint**: `POST http://localhost:5000/chat`
- **Request Body**:
```json
{
  "message": "string",
  "userId": "string"
}
```
- **Response**:
```json
{
  "response": "bot's response message"
}
```

## Authentication Flow (Now Working with MongoDB)

1. User enters credentials in signup form
2. Frontend validates input
3. Frontend makes API call to backend: `POST /register`
4. Backend stores user data in MongoDB with hashed password
5. Backend returns success response
6. User is logged in automatically

## Login Flow (Now Working with MongoDB)

1. User enters credentials in login form
2. Frontend validates input
3. Frontend makes API call to backend: `POST /login`
4. Backend validates credentials against MongoDB
5. Backend returns success/error response
6. User is directed to chat interface on success

## Verification

To verify that MongoDB integration is working:

1. Register a new user
2. Check your MongoDB database to see the user data inserted
3. Try logging in with the registered credentials
4. The login will only work if the credentials match what's stored in MongoDB

The system is now fully functional with actual MongoDB storage and validation!