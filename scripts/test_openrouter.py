
import os
import requests
import json
from dotenv import load_dotenv

# Load .env
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(root_dir, ".env")
load_dotenv(env_path)

api_key = os.getenv("OPENROUTER_API_KEY")

print("--- OpenRouter Connection Test ---")

if not api_key:
    print("❌ Error: OPENROUTER_API_KEY not found in .env")
    print("Please add: OPENROUTER_API_KEY=sk-or-...")
    exit(1)

print(f"Key loaded: {api_key[:10]}...")

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "HTTP-Referer": "http://localhost:3000", # Optional, for including your app on openrouter.ai rankings.
    "X-Title": "Legal Compass AI", # Optional. Shows in rankings on openrouter.ai.
    "Content-Type": "application/json"
}

# Models to test
# 1. google/gemini-2.0-flash-exp:free (Free, Fast)
# 2. meta-llama/llama-3.1-8b-instruct:free (Free, Good)
# 3. openai/gpt-4o-mini (Paid, Cheap, Reliable)
model = "meta-llama/llama-3.1-8b-instruct:free"

data = {
    "model": model,
    "messages": [
        {"role": "user", "content": "Hello! Reply with 'OpenRouter is working!'"}
    ]
}

print(f"Sending request using model: {model}...")

try:
    resp = requests.post(url, headers=headers, json=data, timeout=20)
    
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        result = resp.json()
        print("✅ SUCCESS!")
        print("Response:", result['choices'][0]['message']['content'])
    else:
        print("❌ FAILED")
        print("Body:", resp.text)

except Exception as e:
    print(f"Exception: {e}")
