import json
import base64
import numpy as np
import pandas as pd
from typing import Dict, Any
from django.utils.crypto import get_random_string

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, r2_score
from .tools_dataset import *
from . import tools_dataset
from rest_framework.test import APIRequestFactory

# Import dataset manager helpers to avoid duplicating logic
from dataset_manager.views import (
    DATASET_DIR as DM_DATASET_DIR,
    get_nested_directory_structure,
    read_and_process_file,
    get_dataset_folder,
    make_preview_json_safe,
    clean_df,
)
from chatbot.universal_dataset_finder import universal_dataset_search, get_source_download_url
from chatbot.universal_dataset_loader import load_dataset_from_search
from django.urls import reverse
import os
import shutil
from matflow_test import views as mtv


# ---------- interop helpers for calling DRF views ----------
_RF = APIRequestFactory()


def _drf_req(data: Dict[str, Any]):
    """Build a DRF Request so api_view-decorated functions accept it."""
    try:
        return _RF.post("/", data=data or {}, format="json")
    except Exception:
        req = _RF.post("/", data={}, format="json")
        req._body = json.dumps(data or {}).encode("utf-8")
        return req


def _resp_to_json(resp):
    try:
        if hasattr(resp, "data") and resp.data is not None:
            return resp.data
        if hasattr(resp, "content") and resp.content:
            return json.loads(resp.content)
    except Exception:
        pass
    return {"message": "ok"}

# ---------- helpers ----------
def _py(x):
    if isinstance(x, (np.integer,)): return int(x)
    if isinstance(x, (np.floating,)): return float(x)
    if isinstance(x, (np.bool_,)): return bool(x)
    if isinstance(x, pd.DataFrame): return x.to_dict(orient="records")
    if isinstance(x, pd.Series): return x.tolist()
    if isinstance(x, np.ndarray): return x.tolist()
    return x


def _get_sid(req):
    sid = req.session.get("sid")
    if not sid:
        sid = get_random_string(16)
        req.session["sid"] = sid
        req.session.modified = True
    return sid


def _get_df(req):
    data = req.session.get("dataset")
    return pd.DataFrame(data) if data else None


def _save_df(req, df):
    req.session["dataset"] = df.to_dict(orient="records")
    req.session.modified = True


def _resolve_dataset(req, args):
    """
    Convert 'dataset' name to actual file data for mt_* tools.
    If args has 'dataset' (string), loads it and converts to 'file' (list of dicts).
    Returns updated args dict.
    """
    if "dataset" in args and isinstance(args["dataset"], str):
        ds_name = args["dataset"]
        path = os.path.join(tools_dataset.DATASET_ROOT, ds_name, f"{ds_name}.csv")
        if os.path.exists(path):
            try:
                df = pd.read_csv(path)
                args["file"] = df.to_dict(orient="records")
                args.pop("dataset", None)
            except Exception as e:
                args["file"] = []
        else:
            args["file"] = []
    return args


# ---------- memory ----------
MODEL_STORE: Dict[str, Any] = {}
SPLIT_STORE: Dict[str, Any] = {}


# ---------- TOOLS ----------

def set_dataset(req, args):
    # Accept either inline data rows or a dataset name
    rows = args.get("data") or args.get("rows")
    ds_name = args.get("dataset") or args.get("dataset_name") or args.get("name")

    if rows and isinstance(rows, list):
        try:
            df = pd.DataFrame(rows)
        except Exception as e:
            return {"error": f"invalid data rows: {e}"}
        _save_df(req, df)
        return {"message": "dataset set from data", "rows": len(df), "columns": list(df.columns)}

    if isinstance(ds_name, str) and ds_name:
        path = os.path.join(tools_dataset.DATASET_ROOT, ds_name, f"{ds_name}.csv")
        if not os.path.exists(path):
            return {"error": f"dataset '{ds_name}' not found locally"}
        try:
            df = pd.read_csv(path)
        except Exception as e:
            return {"error": f"failed to read dataset '{ds_name}': {e}"}
        _save_df(req, df)
        return {"message": f"dataset '{ds_name}' loaded", "rows": len(df), "columns": list(df.columns)}

    return {"error": "provide either 'data' (list of dict) or 'dataset' name"}


