# MongoDB Integration Details

## Database Configuration
- **Database Name**: Credentials
- **Collection Name**: User_info
- **Connection URL**: mongodb://localhost:27017

## Collection Schema
The User_info collection will have the following structure:

```javascript
{
  _id: ObjectId,
  name: String,
  email: String, 
  password: String, // Should be hashed before storing
  createdAt: Date,
  updatedAt: Date
}
```

## Required Operations

### 1. User Registration
- Check if email already exists in the database
- Hash the password before storing
- Insert new user document with schema structure
- Return success or error response

### 2. User Login
- Find user by email in the database
- Compare provided password with stored hashed password
- Return authentication success or failure

### 3. Future Enhancements
- Store chat history for users
- Session management
- Password reset functionality

## Connection Example (Python with PyMongo)
```python
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['Credentials']
user_collection = db['User_info']

# Example: Insert new user
def create_user(name, email, password):
    user_doc = {
        "name": name,
        "email": email,
        "password": hash_password(password),  # Implement proper hashing
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    result = user_collection.insert_one(user_doc)
    return result.inserted_id
```

## Security Considerations
- Always hash passwords using bcrypt or similar
- Implement proper input validation
- Use environment variables for database credentials
- Implement rate limiting for authentication endpoints
- Use HTTPS in production