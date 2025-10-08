from flask import Flask, request, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from flask_cors import CORS
import subprocess
import sys

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
        import secrets
        verification_token = secrets.token_urlsafe(32)  # Generate a secure token
        
        user_document = {
            'name': name,
            'email': email,
            'password': hashed_password,
            'email_verified': False,
            'verification_token': verification_token,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Insert user into database
        result = user_collection.insert_one(user_document)
        print(f"User registered successfully: {email}, ID: {result.inserted_id}")
        
        # Send verification email
        verification_sent = send_verification_email(email, name, user_document['verification_token'])
        if not verification_sent:
            print(f"Failed to send verification email to {email}")
            # We'll still return success but log the failure
            return jsonify({
                'success': True,
                'message': 'User registered successfully, but verification email could not be sent. Please contact support if you do not receive it.',
                'name': name,
                'email': email,
                'data': {
                    'id': str(result.inserted_id),
                    'name': name,
                    'email': email
                }
            }), 201
        else:
            return jsonify({
                'success': True,
                'message': 'User registered successfully! Please check your email to verify your account.',
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
        
        # Check if email is verified
        if not user.get('email_verified', False):
            print(f"User {email} attempted login but email is not verified")
            return jsonify({
                'success': False,
                'message': 'Please verify your email address before logging in. Check your email for a verification link.'
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


import subprocess
import sys
import os
import tempfile

# Function to run the agent with a given input
def run_chat_agent(user_input):
    """
    Runs the chat agent with the provided input and returns the response.
    This function executes the agent in a separate Python process to avoid asyncio issues.
    """
    try:
        # Path to the backend directory
        backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
        
        # Create a temporary script to run the agent
        temp_script_content = f'''import sys
import os
sys.path.insert(0, r'{backend_path}')

# Change to the backend directory to load .env properly
original_cwd = os.getcwd()
os.chdir(r'{backend_path}')

try:
    from dotenv import load_dotenv
    load_dotenv()  # Load environment variables
    
    # Import the required modules with fallbacks
    try:
        from agents import Agent, Runner, AsyncOpenAI, set_default_openai_client, set_tracing_disabled, OpenAIChatCompletionsModel, set_default_openai_api
    except ImportError:
        try:
            from openai_agents import Agent, Runner, AsyncOpenAI, set_default_openai_client, set_tracing_disabled, OpenAIChatCompletionsModel, set_default_openai_api
        except ImportError:
            from agently import Agent, Runner, AsyncOpenAI, set_default_openai_client, set_tracing_disabled, OpenAIChatCompletionsModel, set_default_openai_api
    
    # Initialize the API client
    import os
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        print("ERROR: API key not found")
        sys.exit(1)
    
    external_client = AsyncOpenAI(
        api_key=gemini_api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )
    set_default_openai_client(external_client)
    set_default_openai_api("chat_completions")
    set_tracing_disabled(True)
    model = OpenAIChatCompletionsModel(
        model="gemini-2.0-flash",
        openai_client=external_client
    )

    # Create and run the agent with the user input
    agent = Agent(
        name="Assistant",
        instructions="A helpful assistant.",
        model=model
    )
    result = Runner.run_sync(
        starting_agent=agent,
        input="{user_input}"
    )
    
    print(result.final_output, end='')  # Print result without extra newline
    
except Exception as e:
    print(f"ERROR: {{str(e)}}")
finally:
    os.chdir(original_cwd)  # Restore original working directory
'''
        
        # Create and execute the temporary script
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
            temp_file.write(temp_script_content)
            temp_script_path = temp_file.name

        # Execute the temporary script
        result = subprocess.run(
            [sys.executable, temp_script_path], 
            capture_output=True, 
            text=True, 
            timeout=30  # 30 second timeout
        )
        
        # Clean up the temporary script
        os.unlink(temp_script_path)
        
        if result.returncode == 0:
            # Return the response, stripping "ERROR:" if it's not actually an error
            output = result.stdout.strip()
            if output.startswith("ERROR:"):
                print(f"Agent execution error: {output}")
                return "I'm having trouble processing your request. Please try again later."
            return output
        else:
            print(f"Agent execution error: {result.stderr}")
            return "I'm having trouble processing your request. Please try again later."
            
    except subprocess.TimeoutExpired:
        print("Agent execution timed out")
        return "The request is taking too long to process. Please try again."
    except Exception as e:
        print(f"Chat agent error: {e}")
        import traceback
        traceback.print_exc()
        return "I'm having trouble connecting to the chat agent. Please try again later."


# Email verification endpoint
@app.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    try:
        # Find user with the provided verification token
        user = user_collection.find_one({'verification_token': token})
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid or expired verification token.'
            }), 400
        
        # Update user to mark email as verified
        user_collection.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'email_verified': True,
                    'verification_token': None  # Remove the token after verification
                }
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Email verified successfully! You can now log in to your account.'
        }), 200
        
    except Exception as e:
        print(f"Email verification error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred during email verification.'
        }), 500


