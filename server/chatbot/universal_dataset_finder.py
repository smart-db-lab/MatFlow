# universal_dataset_finder.py

import requests
import openml
from datasets import load_dataset
from huggingface_hub import list_datasets
from kaggle.api.kaggle_api_extended import KaggleApi

# ----- FIX: prevent kaggle authentication on import -----
import os
os.environ.setdefault("KAGGLE_USERNAME", "")
os.environ.setdefault("KAGGLE_KEY", "")

# Monkey patch: prevent authenticate() from running on import
import kaggle
kaggle.api = None


from kaggle.api.kaggle_api_extended import KaggleApi

def get_kaggle_client():
    os.environ["KAGGLE_USERNAME"] = os.getenv("KAGGLE_USERNAME", "")
    os.environ["KAGGLE_KEY"] = os.getenv("KAGGLE_KEY", "")

    api = KaggleApi()
    api.authenticate()
    return api



def search_builtin(name):
    """
    Search for dataset inside:
    dataset/<folder>/*.csv

    Match if:
    - search term in folder name, OR
    - search term in any CSV file name
    """
    import os

    search_key = name.lower().replace(" ", "_").replace("-", "_")

    base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset")

    if not os.path.isdir(base_dir):
        return None

    for folder in os.listdir(base_dir):
        folder_path = os.path.join(base_dir, folder)

        if not os.path.isdir(folder_path):
            continue

        folder_key = folder.lower().replace(" ", "_").replace("-", "_")

        # FOLDER NAME MATCH
        if search_key in folder_key:
            return {"source": "builtin", "id": folder}

        # FILE NAME MATCH
        for file in os.listdir(folder_path):
            if file.lower().endswith(".csv"):
                file_key = file.lower().replace(" ", "_").replace("-", "_")

                if search_key in file_key:
                    return {"source": "builtin", "id": folder}

    return None



def search_openml(name):
    try:
        results = openml.datasets.list_datasets(output_format="dataframe")
        hits = results[results['name'].str.contains(name, case=False, na=False)]
        if len(hits) > 0:
            ds_id = hits.iloc[0]['did']
            return {"source": "openml", "id": int(ds_id)}
    except:
        pass
    return None

import os
from kaggle.api.kaggle_api_extended import KaggleApi



def search_kaggle(name):
    try:
        api = get_kaggle_client()
        results = api.dataset_list(search=name)
        if len(results) > 0:
            return {"source": "kaggle", "id": results[0].ref}
    except Exception as e:
        print("Kaggle search failed:", e)
    return None




def search_huggingface(name):
    try:
        datasets = list_datasets()
        matches = [d for d in datasets if name.lower() in d.lower()]
        if matches:
            return {"source": "huggingface", "id": matches[0]}
    except:
        pass
    return None


def detect_url(name):
    if name.startswith("http://") or name.startswith("https://"):
        return {"source": "url", "id": name}
    return None


def universal_dataset_search(name):
    """
    EXACT ChatGPT-style multi-source dataset search.
    """

    # 1) URL?
    hit = detect_url(name)
    if hit: return hit

    # 2) Built-in?
    hit = search_builtin(name)
    if hit: return hit

    # 3) OpenML
    hit = search_openml(name)
    if hit: return hit

    # 4) Kaggle
    hit = search_kaggle(name)
    if hit: return hit

    # 5) HuggingFace datasets
    hit = search_huggingface(name)
    if hit: return hit

    # Fail
    return None


def get_source_download_url(hit):
    src = hit["source"]
    ds_id = hit["id"]

    if src == "kaggle":
        # Kaggle dataset page
        return f"https://www.kaggle.com/datasets/{ds_id}"

    if src == "huggingface":
        # HuggingFace dataset page
        return f"https://huggingface.co/datasets/{ds_id}"

    if src == "openml":
        # OpenML dataset page
        return f"https://www.openml.org/d/{ds_id}"

    if src == "url":
        # Original raw file URL
        return ds_id

    if src == "builtin":
        # Built-in datasets exist only in seaborn
        return None   # Or "local_builtin"

    return None