def show_head(req, args):
    ds_name = args.get("dataset") or args.get("dataset_name") or args.get("name")
    if isinstance(ds_name, str) and ds_name:
        path = os.path.join(tools_dataset.DATASET_ROOT, ds_name, f"{ds_name}.csv")
        if os.path.exists(path):
            try:
                df = pd.read_csv(path)
                _save_df(req, df)
            except Exception as e:
                return {"error": f"failed to read dataset '{ds_name}': {e}"}

    df = _get_df(req)
    if df is None:
        return {"error": "No dataset loaded"}

    n_val = args.get("n")
    if n_val is None:
        n_val = args.get("n_rows") or args.get("rows") or 5
    try:
        n = int(n_val)
    except Exception:
        n = 5
    return {"data": _py(df.head(n))}


def show_columns(req, args):
    df = _get_df(req)
    if df is None:
        return {"error": "No dataset loaded"}
    return {"columns": list(df.columns)}


def correlation(req, args):
    df = _get_df(req)
    if df is None:
        return {"error": "No dataset loaded"}
    num = df.select_dtypes(include=[np.number])
    if num.empty:
        return {"error": "No numeric columns"}
    return {"correlation": num.corr().to_dict()}


def split(req, args):
    df = _get_df(req)
    if df is None:
        return {"error": "No dataset loaded"}

    target = args.get("target_var")
    if target not in df.columns:
        return {"error": "Invalid target_var"}

    X = df.drop(columns=[target])
    y = df[target]

    Xtr, Xte, ytr, yte = train_test_split(
        X, y, test_size=float(args.get("test_size", 0.2)), random_state=42
    )

    sid = _get_sid(req)
    SPLIT_STORE[sid] = {"Xtr": Xtr, "Xte": Xte, "ytr": ytr, "yte": yte}

    return {"message": "split done"}


def train(req, args):
    sid = _get_sid(req)
    if sid not in SPLIT_STORE:
        return {"error": "Run split first"}

    task = args.get("type", "classifier")
    Xtr = SPLIT_STORE[sid]["Xtr"].select_dtypes(include=[np.number])
    ytr = SPLIT_STORE[sid]["ytr"]

    if task == "classifier":
        model = RandomForestClassifier(n_estimators=200)
    else:
        model = RandomForestRegressor(n_estimators=200)

    model.fit(Xtr, ytr)
    MODEL_STORE[sid] = {"model": model, "task": task}

    return {"message": "model trained", "task": task}


def model_evaluation(req, args):
    sid = _get_sid(req)
    if sid not in MODEL_STORE:
        return {"error": "Train model first"}

    model = MODEL_STORE[sid]["model"]
    task = MODEL_STORE[sid]["task"]
    Xte = SPLIT_STORE[sid]["Xte"].select_dtypes(include=[np.number])
    yte = SPLIT_STORE[sid]["yte"]

    pred = model.predict(Xte)

    if task == "classifier":
        return {
            "accuracy": accuracy_score(yte, pred),
            "f1": f1_score(yte, pred, average="weighted")
        }
    else:
        return {
            "mse": mean_squared_error(yte, pred),
            "r2": r2_score(yte, pred)
        }


def reset_session(req, args):
    sid = _get_sid(req)
    MODEL_STORE.pop(sid, None)
    SPLIT_STORE.pop(sid, None)
    req.session.flush()
    return {"message": "session reset"}


# ---------- DATASET MANAGER TOOL WRAPPERS ----------

