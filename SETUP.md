# Setting up ChatUp with MongoDB Atlas

## Prerequisites

Before running the application, you'll need:

1. Python 3.8 or higher
2. MongoDB Atlas account (free tier available)
3. Google Gemini API key
4. Tavily API key (for web search functionality)

## Step 1: Create .env File

1. Copy the `.env.example` file to create your own `.env` file:
   ```
   cp .env.example .env
   ```

2. Open the `.env` file and add your API keys:

### MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://mongodb.com/cloud/atlas) and create an account
2. Create a new cluster (the free tier "M0" is sufficient for development)
3. Navigate to "Database Access" and create a database user with username and password
4. Navigate to "Network Access" and add your IP address, or add `0.0.0.0/0` to allow access from anywhere (less secure but fine for development)
5. Go to "Database" section and click "Connect"
6. Select "Connect your application"
7. Choose "Python" and version "3.6 or later"
8. Copy the connection string and replace `<password>` with your database user's password
9. Also replace the database name at the end of the connection string with `Credentials` (or create this database in your Atlas dashboard)
10. Add this connection string to your `.env` file as the `MONGODB_URI` value

### API Keys Setup

- **GEMINI_API_KEY**: Get it from [Google AI Studio](https://aistudio.google.com/)
- **TAVILY_API_KEY**: Get it from [Tavily API](https://tavily.com/)
- **EMAIL_ADDRESS** and **EMAIL_PASSWORD**: Configure an email account (Gmail recommended) - you'll need to use an app password instead of your regular password for Gmail

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 3: Run the Application

```bash
python server.py
```

The application will be available at `http://localhost:5000`