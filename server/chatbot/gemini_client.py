import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GOOGLE_API_KEY" , "AIzaSyBx6t-WzFeRP3TmEJ-3kUga_7e2CAy04OI"))

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

def gemini_chat(prompt: str) -> str:
    model = genai.GenerativeModel(MODEL)
    resp = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.2,
            "max_output_tokens": 2048,
        }
    )
    return resp.text or ""
