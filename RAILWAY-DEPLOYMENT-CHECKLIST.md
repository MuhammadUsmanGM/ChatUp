# Railway Deployment Checklist for ChatUp

## Pre-deployment

- [ ] Ensure repository is pushed to GitHub
- [ ] Obtain Google Gemini API key
- [ ] Obtain Tavily API key
- [ ] Set up MongoDB Atlas cluster and get connection string
- [ ] Prepare email account for sending verification emails (with app password if using Gmail)
- [ ] Verify all files are committed to the repository

## Deployment Process

- [ ] Go to Railway.app and sign in
- [ ] Create new project
- [ ] Choose "Deploy from GitHub"
- [ ] Select the ChatUp repository
- [ ] Wait for initial build to complete

## Environment Variables Setup

- [ ] Add `GEMINI_API_KEY` variable with your Gemini API key
- [ ] Add `TAVILY_API_KEY` variable with your Tavily API key
- [ ] Add `EMAIL_ADDRESS` with your email address
- [ ] Add `EMAIL_PASSWORD` with your email app password
- [ ] Add `MONGODB_URI` with your MongoDB Atlas connection string
- [ ] Add `DB_NAME` (default: Credentials)
- [ ] Add `COLLECTION_NAME` (default: User_info)
- [ ] Add `SMTP_SERVER` (default: smtp.gmail.com)
- [ ] Add `SMTP_PORT` (default: 587)
- [ ] Add `BASE_URL` with your Railway app URL (e.g., https://your-app.up.railway.app)

## Post-deployment Verification

- [ ] Wait for application to restart after adding environment variables
- [ ] Visit the `/health` endpoint to verify the application is running
- [ ] Test registration process with a new account
- [ ] Verify email verification is working
- [ ] Test chat functionality
- [ ] Verify MongoDB connection is working
- [ ] Test password reset functionality
- [ ] Verify dark/light theme toggle works

## Common Issues and Solutions

### Application Fails to Start
- Check logs in Railway dashboard
- Verify all required environment variables are set
- Check MongoDB connection string format

### Email Not Working
- Verify email address and app password are correct
- Check that your email provider allows SMTP access
- Verify SMTP server and port settings

### AI Features Not Working
- Verify Gemini API key is correct
- Verify Tavily API key is correct
- Check that API keys have proper permissions

### Database Issues
- Verify MongoDB URI is properly formatted
- Ensure your IP address is whitelisted in Atlas
- Check that database name and collection name are correct

## Scaling Considerations

- [ ] Monitor application performance in Railway dashboard
- [ ] Adjust instance size if needed for better performance
- [ ] Set up custom domain if desired
- [ ] Configure automatic deployments from GitHub

## Security Best Practices

- [ ] Use strong, unique API keys
- [ ] Never commit API keys or credentials to version control
- [ ] Regularly rotate API keys
- [ ] Monitor application logs for suspicious activity
- [ ] Keep dependencies up to date