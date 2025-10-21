# MongoDB Atlas Setup Guide

This guide will walk you through setting up MongoDB Atlas for the ChatUp application.

## Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/atlas
2. Sign up for a free account or log in if you already have one
3. Verify your email address if required

## Step 2: Create a New Cluster

1. Click the "Build a Database" button
2. Select the "Free" (M0) tier for development/testing
3. Choose your preferred cloud provider and region
4. Click "Create Cluster"
5. Wait for the cluster to be provisioned (this may take a few minutes)

## Step 3: Create a Database User

1. Navigate to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Create a username and strong password (save these for later)
5. For user privileges, select "Built-in Role" and choose "Atlas Admin"
6. Click "Add User"

## Step 4: Configure IP Access List

1. Navigate to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. To allow access from anywhere (for development only): 
   - Click "Allow Access from Anywhere"
   - Click "Confirm"
4. For production, add your specific IP address instead
5. If you don't know your current IP address, you can temporarily add "0.0.0.0/0" to allow all IPs (not recommended for production)

**IMPORTANT**: If your connection attempts fail with SSL handshake errors or "No replica set members match selector" errors, it's almost certainly because your IP address isn't whitelisted. In that case:
- Try using the "Add Current IP Address" button which automatically detects your IP
- Or temporarily use "0.0.0.0/0" for development (remember to restrict it in production)

## Step 5: Get Your Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Select "Drivers" option
4. Copy the connection string (it will look like: `mongodb+srv://<username>:<password>@<cluster-url>/...`)
5. Replace `<password>` with your database user's password

## Step 6: Update Your .env File

1. Open the `.env` file in your project root
2. Replace `your_mongodb_atlas_connection_string_here` with your actual connection string
3. Example:
   ```
   MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/
   DB_NAME=Credentials
   COLLECTION_NAME=User_info
   ```

## Step 7: Test the Connection

Run the test script to verify your connection:
```bash
python test_atlas_connection.py
```

## Additional Security Considerations (For Production)

1. **IP Whitelisting**: Instead of allowing access from anywhere, add only specific IP addresses
2. **Database User Permissions**: Create a user with minimal required permissions rather than Atlas Admin
3. **Separate Environments**: Use different database names for development and production
4. **Environment Variables**: Never commit your .env file to version control

## Troubleshooting

**Connection Timeout**: Check if your IP address is whitelisted in MongoDB Atlas
**Authentication Failed**: Verify your username and password in the connection string
**Database Not Found**: Ensure the database name exists or is automatically created
**Network Issues**: Check your firewall settings and internet connection

## Sample Connection String Format

```
mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority
```

Example:
```
mongodb+srv://myuser:mysecurepassword@cluster0.abc123.mongodb.net/ChatUpDB?retryWrites=true&w=majority
```