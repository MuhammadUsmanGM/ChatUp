from pymongo import MongoClient
from dotenv import load_dotenv
import os
from urllib.parse import quote_plus, urlparse
from datetime import datetime

# Load environment variables
load_dotenv()

# Get MongoDB URI and configuration
MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "Credentials")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "User_info")

if not MONGO_URI or "your_mongodb_atlas_connection_string_here" in MONGO_URI:
    print("Error: MONGODB_URI environment variable not set or still contains placeholder value.")
    exit(1)

# Encode credentials safely if using MongoDB Atlas
if "mongodb+srv://" in MONGO_URI:
    parsed = urlparse(MONGO_URI)
    username = parsed.username
    password = parsed.password
    if username and password:
        encoded_username = quote_plus(username)
        encoded_password = quote_plus(password)
        encoded_netloc = f"{encoded_username}:{encoded_password}@{parsed.hostname}"
        if parsed.port:
            encoded_netloc += f":{parsed.port}"
        MONGO_URI = parsed._replace(netloc=encoded_netloc).geturl()

try:
    print("Attempting to connect to MongoDB Atlas...")
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=30000
    )

    # Test connection
    client.admin.command("ping")
    print("[SUCCESS] MongoDB Atlas connection successful!")

    # Connect to specific database and collection
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # ✅ Insert a sample user document
    sample_user = {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "username": "johndoe123",
        "password": "hashed_password_here",  # store a hashed password in production!
        "created_at": datetime.utcnow(),
        "role": "user",
        "status": "active"
    }

    result = collection.insert_one(sample_user)
    print(f"[SUCCESS] Sample user inserted with ID: {result.inserted_id}")

    # Verify the document
    inserted_doc = collection.find_one({"_id": result.inserted_id})
    if inserted_doc:
        print("[SUCCESS] Verification: Sample user found in database!")
        print(f"Document: {inserted_doc}")

    # List all collections
    print(f"[INFO] Collections in '{DB_NAME}': {db.list_collection_names()}")

    print("\n[COMPLETE] Sample user successfully added to MongoDB Atlas!")

except Exception as e:
    print(f"[ERROR] MongoDB Atlas connection failed: {e}")
    print("\nCheck the following:")
    print("1. Your MONGODB_URI in the .env file is correct")
    print("2. Your IP address is whitelisted in MongoDB Atlas")
    print("3. Your credentials are valid")
    print("4. Your cluster is online and accessible")
