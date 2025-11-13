from flask import Flask, request, jsonify, send_from_directory, send_file
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from flask_cors import CORS
import subprocess
import sys
import secrets

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# MongoDB Configuration
import os
from urllib.parse import quote_plus
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "Credentials")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "User_info")

# If using MongoDB Atlas and credentials are in the connection string, ensure they are properly encoded
if "mongodb+srv://" in MONGO_URI:
    # Parse the MongoDB Atlas connection string to properly encode credentials
    from urllib.parse import urlparse, urlunparse
    parsed = urlparse(MONGO_URI)
    
    # Extract username and password
    username = parsed.username
    password = parsed.password
    
    # If credentials exist, re-encode them properly
    if username and password:
        # Create new netloc with properly encoded credentials
        encoded_username = quote_plus(username)
        encoded_password = quote_plus(password)
        encoded_netloc = f"{encoded_username}:{encoded_password}@{parsed.hostname}"
        
        # If there are additional hosts in the netloc (for clusters), preserve them
        if parsed.port:
            encoded_netloc += f":{parsed.port}"
        
        # Reconstruct the URL with encoded credentials
        MONGO_URI = parsed._replace(netloc=encoded_netloc).geturl()

# Connect to MongoDB with SSL settings for Atlas
try:
    client = MongoClient(MONGO_URI, 
                         tls=True, 
                         tlsAllowInvalidCertificates=True,
                         serverSelectionTimeoutMS=30000)
    db = client[DB_NAME]
    user_collection = db[COLLECTION_NAME]
    # Create a separate collection for chat history
    chat_history_collection = db['Chat_History']
    print("Connected to MongoDB successfully")
    print(f"Database: {DB_NAME}")
    print(f"Collection: {COLLECTION_NAME}")
    print(f"Available collections: {db.list_collection_names()}")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    # Exit the application if database connection fails
    import sys
    sys.exit(1)


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
        backend_path = os.path.join(os.path.dirname(__file__), 'backend')
        
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

    # Import Tavily for web search
    try:
        from tavily import TavilyClient
    except ImportError:
        print("AGENT_ERROR: tavily-python library not installed")
        sys.exit(1)
    
    # Initialize the API client
    import os
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not gemini_api_key:
        print("AGENT_ERROR: GEMINI_API_KEY not found")
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

    # Import the function_tool decorator
    try:
        from agents import function_tool
    except ImportError:
        print("AGENT_ERROR: function_tool not available in agents library")
        sys.exit(1)

    # Initialize Tavily client for web search
    tavily_client = TavilyClient(api_key=tavily_api_key) if tavily_api_key else None

    @function_tool()
    def search_web(query: str) -> str:
        """
        Function to search the web using Tavily API
        """
        if not tavily_client:
            return "Web search is not available. Tavily API key is not configured."
        
        try:
            response = tavily_client.search(query, max_results=5)
            results = []
            for result in response['results']:
                results.append(f"Title: {{result['title']}}\\nURL: {{result['url']}}\\nContent: {{result['content'][:500]}}...\\n")
            
            return "\\n".join(results)
        except Exception as e:
            return f"Web search failed: {{str(e)}}"

    # Create and run the agent with the user input
    agent = Agent(
        name="Assistant",
        instructions="A helpful assistant. You can use the search_web tool to search the web for current information when needed.",
        model=model,
        tools=[search_web]  # Add the web search tool
    )
    result = Runner.run_sync(
        starting_agent=agent,
        input="{user_input}"
    )
    
    print(result.final_output, end='')  # Print result without extra newline
    
except Exception as e:
    print(f"AGENT_ERROR: {{str(e)}}")
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
            timeout=60  # Increased timeout to 60 seconds for web search
        )
        
        # Clean up the temporary script
        os.unlink(temp_script_path)
        
        if result.returncode == 0:
            # Return the response, checking specifically for our AGENT_ERROR marker
            output = result.stdout.strip()
            if output.startswith("AGENT_ERROR:"):
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


