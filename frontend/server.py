from flask import Flask, request, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# MongoDB Configuration
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "Credentials"
COLLECTION_NAME = "User_info"

# Connect to MongoDB
try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    user_collection = db[COLLECTION_NAME]
    print("Connected to MongoDB successfully")
    print(f"Database: {DB_NAME}")
    print(f"Collection: {COLLECTION_NAME}")
    print(f"Available collections: {db.list_collection_names()}")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

# Registration endpoint
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Extract user data
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        # Validate input
        if not name or not email or not password:
            return jsonify({
                'success': False, 
                'message': 'All fields (name, email, password) are required'
            }), 400
        
        print(f"Attempting to register user: {email}")
        
        # Check if user already exists
        existing_user = user_collection.find_one({'email': email})
        if existing_user:
            print(f"User already exists: {email}")
            return jsonify({
                'success': False, 
                'message': 'User with this email already exists'
            }), 409
        
        # Hash the password
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256', salt_length=10)
        
        # Create user document
        user_document = {
            'name': name,
            'email': email,
            'password': hashed_password,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Insert user into database
        result = user_collection.insert_one(user_document)
        print(f"User registered successfully: {email}, ID: {result.inserted_id}")
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'name': name,
            'email': email,
            'data': {
                'id': str(result.inserted_id),
                'name': name,
                'email': email
            }
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({
            'success': False,
            'message': 'Registration failed due to server error'
        }), 500

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Extract credentials
        email = data.get('email')
        password = data.get('password')
        
        # Validate input
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        print(f"Login attempt for: {email}")
        
        # Find user in database
        user = user_collection.find_one({'email': email})
        if not user:
            print(f"User not found in database: {email}")
            return jsonify({
                'success': False,
                'message': 'Invalid credentials'
            }), 401
        
        # Check password
        if check_password_hash(user['password'], password):
            print(f"Login successful for: {email}")
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'name': user['name'],
                'email': user['email'],
                'data': {
                    'name': user['name'],
                    'email': user['email']
                }
            }), 200
        else:
            print(f"Password incorrect for: {email}")
            return jsonify({
                'success': False,
                'message': 'Invalid credentials'
            }), 401
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': 'Login failed due to server error'
        }), 500

# Chat endpoint (placeholder for now)
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message')
        
        # Log the incoming message for debugging
        print(f"Received chat message: {message}")
        
        # Process the chat message (simple echo for now)
        # You can enhance this with your ChatUp logic
        bot_response = f"I received your message: '{message}'. This is a placeholder response from the backend."
        
        return jsonify({
            'response': bot_response
        }), 200
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({
            'response': "Sorry, I'm having trouble processing your message right now."
        }), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'Server is running', 'database': 'Connected'}), 200

# Test database connection endpoint
@app.route('/test-db', methods=['GET'])
def test_db():
    try:
        # Insert a test document
        test_doc = {
            'test': 'connection',
            'timestamp': datetime.now()
        }
        result = user_collection.insert_one(test_doc)
        # Remove it immediately
        user_collection.delete_one({'_id': result.inserted_id})
        
        return jsonify({
            'success': True,
            'message': 'Database connection working'
        }), 200
    except Exception as e:
        print(f"DB test error: {e}")
        return jsonify({
            'success': False,
            'message': 'Database connection failed'
        }), 500

from flask import send_from_directory
import os

# Serve static files (HTML, CSS, JS)
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/css/<path:filename>')
def css_files(filename):
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def js_files(filename):
    return send_from_directory('js', filename)

@app.route('/assets/<path:filename>')
def asset_files(filename):
    return send_from_directory('assets', filename)

if __name__ == '__main__':
    print("Starting server on http://localhost:5000")
    app.run(debug=True, port=5000)