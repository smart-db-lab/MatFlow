import json
import logging
import os
import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables (assumes server/.env)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class LabAssistantAgent:
    def __init__(self):
        # Determine the backend from env vars. We default to MindRouter if OpenAI isn't configured.
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
        
        if self.openai_api_key:
            self.provider = "openai"
            self.api_url = os.getenv("OPENAI_API_URL", "https://api.openai.com/v1/chat/completions").strip()
            self.model = os.getenv("OPENAI_MODEL", "gpt-4-turbo").strip()
            self.api_token = self.openai_api_key
        else:
            self.provider = "mindrouter"
            self.api_url = os.getenv("MINDROUTER_API_URL", "https://mindrouter.uidaho.edu/v1/chat/completions").strip()
            self.model = os.getenv("MINDROUTER_MODEL", "openai/gpt-oss-120b").strip()
            self.api_token = os.getenv("MINDROUTER_API_TOKEN", "").strip()

        if not self.api_token:
            logger.warning("No API token found for LabAssistantAgent! Set OPENAI_API_KEY or MINDROUTER_API_TOKEN in .env")

    def get_system_prompt(self):
        return """
You are the MatFlow AI Lab Assistant, an expert data scientist helping users prepare datasets for machine learning.
You are interacting with a user who is viewing a dataset in their browser.

Given the attached Dataset Context (columns, missing values, basic statistics) and the User Query, you must:
1. Provide a brief, friendly, and analytical natural-language response.
2. If the user is asking to modify the dataset (e.g., scale features, drop columns, fill missing values, rename columns, change data types), propose the specific actions required.

You MUST respond strictly in the following JSON format. NO markdown, NO markdown code blocks, JUST valid JSON:
{
    "message": "A friendly response explaining your analysis and what you recommend.",
    "actions": [
        {
            "function": "<FUNCTION_NAME>",
            "parameters": {
                "<param1>": "<value1>"
            }
        }
    ]
}

Available Functions for "actions" array:
- SCALE_FEATURES: parameters -> {"method": "Min-Max Scaler" | "Standard Scaler" | "Robust Scaler" | "Max Abs Scaler" | "Normalizer", "columns": ["col1", "col2"] or "numerical"}
- FILL_MISSING_VALUES: parameters -> {"strategy": "mean" | "median" | "most_frequent" | "constant", "columns": ["col1"], "constant_value": 0}
- DROP_COLUMNS: parameters -> {"columns": ["col1", "col2"]}
- RENAME_COLUMN: parameters -> {"old_name": "col1", "new_name": "col2"}
- CHANGE_DATA_TYPE: parameters -> {"column": "col1", "dtype": "int64" | "float64" | "object" | "bool"}

If no actions are needed, return an empty list for "actions".
Ensure your response is parseable JSON. Do NOT wrap the JSON in ```json blocks.
"""

    def process_chat(self, conversation_history, dataset_context, query):
        messages = [
            {"role": "system", "content": self.get_system_prompt()},
        ]
        
        # Add conversation history
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        # Append dataset context and user query
        final_prompt = f"""
--- Dataset Context ---
{dataset_context}

--- User Query ---
{query}
"""
        messages.append({"role": "user", "content": final_prompt})
        
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2, # Low temperature for more deterministic JSON
            # "max_tokens": 1500
        }
        
        logger.info(f"Sending request to {self.provider} ({self.api_url}) using model {self.model}")
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                content = data['choices'][0]['message']['content'].strip()
                
                # Strip markdown code blocks if the LLM hallucinated them despite instructions
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                # Validate JSON return
                try:
                    json_resp = json.loads(content)
                    return json_resp, None
                except json.JSONDecodeError:
                    logger.error(f"LLM returned invalid JSON: {content}")
                    return None, "The assistant failed to return a valid JSON structure."
            else:
                logger.error(f"Failed API call. Status {response.status_code}: {response.text}")
                return None, f"API Error: {response.status_code}"
                
        except Exception as e:
            logger.error(f"Exception during LLM request: {str(e)}")
            return None, f"Connection Error: {str(e)}"
