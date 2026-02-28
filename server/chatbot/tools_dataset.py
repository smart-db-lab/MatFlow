import pandas as pd
import os

DATASET_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset")

def load_dataset(arguments):
    name = arguments
    if not name:
        return {"error": "dataset_name required"}

    path = os.path.join(DATASET_ROOT, name, f"{name}.csv")

    if not os.path.exists(path):
        return {"error": f"Dataset '{name}' not found locally"}

    df = pd.read_csv(path)
    return {
        "message": f"Dataset '{name}' loaded",
        "columns": list(df.columns),
        "rows": len(df),
        "preview": df.head(5).to_dict(orient="records")
    }


def show_dataset(arguments):
    name = arguments.get("dataset")
    rows = int(arguments.get("rows", 5))

    path = os.path.join(DATASET_ROOT, name, f"{name}.csv")
    if not os.path.exists(path):
        return {"error": "Dataset not found"}

    df = pd.read_csv(path)
    return {
        "dataset": name,
        "rows": rows,
        "data": df.head(rows).to_dict(orient="records")
    }


def list_datasets(_):
    if not os.path.exists(DATASET_ROOT):
        return {"datasets": []}

    datasets = [
        d for d in os.listdir(DATASET_ROOT)
        if os.path.isdir(os.path.join(DATASET_ROOT, d))
    ]

    return {"datasets": datasets}
