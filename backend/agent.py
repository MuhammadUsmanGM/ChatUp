from agents import Agent, Runner, AsyncOpenAI, set_default_openai_client, set_tracing_disabled, OpenAIChatCompletionsModel, set_default_openai_api
from agents import function_tool  # Import the function_tool decorator
from dotenv import load_dotenv
import os
import json
from tavily import TavilyClient

load_dotenv()

gemini_api_key = os.getenv("GEMINI_API_KEY")
tavily_api_key = os.getenv("TAVILY_API_KEY")

external_client = AsyncOpenAI(
    api_key=gemini_api_key,
    base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
)
set_default_openai_client(external_client)
set_default_openai_api("chat_completions")
set_tracing_disabled(True)
model = OpenAIChatCompletionsModel(
    model = "gemini-2.0-flash",
    openai_client = external_client
)

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
            results.append(f"Title: {result['title']}\nURL: {result['url']}\nContent: {result['content'][:500]}...\n")
        
        return "\n".join(results)
    except Exception as e:
        return f"Web search failed: {str(e)}"

def my_first_agent(user_input=None):
    if user_input is None:
        user_input = "In short, what is open ai sdk?"
    
    # Create agent with tool calling capability
    agent = Agent(
        name = "Assistant",
        instructions = "A helpful assistant. You can use the search_web tool to search the web for current information when needed.",
        model = model,
        tools=[search_web]  # Add the web search tool
    )
    result = Runner.run_sync(
        starting_agent=agent,
        input=user_input
    )
    print(result.final_output)
    return result.final_output

if __name__ == "__main__":
    my_first_agent()