from pymongo import MongoClient

# Test MongoDB connection
try:
    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    
    # Test the connection
    client.admin.command('ping')
    print("MongoDB connection successful!")
    
    # Connect to your specific database
    db = client["Credentials"]
    collection = db["User_info"]
    
    # Test inserting a document
    test_doc = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "hashed_password",
        "test_field": "connection_test"
    }
    
    result = collection.insert_one(test_doc)
    print(f"Test document inserted with ID: {result.inserted_id}")
    
    # Verify it was inserted
    inserted_doc = collection.find_one({"test_field": "connection_test"})
    if inserted_doc:
        print("Verification: Document found in database!")
        print(f"Document: {inserted_doc}")
        
        # Clean up - remove test document
        collection.delete_one({"test_field": "connection_test"})
        print("Cleaned up test document")
    
    # List all databases to verify connection
    print(f"Available databases: {client.list_database_names()}")
    
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    print("Make sure MongoDB is running with 'mongod' command in another terminal")