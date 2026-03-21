"""
workspace_service.py
====================
Central helper for loading and saving datasets within a Workspace's folder
structure.  All matflow operations should use these helpers instead of
reading/writing files themselves.

Workspace disk layout
---------------------
<MEDIA_ROOT>/projects/<project_uuid>/workspaces/<workspace_uuid>/
    original_dataset/          ← uploaded file lives here
    output/
        generated_datasets/    ← every transformed CSV is saved here
        train_test/            ← train.csv / test.csv
        charts/                ← PNG / HTML plots
        models/                ← .pkl / .pth model files
"""

from __future__ import annotations

import os
import pickle
from typing import Optional

import pandas as pd
import joblib


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_workspace(workspace_id: str):
    """Return the Workspace ORM object or raise ValueError."""
    from projects.models import Workspace  # lazy import to avoid circular deps

    try:
        return Workspace.objects.get(pk=workspace_id)
    except Workspace.DoesNotExist:
        raise ValueError(f"Workspace '{workspace_id}' does not exist.")


def _read_csv_or_excel(path: str) -> pd.DataFrame:
    ext = os.path.splitext(path)[1].lower()
    if ext in (".xls", ".xlsx"):
        return pd.read_excel(path)
    return pd.read_csv(path)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def resolve_input_path(workspace_id: str, filename: Optional[str] = None) -> str:
    """
    Return the absolute path of the file to read.

    Resolution order:
    1. If *filename* is given and lives inside ``output/generated_datasets/``,
       use that.
    2. If *filename* is given and lives inside ``output/train_test/``, use that.
    3. If *filename* is given and lives inside ``original_dataset/``, use that.
    4. Fall back to the original uploaded file.
    """
    ws = _get_workspace(workspace_id)

    if filename:
        filename = os.path.basename(str(filename).strip())
        candidates = [
            ws.output_path("generated_datasets", filename),
            ws.output_path("train_test", filename),
            os.path.join(ws.base_dir, "original_dataset", filename),
        ]
        for p in candidates:
            if os.path.exists(p):
                return p

        # Try common extensions if exact filename not found
        common_extensions = ['.csv', '.xlsx', '.xls', '.json', '.parquet']
        for ext in common_extensions:
            if not filename.endswith(ext):
                filename_with_ext = filename + ext
                candidates_with_ext = [
                    ws.output_path("generated_datasets", filename_with_ext),
                    ws.output_path("train_test", filename_with_ext),
                    os.path.join(ws.base_dir, "original_dataset", filename_with_ext),
                ]
                for p in candidates_with_ext:
                    if os.path.exists(p):
                        return p

        # Absolute path supplied directly (edge-case / testing)
        if os.path.isabs(filename) and os.path.exists(filename):
            return filename

        original_dir = os.path.join(ws.base_dir, "original_dataset")
        original_files = []
        try:
            if os.path.isdir(original_dir):
                original_files = sorted(os.listdir(original_dir))
        except Exception:
            original_files = []

        checked_paths = [os.path.abspath(p) for p in candidates]
        raise FileNotFoundError(
            (
                f"File '{filename}' not found in workspace '{workspace_id}'. "
                f"Checked: {checked_paths}. "
                f"Workspace dataset_filename='{ws.dataset_filename}'. "
                f"original_dataset files={original_files}"
            )
        )

    # No filename → use original upload
    original = ws.original_dataset_path()
    if not os.path.exists(original):
        raise FileNotFoundError(
            f"Original dataset not found for workspace '{workspace_id}'."
        )
    return original


def load_dataframe(workspace_id: str, filename: Optional[str] = None) -> pd.DataFrame:
    """Load a CSV/Excel from the workspace and return a DataFrame."""
    path = resolve_input_path(workspace_id, filename)
    return _read_csv_or_excel(path)


def save_dataframe(
    workspace_id: str,
    df: pd.DataFrame,
    subfolder: str,
    filename: str,
) -> str:
    """
    Save *df* to ``output/<subfolder>/<filename>`` inside the workspace.

    Returns the absolute path of the saved file.
    """
    ws = _get_workspace(workspace_id)
    dest = ws.output_path(subfolder, filename)
    os.makedirs(os.path.dirname(dest), exist_ok=True)

    ext = os.path.splitext(filename)[1].lower()
    if ext in (".xls", ".xlsx"):
        df.to_excel(dest, index=False)
    else:
        df.to_csv(dest, index=False)

    return dest


def save_model(workspace_id: str, model, filename: str) -> str:
    """
    Pickle *model* into ``output/models/<filename>``.

    Returns the absolute path.
    """
    ws = _get_workspace(workspace_id)
    dest = ws.output_path("models", filename)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as fh:
        pickle.dump(model, fh)
    return dest


def load_model(workspace_id: str, filename: str):
    """Unpickle a model from ``output/models/<filename>``."""
    ws = _get_workspace(workspace_id)
    path = ws.output_path("models", filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model '{filename}' not found in workspace '{workspace_id}'.")

    # Preferred: models are persisted via joblib in Build_model flow.
    try:
        print(f"Attempting to load model using joblib from path: {path}")
        model = joblib.load(path)
        if not hasattr(model, "predict"):
            raise TypeError(
                f"joblib-loaded object is '{type(model).__name__}', expected estimator with .predict()"
            )
        return model
    except Exception as joblib_exc:
        # Backward compatibility: older artifacts may be plain pickle.
        try:
            with open(path, "rb") as fh:
                print("Falling back to pickle loading for model at path:", path)
                model = pickle.load(fh)
            if not hasattr(model, "predict"):
                raise TypeError(
                    f"pickle-loaded object is '{type(model).__name__}', expected estimator with .predict()"
                )
            return model
        except Exception as pickle_exc:
            raise ValueError(
                "Failed to deserialize a valid model estimator. "
                f"joblib_error={joblib_exc}; pickle_error={pickle_exc}; path='{path}'"
            )


def save_chart(workspace_id: str, data: bytes, filename: str) -> str:
    """Save raw bytes (PNG / HTML) into ``output/charts/<filename>``."""
    ws = _get_workspace(workspace_id)
    dest = ws.output_path("charts", filename)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as fh:
        fh.write(data)
    return dest


def list_generated_datasets(workspace_id: str) -> list[str]:
    """Return filenames in ``output/generated_datasets/``."""
    ws = _get_workspace(workspace_id)
    folder = ws.output_path("generated_datasets")
    if not os.path.exists(folder):
        return []
    return sorted(os.listdir(folder))
