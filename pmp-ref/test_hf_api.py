#!/usr/bin/env python3
"""
Test Hugging Face API connection
"""
import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv('.env.local')
load_dotenv()

HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')
HF_MODEL = os.getenv('HF_MODEL') or "Qwen/Qwen2.5-72B-Instruct"

print(f"🔑 API Key: {HUGGINGFACE_API_KEY[:10]}...")
print(f"🤖 Model: {HF_MODEL}\n")

client = InferenceClient(api_key=HUGGINGFACE_API_KEY)

print("Testing chat_completion...")
try:
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Say hello in one sentence."}
    ]
    
    response = client.chat_completion(
        model=HF_MODEL,
        messages=messages,
        max_tokens=50
    )
    print(f"✅ Success: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ chat_completion failed: {e}\n")
    
    print("Testing text_generation fallback...")
    try:
        response = client.text_generation(
            "Say hello in one sentence.",
            model=HF_MODEL,
            max_new_tokens=50
        )
        print(f"✅ text_generation works: {response}")
    except Exception as e2:
        print(f"❌ text_generation also failed: {e2}")
