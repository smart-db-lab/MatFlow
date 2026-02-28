import requests

BASE_API_URL = "http://localhost:8000/api"

API_MAP = {
    "display_correlation": "/display_correlation/",
    "scaling": "/scaling/",
    "encoding": "/encoding/",
    "split_dataset": "/split_dataset/",
    "build_model": "/build_model/",
    "model_evaluation": "/model_evaluation/",
    "model_prediction": "/model_prediction/",
    "time_series": "/time_series/",
    "reverse_ml": "/reverseml/",
}

def call_backend_api(arguments):
    api_name = arguments.get("api_name")
    payload = arguments.get("payload", {})

    if api_name not in API_MAP:
        return {"error": f"Unknown API: {api_name}"}

    try:
        r = requests.post(
            BASE_API_URL + API_MAP[api_name],
            json=payload,
            timeout=60
        )
        return {
            "status": r.status_code,
            "data": r.json()
        }
    except Exception as e:
        return {"error": str(e)}
