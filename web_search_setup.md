# Web Search Integration Setup

## Tavily API Configuration

To enable web search functionality in your chatbot, you need to configure the Tavily API:

### 1. Get a Tavily API Key
- Visit https://tavily.com/
- Sign up for an account
- Navigate to your dashboard to get your API key
- They offer a free tier with a limited number of requests per month

### 2. Add the API Key to Your Environment
Add the following line to your `.env` file in the project root directory:

```
TAVILY_API_KEY=your_actual_tavily_api_key_here
```

### 3. Example .env file
```
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
EMAIL_ADDRESS=your_email@example.com
EMAIL_PASSWORD=your_email_app_password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
BASE_URL=http://localhost:5000
```

### 4. Restart the Application
After adding the API key, restart your Flask server for the changes to take effect.

## How It Works
- When users ask questions that require current information
- The agent will automatically use the Tavily search tool to find relevant information
- The results will be incorporated into the AI's response

## Testing
You can test the functionality by asking the chatbot questions about current events or information that might require real-time data.