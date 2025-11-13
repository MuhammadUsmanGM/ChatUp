# Deploying ChatUp on Railway

This guide provides instructions for deploying the ChatUp AI chat application on Railway.

## Prerequisites

Before deploying, you'll need the following API keys and services:

1. **Google Gemini API key** - Get it from [Google AI Studio](https://aistudio.google.com/)
2. **Tavily API key** - Get it from [Tavily API](https://tavily.com/) (for web search functionality)
3. **Gmail account** (or other SMTP service) for email verification and notifications
4. **MongoDB Atlas account** for database storage (free tier available)

## Step-by-Step Deployment

### 1. Fork or Clone the Repository

First, fork this repository to your GitHub account or clone it to work with it directly.

### 2. Deploy to Railway

1. Go to [Railway](https://railway.app) and sign up/in
2. Click "New Project" → "Deploy from GitHub"
3. Select this repository
4. Click "Deploy"

### 3. Add Environment Variables

After deployment starts, go to the "Environment Variables" tab and add the following:

```
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
MONGODB_URI=your_mongodb_atlas_connection_string_here
DB_NAME=Credentials
COLLECTION_NAME=User_info
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
BASE_URL=https://your-railway-app-name.up.railway.app
```

#### Environment Variables Details:

- **GEMINI_API_KEY**: Your Google Gemini API key for AI responses
- **TAVILY_API_KEY**: Your Tavily API key for web search functionality
- **EMAIL_ADDRESS**: Email address for sending verification and notification emails
- **EMAIL_PASSWORD**: App password for your email (use app password for Gmail, not regular password)
- **MONGODB_URI**: MongoDB Atlas connection string (get this from your Atlas dashboard)
- **DB_NAME**: Database name in MongoDB (default: Credentials)
- **COLLECTION_NAME**: Collection name for users (default: User_info)
- **SMTP_SERVER**: SMTP server (default: smtp.gmail.com)
- **SMTP_PORT**: SMTP port (default: 587)
- **BASE_URL**: Your Railway app URL (format: https://your-app-name.up.railway.app)

### 4. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://mongodb.com/cloud/atlas) and create an account
2. Create a new cluster (the free tier "M0" is sufficient)
3. Navigate to "Database Access" and create a database user
4. Navigate to "Network Access" and add your IP address, or add `0.0.0.0/0` to allow access from anywhere
5. Go to "Database" section and click "Connect"
6. Select "Connect your application"
7. Choose "Python" and copy the connection string
8. Replace `<password>` with your database user's password
9. Replace the database name at the end with `Credentials`

### 5. Configure Email (Gmail Example)

For Gmail:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password (don't use your regular Gmail password)
3. Use the app password in the EMAIL_PASSWORD environment variable

### 6. Restart Your Railway Application

After adding all environment variables, restart your application from the Railway dashboard.

## Health Check

Your application includes a health check endpoint at `/health` which Railway will use to monitor your application status.

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Issues**:
   - Verify your IP address is whitelisted in MongoDB Atlas
   - Check that your connection string is properly formatted
   - Ensure your database user has proper permissions

2. **Email Configuration Issues**:
   - Use an app password, not your regular email password
   - Verify SMTP settings match your email provider
   - Check that your email provider allows SMTP access

3. **API Key Issues**:
   - Verify API keys are correctly entered in environment variables
   - Check that API keys have the necessary permissions

### Health Check:
You can verify your deployment by visiting `https://your-app-name.up.railway.app/health`

## Application Features

Once deployed, your ChatUp application will include:

- User registration with email verification
- Secure login system
- AI-powered chat with Google Gemini
- Web search integration via Tavily
- Chat history storage
- Profile management
- Password reset functionality
- Dark/light theme support
- Mobile-responsive design

## Scaling

Railway allows you to easily scale your application by adjusting the resources allocated to your deployment through the Railway dashboard.

## Additional Notes

- The application uses Gunicorn as the production WSGI server
- Static files (CSS, JS, images) are served directly by Flask
- The application is configured to handle Railway's environment automatically
- All sensitive information is stored in environment variables