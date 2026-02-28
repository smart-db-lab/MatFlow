# universal_dataset_loader.py

import pandas as pd
import openml
from datasets import load_dataset
from kaggle.api.kaggle_api_extended import KaggleApi
from .universal_dataset_finder import get_kaggle_client

def load_dataset_from_search(hit):
    src = hit["source"]
    ds_id = hit["id"]

    if src == "builtin":
        import seaborn as sns
        try:
            return sns.load_dataset(ds_id)
        except:
            pass

    if src == "openml":
        d = openml.datasets.get_dataset(ds_id)
        X, y, _, _ = d.get_data(dataset_format="dataframe")
        if y is not None:
            X["target"] = y
        return X

    if src == "huggingface":
        dataset = load_dataset(ds_id)
        df = dataset[list(dataset.keys())[0]].to_pandas()
        return df

    if src == "kaggle":
        api = get_kaggle_client()
        api.dataset_download_files(ds_id, path="./dataset", unzip=True)
        # pick first CSV
        import os
        for f in os.listdir("./dataset"):
            if f.endswith('.csv'):
                return pd.read_csv(f"./dataset/{f}")

    if src == "url":
        return pd.read_csv(ds_id)

    raise ValueError("Unknown source")