# Email verification endpoint - serves the HTML page
@app.route('/verify-email/<token>', methods=['GET'])
def verify_email_page(token):
    try:
        # Find user with the provided verification token
        user = user_collection.find_one({'verification_token': token})
        
        if not user:
            # Return the verification page with an error message
            return '''
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification Failed - ChatUp</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }

                    body {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }

                    .container {
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                        padding: 60px 40px;
                        text-align: center;
                        max-width: 500px;
                        width: 100%;
                        position: relative;
                        overflow: hidden;
                    }

                    .container::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 8px;
                        background: linear-gradient(90deg, #f44336, #d32f2f);
                    }

                    .icon {
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #f44336, #d32f2f);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 20px;
                    }

                    .icon svg {
                        width: 50px;
                        height: 50px;
                        fill: white;
                    }

                    h1 {
                        color: #333;
                        font-size: 2.5rem;
                        margin-bottom: 15px;
                        font-weight: 600;
                    }

                    .error-message {
                        color: #f44336;
                        font-size: 1.2rem;
                        margin-bottom: 30px;
                        font-weight: 500;
                    }

                    .description {
                        color: #666;
                        font-size: 1rem;
                        margin-bottom: 30px;
                        line-height: 1.6;
                    }

                    .btn {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        font-size: 1rem;
                        border-radius: 50px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-decoration: none;
                        display: inline-block;
                        font-weight: 500;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    }

                    .btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                    }

                    .btn:active {
                        transform: translateY(0);
                    }

                    @media (max-width: 600px) {
                        .container {
                            padding: 40px 20px;
                        }
                        
                        h1 {
                            font-size: 2rem;
                        }
                        
                        .error-message {
                            font-size: 1.1rem;
                        }
                        
                        .btn {
                            padding: 12px 25px;
                            font-size: 0.9rem;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <h1>Verification Failed</h1>
                    <p class="error-message">Invalid or expired verification token.</p>
                    <p class="description">The verification link you clicked is invalid or has expired. Please try registering again or contact support if you continue to have issues.</p>
                    <a href="/" class="btn">Back to Login</a>
                </div>
            </body>
            </html>
            '''
        
        # Update user to mark email as verified
        # Keep the verification token for reference
        user_collection.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'email_verified': True
                    # Keep verification_token for reference - don't clear it
                }
            }
        )
        
        # Return the verification success page
        return '''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verified - ChatUp</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .container {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    padding: 60px 40px;
                    text-align: center;
                    max-width: 500px;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                }

                .container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 8px;
                    background: linear-gradient(90deg, #4CAF50, #45a049);
                }

                .icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    animation: pulse 2s infinite;
                }

                .icon svg {
                    width: 50px;
                    height: 50px;
                    fill: white;
                }

                h1 {
                    color: #333;
                    font-size: 2.5rem;
                    margin-bottom: 15px;
                    font-weight: 600;
                }

                .success-message {
                    color: #4CAF50;
                    font-size: 1.2rem;
                    margin-bottom: 15px;
                    font-weight: 500;
                }

                .description {
                    color: #666;
                    font-size: 1rem;
                    margin-bottom: 30px;
                    line-height: 1.6;
                }

                .btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1rem;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-block;
                    font-weight: 500;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }

                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                }

                .btn:active {
                    transform: translateY(0);
                }

                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                @media (max-width: 600px) {
                    .container {
                        padding: 40px 20px;
                    }
                    
                    h1 {
                        font-size: 2rem;
                    }
                    
                    .success-message, .description {
                        font-size: 1rem;
                    }
                    
                    .btn {
                        padding: 12px 25px;
                        font-size: 0.9rem;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                </div>
                <h1>Email Verified!</h1>
                <p class="success-message">Success! Your email has been verified.</p>
                <p class="description">You can now log in to your account and start using all the features of ChatUp.</p>
                <a href="/" class="btn">Back to Login</a>
            </div>
        </body>
        </html>
        '''
        
    except Exception as e:
        print(f"Email verification error: {e}")
        return '''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Error - ChatUp</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .container {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    padding: 60px 40px;
                    text-align: center;
                    max-width: 500px;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                }

                .container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 8px;
                    background: linear-gradient(90deg, #f44336, #d32f2f);
                }

                .icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #f44336, #d32f2f);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                }

                .icon svg {
                    width: 50px;
                    height: 50px;
                    fill: white;
                }

                h1 {
                    color: #333;
                    font-size: 2.5rem;
                    margin-bottom: 15px;
                    font-weight: 600;
                }

                .error-message {
                    color: #f44336;
                    font-size: 1.2rem;
                    margin-bottom: 30px;
                    font-weight: 500;
                }

                .description {
                    color: #666;
                    font-size: 1rem;
                    margin-bottom: 30px;
                    line-height: 1.6;
                }

                .btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1rem;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-block;
                    font-weight: 500;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }

                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                }

                .btn:active {
                    transform: translateY(0);
                }

                @media (max-width: 600px) {
                    .container {
                        padding: 40px 20px;
                    }
                    
                    h1 {
                        font-size: 2rem;
                    }
                    
                    .error-message {
                        font-size: 1.1rem;
                    }
                    
                    .btn {
                        padding: 12px 25px;
                        font-size: 0.9rem;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <h1>Verification Error</h1>
                <p class="error-message">An error occurred during email verification.</p>
                <p class="description">Something went wrong while verifying your email. Please try again or contact support if the issue persists.</p>
                <a href="/" class="btn">Back to Login</a>
            </div>
        </body>
        </html>
        '''