def dm_get_structure(req, args):
    folder = args.get("folder")
    file = args.get("file")

    if folder == "/":
        folder = ""

    if folder or file:
        if not file:
            return {"error": "'file' is required when 'folder' is provided"}
        file_path = os.path.join(DM_DATASET_DIR, folder or "", file)
        if not os.path.isfile(file_path):
            return {"error": "File not found"}
        try:
            resp = read_and_process_file(file_path)
            if hasattr(resp, "content"):
                # If a Django Response slipped through, parse its content
                return json.loads(resp.content)
            return resp
        except Exception as e:
            return {"error": str(e)}

    # No specific file requested → return nested tree
    try:
        structure = get_nested_directory_structure(DM_DATASET_DIR)
        return structure
    except Exception as e:
        return {"error": str(e)}


def dm_create_folder(req, args):
    folder_name = args.get("folderName")
    parent = args.get("parent", "")
    if not folder_name:
        return {"error": "folderName is required"}
    try:
        folder_path = os.path.join(DM_DATASET_DIR, parent, folder_name)
        os.makedirs(folder_path, exist_ok=True)
        return {"message": "Folder created", "path": os.path.relpath(folder_path, DM_DATASET_DIR)}
    except Exception as e:
        return {"error": str(e)}


def dm_rename_item(req, args):
    current_name = args.get("currentName")
    new_name = args.get("newName")
    parent_folder = args.get("parentFolder", "")
    if not current_name or not new_name:
        return {"error": "currentName and newName are required"}
    try:
        current_path = os.path.join(DM_DATASET_DIR, parent_folder, current_name)
        new_path = os.path.join(DM_DATASET_DIR, parent_folder, new_name)
        if not os.path.exists(current_path):
            return {"error": "Item to rename not found"}
        os.rename(current_path, new_path)
        return {"message": "Renamed", "from": current_name, "to": new_name}
    except Exception as e:
        return {"error": str(e)}


def dm_delete_item(req, args):
    folder = args.get("folder", "")
    file = args.get("file")
    try:
        if file:
            path = os.path.join(DM_DATASET_DIR, folder, file)
            if os.path.isfile(path):
                os.remove(path)
                return {"message": "File deleted"}
            return {"error": "File not found"}
        else:
            path = os.path.join(DM_DATASET_DIR, folder)
            if os.path.isdir(path):
                shutil.rmtree(path)
                return {"message": "Folder deleted recursively"}
            return {"error": "Folder not found"}
    except Exception as e:
        return {"error": str(e)}


def dm_create_file(req, args):
    data = args.get("data")
    filename = args.get("filename")
    foldername = args.get("foldername", "")
    if not filename:
        return {"error": "filename is required"}
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".csv", ".xlsx"]:
        return {"error": f"Unsupported extension: {ext}. Use .csv or .xlsx"}
    try:
        df = pd.DataFrame(data)
        folder_path = os.path.join(DM_DATASET_DIR, foldername)
        os.makedirs(folder_path, exist_ok=True)
        file_path = os.path.join(folder_path, filename)
        if ext == ".csv":
            df.to_csv(file_path, index=False)
        else:
            df.to_excel(file_path, index=False)
        return {"message": "File created", "path": os.path.relpath(file_path, DM_DATASET_DIR)}
    except Exception as e:
        return {"error": str(e)}


def dm_read_file(req, args):
    folder = args.get("folder", "")
    file = args.get("file")
    if not file:
        return {"error": "file is required"}
    file_path = os.path.join(DM_DATASET_DIR, folder, file)
    if not os.path.isfile(file_path):
        return {"error": "File not found"}
    try:
        resp = read_and_process_file(file_path)
        if hasattr(resp, "content"):
            return json.loads(resp.content)
        return resp
    except Exception as e:
        return {"error": str(e)}


