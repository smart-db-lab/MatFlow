import io
import base64
import logging
import os

import numpy as np
import pandas as pd
import joblib
from celery import shared_task
from matflow_test.services import workspace_service

logger = logging.getLogger(__name__)


def _coerce_numeric_like_columns(df):
    normalized = df.copy()
    for col in normalized.columns:
        if normalized[col].dtype == "object":
            converted = pd.to_numeric(normalized[col], errors="coerce")
            non_null = normalized[col].notna().sum()
            conv_non_null = converted.notna().sum()
            if non_null > 0 and non_null == conv_non_null:
                normalized[col] = converted
    return normalized


@shared_task(bind=True)
def run_batch_prediction(self, payload: dict) -> dict:
    """
    Celery task for batch model prediction.

    payload keys:
        preferred:
            model_workspace_id, model_file
            train_workspace_id, train_filename
            target_var
            batch_data
        legacy:
            model_deploy  – base64-encoded joblib model
            train         – list[dict]
    """
    # Deserialize model (server-file reference preferred; legacy blob fallback)
    try:
        if payload.get("model_workspace_id") and payload.get("model_file"):
            model_workspace_id = str(payload["model_workspace_id"])
            model_file = str(payload["model_file"])
            model_path = ""
            path_exists = False
            try:
                from projects.models import Workspace

                ws = Workspace.objects.get(pk=model_workspace_id)
                model_path = ws.output_path("models", model_file)
                path_exists = bool(model_path and os.path.exists(model_path))
            except Exception:
                model_path = ""
                path_exists = False

            logger.info(
                "[run_batch_prediction] Resolving model: workspace_id=%s model_file=%s path=%s exists=%s",
                model_workspace_id,
                model_file,
                model_path,
                path_exists,
            )

            model = workspace_service.load_model(
                model_workspace_id,
                model_file,
            )
            logger.info(
                "[run_batch_prediction] Loaded model type=%s has_predict=%s",
                type(model).__name__,
                hasattr(model, "predict"),
            )
        else:
            model_bytes = base64.b64decode(payload["model_deploy"])
            model = joblib.load(io.BytesIO(model_bytes))
    except Exception as exc:
        return {"error": f"Failed to load model: {exc}"}

    # Validate model has predict method (guard against wrong object type)
    if not hasattr(model, "predict"):
        model_type = type(model).__name__
        model_file = payload.get("model_file", "unknown")
        logger.error(
            f"Invalid model type loaded from '{model_file}': "
            f"Got {model_type} instead of sklearn estimator. "
            f"Model must have .predict() method."
        )
        model_path = ""
        path_exists = False
        try:
            if payload.get("model_workspace_id") and payload.get("model_file"):
                from projects.models import Workspace

                ws = Workspace.objects.get(pk=str(payload["model_workspace_id"]))
                model_path = ws.output_path("models", str(payload["model_file"]))
                path_exists = bool(model_path and os.path.exists(model_path))
        except Exception:
            model_path = ""
            path_exists = False
        return {
            "error": f"Invalid model type: {model_type}",
            "details": f"File '{model_file}' does not contain a valid sklearn estimator. "
            f"Expected object with .predict() method, got {model_type}. "
            f"path='{model_path}' exists={path_exists}"
        }

    # Build train DataFrame for schema + category encoding
    try:
        if payload.get("train_workspace_id") and payload.get("train_filename"):
            train_data = workspace_service.load_dataframe(
                str(payload["train_workspace_id"]),
                str(payload["train_filename"]),
            )
        else:
            train_data = pd.DataFrame(payload["train"])
        train_data = _coerce_numeric_like_columns(train_data)
    except Exception as exc:
        return {"error": f"Failed to process train data: {exc}"}

    target_var = str(payload["target_var"]).strip()

    # Determine feature columns (prefer model's own feature_names_in_)
    model_feature_names = getattr(model, "feature_names_in_", None)
    if model_feature_names is not None and len(model_feature_names) > 0:
        col_names_all = [str(c).strip() for c in model_feature_names]
    else:
        # exclude_columns = [target_var, "Id"]
        # col_names_all = [c for c in train_data.columns if c not in exclude_columns]

        col_names_all = [c for c in train_data.columns ]

    batch_rows = payload["batch_data"]
    total = len(batch_rows)
    report_every = max(1, total // 100) if total > 0 else 1

    predictions = []
    skipped = []

    for row_idx, raw_row in enumerate(batch_rows):
        row_label = f"Row {row_idx + 1}"
        X_input = []
        skip_reason = None

        for col in col_names_all:
            if col not in raw_row or raw_row[col] is None or str(raw_row[col]).strip() == "":
                skip_reason = f"Missing value for column '{col}'"
                break

            raw_val = raw_row[col]
            try:
                if col in train_data.columns:
                    if pd.api.types.is_integer_dtype(train_data[col]):
                        raw_val = int(float(str(raw_val)))
                    elif pd.api.types.is_float_dtype(train_data[col]):
                        raw_val = float(str(raw_val))
                    elif pd.api.types.is_object_dtype(train_data[col]) or pd.api.types.is_categorical_dtype(
                        train_data[col]
                    ):
                        raw_val = str(raw_val)
            except (ValueError, TypeError):
                skip_reason = (
                    f"Invalid value '{raw_val}' for column '{col}' "
                    f"(expected {train_data[col].dtype})"
                )
                break

            X_input.append(raw_val)

        if skip_reason:
            entry = {k: raw_row.get(k, "") for k in raw_row}
            entry["__row__"] = row_label
            entry["skip_reason"] = skip_reason
            skipped.append(entry)
            continue

        try:
            X_df = pd.DataFrame([X_input], columns=col_names_all)

            # Align categorical encoding with training-time category space
            for col in col_names_all:
                if col in train_data.columns and (
                    pd.api.types.is_object_dtype(train_data[col])
                    or pd.api.types.is_categorical_dtype(train_data[col])
                    or pd.api.types.is_bool_dtype(train_data[col])
                ):
                    categories = pd.Index(
                        train_data[col].astype(str).fillna("__missing__").unique()
                    )
                    input_val = (
                        str(X_df.at[0, col]) if pd.notna(X_df.at[0, col]) else "__missing__"
                    )
                    X_df[col] = pd.Categorical([input_val], categories=categories).codes

            pred = model.predict(X_df)[0]
            if isinstance(pred, (np.integer,)):
                pred = int(pred)
            elif isinstance(pred, (np.floating, float)):
                pred = None if (np.isnan(pred) or np.isinf(pred)) else float(pred)

            entry = {k: raw_row.get(k, "") for k in raw_row}
            entry[f"predicted_{target_var}"] = pred
            predictions.append(entry)

        except Exception as exc:
            entry = {k: raw_row.get(k, "") for k in raw_row}
            entry["__row__"] = row_label
            entry["skip_reason"] = f"Prediction failed: {exc}"
            skipped.append(entry)

        # Report progress approximately every 1% for smoother UI updates.
        processed = row_idx + 1
        if processed == total or (processed % report_every == 0):
            percent = int((processed / total) * 100) if total > 0 else 100
            self.update_state(
                state="PROGRESS",
                meta={
                    "processed": processed,
                    "total": total,
                    "percent": percent,
                },
            )

    return {
        "predictions": predictions,
        "skipped": skipped,
        "total": total,
        "predicted_count": len(predictions),
        "skipped_count": len(skipped),
    }
