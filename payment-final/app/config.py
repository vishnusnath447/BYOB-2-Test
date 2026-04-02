import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# OpenRouter support — swap in when ready
# Set LLM_PROVIDER=openrouter in .env and add OPENROUTER_API_KEY
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")  # "groq" | "openrouter"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct")