def dm_load_any_dataset(req, args):
    name = args.get("dataset") or args.get("dataset_name") or args.get("name")
    if not name:
        return {"error": "dataset is required"}

    hit = universal_dataset_search(name)
    if not hit:
        return {"error": f"Dataset '{name}' not found anywhere."}

    safe_name, folder = get_dataset_folder(name)
    csv_path = os.path.join(folder, f"{safe_name}.csv")

    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
    else:
        try:
            df = load_dataset_from_search(hit)
            df.to_csv(csv_path, index=False, encoding="utf-8")
        except Exception as e:
            return {"error": str(e)}

    df_clean = clean_df(df)
    preview = make_preview_json_safe(df_clean)

    try:
        local_download = req.build_absolute_uri(
            reverse("fetch_file") + f"?file_path={safe_name}/{safe_name}.csv"
        )
    except Exception:
        local_download = None

    source_download = get_source_download_url(hit)

    return {
        "dataset": safe_name,
        "source": hit.get("source"),
        "id": hit.get("id"),
        "columns": list(df_clean.columns),
        "rows": int(len(df_clean)),
        "preview": preview,
        "local_download": local_download,
        "source_download": source_download,
        "folder_path": f"dataset/{safe_name}/",
    }


# ---------- matflow_test WRAPPERS ----------

def mt_display_group(req, args):
    args = _resolve_dataset(req, args)
    return _resp_to_json(mtv.display_group(_drf_req(args)))


def mt_display_correlation(req, args):
    print("mt_display_correlation called with args:", args)
    args = _resolve_dataset(req, args)
    return _resp_to_json(mtv.display_correlation(_drf_req(args)))


def mt_feature_selection(req, args):
    args = _resolve_dataset(req, args)
    return _resp_to_json(mtv.feature_selection_api(_drf_req(args)))


def mt_imputation_data1(req, args):
    return _resp_to_json(mtv.imputation_data1(_drf_req(args)))


def mt_imputation_data2(req, args):
    return _resp_to_json(mtv.imputation_data2(_drf_req(args)))


def mt_imputation_result(req, args):
    return _resp_to_json(mtv.imputation_result(_drf_req(args)))


def mt_merge_dataset(req, args):
    return _resp_to_json(mtv.merge_dataset(_drf_req(args)))


def mt_encoding(req, args):
    return _resp_to_json(mtv.Encoding(_drf_req(args)))


def mt_scaling(req, args):
    return _resp_to_json(mtv.Scaling(_drf_req(args)))


def mt_drop_column(req, args):
    return _resp_to_json(mtv.Drop_column(_drf_req(args)))


def mt_drop_row(req, args):
    return _resp_to_json(mtv.Drop_row(_drf_req(args)))


def mt_append(req, args):
    return _resp_to_json(mtv.Append(_drf_req(args)))


def mt_cluster(req, args):
    return _resp_to_json(mtv.Cluster(_drf_req(args)))


def mt_split(req, args):
    return _resp_to_json(mtv.Split(_drf_req(args)))


def mt_build_model(req, args):
    return _resp_to_json(mtv.Build_model(_drf_req(args)))


def mt_hyper_opti(req, args):
    return _resp_to_json(mtv.Hyper_opti(_drf_req(args)))


def mt_model_evaluation_api(req, args):
    return _resp_to_json(mtv.model_evaluation(_drf_req(args)))


def mt_model_prediction(req, args):
    return _resp_to_json(mtv.model_prediction(_drf_req(args)))


def mt_time_series(req, args):
    return _resp_to_json(mtv.Time_series(_drf_req(args)))


def mt_time_series_analysis(req, args):
    return _resp_to_json(mtv.Time_series_analysis(_drf_req(args)))


def mt_reverse_ml(req, args):
    return _resp_to_json(mtv.Reverse_ml(_drf_req(args)))


def mt_deploy_data(req, args):
    return _resp_to_json(mtv.deploy_data(_drf_req(args)))


def mt_deploy_result(req, args):
    return _resp_to_json(mtv.deploy_result(_drf_req(args)))