# Resend verification email endpoint
@app.route('/resend-verification', methods=['POST'])
def resend_verification():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({
                'success': False,
                'message': 'Email is required'
            }), 400
        
        # Find user by email
        user = user_collection.find_one({'email': email})
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Check if user is already verified
        if user.get('email_verified', False):
            return jsonify({
                'success': False,
                'message': 'Email is already verified'
            }), 400
        
        # Generate a new verification token
        import secrets
        new_token = secrets.token_urlsafe(32)
        
        # Update user with new token
        user_collection.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'verification_token': new_token
                }
            }
        )
        
        # Send verification email with new token
        verification_sent = send_verification_email(email, user['name'], new_token)
        if not verification_sent:
            return jsonify({
                'success': False,
                'message': 'Failed to send verification email. Please try again later.'
            }), 500
        else:
            return jsonify({
                'success': True,
                'message': 'Verification email has been sent successfully!'
            }), 200
            
    except Exception as e:
        print(f"Resend verification error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while resending verification email.'
        }), 500

# Change password endpoint
@app.route('/change-password', methods=['POST'])
def change_password():
    try:
        # Get the user's token (in a real app, you'd decode the JWT token)
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        data = request.get_json()
        old_password = data.get('oldPassword')
        new_password = data.get('newPassword')
        email = data.get('email')  # Get email from request
        
        if not old_password or not new_password or not email:
            return jsonify({
                'success': False,
                'message': 'Old password, new password, and email are required'
            }), 400
        
        if len(new_password) < 6:
            return jsonify({
                'success': False,
                'message': 'New password must be at least 6 characters long'
            }), 400
        
        # Find the user in the database
        user = user_collection.find_one({'email': email})
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Verify the old password
        if not check_password_hash(user['password'], old_password):
            return jsonify({
                'success': False,
                'message': 'Current password is incorrect'
            }), 401
        
        # Hash the new password
        hashed_new_password = generate_password_hash(new_password, method='pbkdf2:sha256', salt_length=10)
        
        # Update the user's password in the database
        user_collection.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'password': hashed_new_password,
                    'updatedAt': datetime.now()
                }
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully!'
        }), 200
        
    except Exception as e:
        print(f"Change password error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while changing your password.'
        }), 500

# Update profile endpoint
@app.route('/update-profile', methods=['POST'])
def update_profile():
    try:
        # Get the user's token (in a real app, you'd decode the JWT token)
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        data = request.get_json()
        new_name = data.get('name')
        email = data.get('email')  # Get email from request
        
        if not new_name or not email:
            return jsonify({
                'success': False,
                'message': 'Name and email are required'
            }), 400
        
        # Find the user in the database
        user = user_collection.find_one({'email': email})
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Update the user's name in the database
        user_collection.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'name': new_name,
                    'updatedAt': datetime.now()
                }
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully!',
            'data': {
                'name': new_name,
                'email': email
            }
        }), 200
        
    except Exception as e:
        print(f"Update profile error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while updating your profile.'
        }), 500


# Function to send verification email
def send_verification_email(email, name, token):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    # Email configuration - you can use environment variables for these
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    sender_email = os.getenv('EMAIL_ADDRESS')
    sender_password = os.getenv('EMAIL_PASSWORD')
    
    if not sender_email or not sender_password:
        print("Email configuration missing. Please set EMAIL_ADDRESS and EMAIL_PASSWORD environment variables.")
        return False
    
    try:
        # Create the verification link - using configurable base URL for production
        import os
        base_url = os.getenv('BASE_URL', 'http://localhost:5000')  # Set this to your production URL
        verification_link = f"{base_url}/verify-email/{token}"
        
        # Create the email
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = email
        msg['Subject'] = "Verify Your Email Address - ChatUp"
        
        body = f"""
        Hello {name},
        
        Thank you for registering with ChatUp! Please click the link below to verify your email address:
        
        {verification_link}
        
        If you did not register for ChatUp, please ignore this email.
        
        Best regards,
        The ChatUp Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to server and send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, email, text)
        server.quit()
        
        print(f"Verification email sent to {email}")
        return True
        
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return False


# Delete account endpoint
@app.route('/delete-account', methods=['DELETE'])
def delete_account():
    try:
        # Get the user's token (in a real app, you'd decode the JWT token)
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        data = request.get_json()
        email = data.get('email')  # Get email from request
        password = data.get('password')  # Get password from request
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # Find the user in the database
        user = user_collection.find_one({'email': email})
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Verify the password
        if not check_password_hash(user['password'], password):
            return jsonify({
                'success': False,
                'message': 'Password is incorrect'
            }), 401
        
        # Delete the user from the database
        result = user_collection.delete_one({'_id': user['_id']})
        
        if result.deleted_count == 1:
            return jsonify({
                'success': True,
                'message': 'Account deleted successfully!'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to delete account. Please try again.'
            }), 500
        
    except Exception as e:
        print(f"Delete account error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while deleting your account.'
        }), 500


# Chat endpoint that integrates with the backend agent
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message')
        
        # Log the incoming message for debugging
        print(f"Received chat message: {message}")
        
        # Get response from the backend agent
        bot_response = run_chat_agent(message)
        
        return jsonify({
            'response': bot_response
        }), 200
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({
            'response': "Sorry, I'm having trouble processing your message right now."
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

@app.route('/images/<path:filename>')
def image_files(filename):
    return send_from_directory('../images', filename)

if __name__ == '__main__':
    print("Starting server on http://localhost:5000")
    app.run(debug=True, port=5000)