# API endpoint for verifying email (for JavaScript requests)
@app.route('/api/verify-email/<token>', methods=['GET'])
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
        # Keep the verification token for reference
        user_collection.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'email_verified': True
                    # Keep verification_token for reference - don't clear it
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


# Function to send password reset email
def send_password_reset_email(email, name, token):
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
        # Create the reset link - using configurable base URL for production
        base_url = os.getenv('BASE_URL', 'http://localhost:5000')  # Set this to your production URL
        reset_link = f"{base_url}/reset-password?token={token}"
        
        # Create the email
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = email
        msg['Subject'] = "Password Reset Request - ChatUp"
        
        body = f"""
        Hello {name},
        
        You have requested to reset your password for your ChatUp account. Please click the link below to reset your password:
        
        {reset_link}
        
        This link will expire in 2 hours for security reasons.
        
        If you did not request a password reset, please ignore this email or contact support if you believe this is unauthorized access.
        
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
        
        print(f"Password reset email sent to {email}")
        return True
        
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
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


# Request password reset endpoint
@app.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({
                'success': False,
                'message': 'Email is required'
            }), 400
        
        # Find the user in the database
        user = user_collection.find_one({'email': email})
        if not user:
            return jsonify({
                'success': False,
                'message': 'Account with this email does not exist'
            }), 404
        
        # Generate a password reset token
        reset_token = secrets.token_urlsafe(32)
        reset_token_expires = datetime.now().timestamp() + (2 * 60 * 60)  # 2 hours from now
        
        # Update user with reset token and expiration
        user_collection.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'reset_password_token': reset_token,
                    'reset_password_expires': reset_token_expires
                }
            }
        )
        
        # Send password reset email
        reset_sent = send_password_reset_email(email, user['name'], reset_token)
        if not reset_sent:
            print(f"Failed to send password reset email to {email}")
            return jsonify({
                'success': False,
                'message': 'Failed to send password reset email. Please try again later.'
            }), 500
        else:
            return jsonify({
                'success': True,
                'message': 'Password reset link has been sent to your email.'
            }), 200
        
    except Exception as e:
        print(f"Request password reset error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'An error occurred while requesting password reset.'
        }), 500


# Reset password endpoint
@app.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('newPassword')
        
        if not token or not new_password:
            return jsonify({
                'success': False,
                'message': 'Token and new password are required'
            }), 400
        
        if len(new_password) < 6:
            return jsonify({
                'success': False,
                'message': 'Password must be at least 6 characters long'
            }), 400
        
        # Find user with the provided reset token
        user = user_collection.find_one({'reset_password_token': token})
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid or expired reset token.'
            }), 400
        
        # Check if the token has expired
        reset_expires = user.get('reset_password_expires')
        if reset_expires and datetime.now().timestamp() > reset_expires:
            # Token has expired, remove it from the user document
            user_collection.update_one(
                {'_id': user['_id']},
                {
                    '$unset': {
                        'reset_password_token': "",
                        'reset_password_expires': ""
                    }
                }
            )
            return jsonify({
                'success': False,
                'message': 'Reset token has expired. Please request a new password reset link.'
            }), 400
        
        # Hash the new password
        hashed_new_password = generate_password_hash(new_password, method='pbkdf2:sha256', salt_length=10)
        
        # Update user's password and remove the reset token
        user_collection.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'password': hashed_new_password,
                    'updatedAt': datetime.now()
                },
                '$unset': {
                    'reset_password_token': "",
                    'reset_password_expires': ""
                }
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Password has been reset successfully!'
        }), 200
        
    except Exception as e:
        print(f"Reset password error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while resetting your password.'
        }), 500


# Password reset page route
@app.route('/reset-password')
def reset_password_page():
    # This route serves the password reset page with the token in the URL
    # The frontend JavaScript will detect the token and show the reset UI
    return send_from_directory('.', 'index.html')


# Verify password for specific user
@app.route('/verify-password', methods=['POST'])
def verify_password():
    try:
        # Get the user's token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
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
        if check_password_hash(user['password'], password):
            return jsonify({
                'success': True,
                'message': 'Password verified successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Incorrect password'
            }), 401
            
    except Exception as e:
        print(f"Verify password error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while verifying your password.'
        }), 500


# Chat endpoint that integrates with the backend agent
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message')
        user_email = data.get('userId')  # Get user email from frontend
        chat_id = data.get('chatId')  # Get chat ID from frontend (if exists)
        
        # Log the incoming message for debugging
        print(f"Received chat message from {user_email}: {message}")
        
        # Get response from the backend agent
        bot_response = run_chat_agent(message)
        
        # Save chat to database
        if user_email:  # Only save if we have user identification
            if chat_id:
                # If a chat_id is provided, add the messages to the existing chat
                result = chat_history_collection.update_one(
                    {'_id': ObjectId(chat_id), 'user_email': user_email},  # Ensure user owns this chat
                    {
                        '$push': {
                            'messages': {
                                '$each': [
                                    {
                                        'sender': 'user',
                                        'text': message,
                                        'timestamp': datetime.now()
                                    },
                                    {
                                        'sender': 'bot',
                                        'text': bot_response,
                                        'timestamp': datetime.now()
                                    }
                                ]
                            }
                        },
                        '$set': {
                            'updated_at': datetime.now()
                        }
                    }
                )
                
                if result.matched_count > 0:
                    # Successfully updated existing chat
                    returned_chat_id = chat_id
                else:
                    # Chat not found for this user, create a new one
                    chat_entry = {
                        'user_email': user_email,
                        'title': message[:50] + "..." if len(message) > 50 else message,  # Use first part of message as title
                        'created_at': datetime.now(),
                        'updated_at': datetime.now(),
                        'messages': [
                            {'sender': 'user', 'text': message, 'timestamp': datetime.now()},
                            {'sender': 'bot', 'text': bot_response, 'timestamp': datetime.now()}
                        ]
                    }
                    
                    # Create new chat document
                    result = chat_history_collection.insert_one(chat_entry)
                    returned_chat_id = str(result.inserted_id)  # Get the ID of the new chat
            else:
                # If no chat_id is provided, create a new chat session
                chat_entry = {
                    'user_email': user_email,
                    'title': message[:50] + "..." if len(message) > 50 else message,  # Use first part of message as title
                    'created_at': datetime.now(),
                    'updated_at': datetime.now(),
                    'messages': [
                        {'sender': 'user', 'text': message, 'timestamp': datetime.now()},
                        {'sender': 'bot', 'text': bot_response, 'timestamp': datetime.now()}
                    ]
                }
                
                # Create new chat document
                result = chat_history_collection.insert_one(chat_entry)
                returned_chat_id = str(result.inserted_id)  # Get the ID of the new chat
        
        return jsonify({
            'response': bot_response,
            'chatId': returned_chat_id  # Return chat ID so frontend can track the session
        }), 200
        
    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'response': "Sorry, I'm having trouble processing your message right now."
        }), 500


# Endpoint to get user's chat history
@app.route('/chat-history', methods=['GET'])
def get_chat_history():
    try:
        # Get user email from authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Extract the token from the header
        token = auth_header.split(' ')[1]  # Extract token after "Bearer"
        
        # In a real application, you would decode the JWT token to get user info
        # For this implementation, we'll use a simplified approach by requiring the email in the query
        # but in a real world application, we'd decode the JWT here
        user_email = request.args.get('user_email')
        if not user_email:
            return jsonify({
                'success': False,
                'message': 'User email is required'
            }), 400

        # Get chat history for the user from the database
        chats = list(chat_history_collection.find({
            'user_email': user_email
        }).sort('created_at', -1).limit(50))  # Get last 50 chats, most recent first
        
        # Format the results
        formatted_chats = []
        for chat in chats:
            formatted_chats.append({
                'id': str(chat['_id']),
                'title': chat.get('title', 'New Chat'),
                'created_at': chat.get('created_at', chat.get('timestamp', datetime.now())).isoformat(),
                'updated_at': chat.get('updated_at', chat.get('created_at', datetime.now())).isoformat(),
                'messages': chat['messages']
            })
        
        return jsonify({
            'success': True,
            'chats': formatted_chats
        }), 200
        
    except Exception as e:
        print(f"Get chat history error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve chat history'
        }), 500


# Endpoint to delete user's chat history
@app.route('/chat-history/<chat_id>', methods=['DELETE'])
def delete_chat_history(chat_id):
    try:
        # Get user email from authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Extract the token from the header (in a real app, decode JWT)
        token = auth_header.split(' ')[1]
        
        # Again, simplifying by getting email from request params
        user_email = request.args.get('user_email')
        if not user_email:
            return jsonify({
                'success': False,
                'message': 'User email is required'
            }), 400

        # Delete specific chat for the user
        result = chat_history_collection.delete_one({
            '_id': ObjectId(chat_id),
            'user_email': user_email
        })
        
        if result.deleted_count > 0:
            return jsonify({
                'success': True,
                'message': 'Chat deleted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Chat not found or you do not have permission to delete it'
            }), 404
        
    except Exception as e:
        print(f"Delete chat history error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to delete chat history'
        }), 500

# Contact Support Endpoint
@app.route('/contact-support', methods=['POST'])
def contact_support():
    try:
        data = request.get_json()
        
        # Extract user data
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        
        # Validate input
        if not name or not email or not message:
            return jsonify({
                'success': False,
                'message': 'All fields (name, email, message) are required'
            }), 400
        
        # Validate email format
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, email):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validate message length
        if len(message) < 10:
            return jsonify({
                'success': False,
                'message': 'Message must be at least 10 characters long'
            }), 400
        
        # Send the support email
        support_sent = send_support_email(email, name, message)
        
        if support_sent:
            return jsonify({
                'success': True,
                'message': 'Your message has been sent successfully! Our support team will contact you soon.'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to send your message. Please try again later.'
            }), 500
            
    except Exception as e:
        print(f"Contact support error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'An error occurred while processing your request'
        }), 500


# Function to send support email
def send_support_email(user_email, user_name, user_message):
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
        # Create the email
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = sender_email  # Send to the support team (same as sender in this case)
        msg['Subject'] = f"Support Request from {user_name} <{user_email}>"
        
        body = f"""
        New support request received:
        
        Name: {user_name}
        Email: {user_email}
        Message: {user_message}
        
        Please respond to the user's email address: {user_email}
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to server and send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, sender_email, text)  # Send to the support email address
        server.quit()
        
        print(f"Support email sent from {user_email}")
        return True
        
    except Exception as e:
        print(f"Failed to send support email: {e}")
        return False


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
    return send_from_directory('images', filename)

# Favicon route
@app.route('/favicon.ico')
def favicon():
    from flask import send_file
    import os
    favicon_path = os.path.join('images', 'Logo.png')
    return send_file(favicon_path)


# Note: This file should not be run directly in production
# Use gunicorn or another WSGI server for production deployment

# To run locally for development:
# if __name__ == '__main__':
#     port = int(os.environ.get('PORT', 5000))
#     print(f"Starting server on port {port}")
#     app.run(debug=False, port=port, host='0.0.0.0')