from agents import Agent, Runner, AsyncOpenAI, set_default_openai_client, set_tracing_disabled, OpenAIChatCompletionsModel,set_default_openai_api
from dotenv import load_dotenv
import os
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
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
def my_first_agent():
    agent = Agent(
        name = "Assistant",
        instructions = "A helpful assistant.",
        model = model
    )
    result = Runner.run_sync(
        starting_agent=agent,
        input="In short, what is open ai sdk?"
    )
    print(result.final_output)
if __name__ == "__main__":
    my_first_agent()