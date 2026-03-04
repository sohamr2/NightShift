from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API = os.environ.get("GOOGLE_API")

# 1. Initialize the new Gemini client
client = genai.Client(api_key=GOOGLE_API)

# 2. The Context (Pretend this just came from your FastAPI endpoint)
ml_data = {
  "risk_status": "At-Risk",
  "archetype": "Hyper-Connected"
}

# 3. The "System Prompt" (The Secret Sauce)
system_instructions = f"""
You are Luna, an empathetic mental health AI companion for an app called NightShift.

USER CONTEXT:
Our machine learning model has classified the user you are talking to as:
- Archetype: {ml_data['archetype']}
- Risk Status: {ml_data['risk_status']}

YOUR PERSONALITY & RULES:
- Be empathetic, supportive, and conversational.
- Do not sound clinical or like a robot.
- Because they are "Hyper-Connected" and "At-Risk", gently encourage them to disconnect.
- Keep your response very short (2-3 sentences max).
- End by suggesting one specific, quick offline activity (like a 3-minute stretch or drinking a glass of water).
"""

# 4. Simulate a chat
print("--- NightShift Chat Started ---")
user_message = "I've been scrolling TikTok for almost 9 hours today. My eyes hurt but I can't put my phone down."

print(f"User: {user_message}\n")
print("🌙 Luna is typing...\n")

# 5. Generate Luna's personalized response using the new SDK syntax
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=user_message,
    config=types.GenerateContentConfig(
        system_instruction=system_instructions
    )
)

print(f"🌙 Luna: {response.text}")