def mt_pso_optimize(req, args):
    view = mtv.PsoOptimizeModel()
    return _resp_to_json(view.post(_drf_req(args)))


def mt_display_correlation_featurePair(req, args):
    args = _resolve_dataset(req, args)
    return _resp_to_json(mtv.display_correlation_featurePair(_drf_req(args)))


def mt_display_correlation_heatmap(req, args):
    args = _resolve_dataset(req, args)
    resp = mtv.display_correlation_heatmap(_drf_req(args))

    # If DRF Response with data
    if hasattr(resp, "data") and resp.data is not None:
        return resp.data

    # If HttpResponse-like with content: try JSON else return base64
    content = getattr(resp, "content", None)
    if content is not None:
        try:
            return json.loads(content)
        except Exception:
            try:
                try:
                    ct = resp['Content-Type']
                except Exception:
                    ct = getattr(resp, "content_type", "application/octet-stream")
                encoded = base64.b64encode(content).decode("ascii")
                return {"binary": encoded, "content_type": ct}
            except Exception:
                return {"message": "ok"}

    # Fallback
    return {"message": "ok"}


def mt_feature_creation(req, args):
    return _resp_to_json(mtv.feature_creation(_drf_req(args)))


def mt_change_dtype(req, args):
    return _resp_to_json(mtv.changeDtype(_drf_req(args)))


def mt_alter_field(req, args):
    return _resp_to_json(mtv.Alter_field(_drf_req(args)))


def mt_download_model(req, args):
    return _resp_to_json(mtv.download_model(_drf_req(args)))


# ---------- registry ----------
TOOLS = {
    "set_dataset": set_dataset,
    "show_head": show_head,
    "show_columns": show_columns,
    "correlation": correlation,
    "split": split,
    "train": train,
    "model_evaluation": model_evaluation,
    "reset_session": reset_session,
    # dataset manager
    "dm_get_structure": dm_get_structure,
    "dm_create_folder": dm_create_folder,
    "dm_rename_item": dm_rename_item,
    "dm_delete_item": dm_delete_item,
    "dm_create_file": dm_create_file,
    "dm_read_file": dm_read_file,
    "dm_load_any_dataset": dm_load_any_dataset,
    # matflow_test bridges
    "mt_display_group": mt_display_group,
    "mt_display_correlation": mt_display_correlation,
    "mt_feature_selection": mt_feature_selection,
    "mt_imputation_data1": mt_imputation_data1,
    "mt_imputation_data2": mt_imputation_data2,
    "mt_imputation_result": mt_imputation_result,
    "mt_merge_dataset": mt_merge_dataset,
    "mt_encoding": mt_encoding,
    "mt_scaling": mt_scaling,
    "mt_drop_column": mt_drop_column,
    "mt_drop_row": mt_drop_row,
    "mt_append": mt_append,
    "mt_cluster": mt_cluster,
    "mt_split": mt_split,
    "mt_build_model": mt_build_model,
    "mt_hyper_opti": mt_hyper_opti,
    "mt_model_evaluation_api": mt_model_evaluation_api,
    "mt_model_prediction": mt_model_prediction,
    "mt_time_series": mt_time_series,
    "mt_time_series_analysis": mt_time_series_analysis,
    "mt_reverse_ml": mt_reverse_ml,
    "mt_deploy_data": mt_deploy_data,
    "mt_deploy_result": mt_deploy_result,
    "mt_pso_optimize": mt_pso_optimize,
    # additional matflow_test bridges
    "mt_display_correlation_featurePair": mt_display_correlation_featurePair,
    "mt_display_correlation_heatmap": mt_display_correlation_heatmap,
    "mt_feature_creation": mt_feature_creation,
    "mt_change_dtype": mt_change_dtype,
    "mt_alter_field": mt_alter_field,
    "mt_download_model": mt_download_model,
}
