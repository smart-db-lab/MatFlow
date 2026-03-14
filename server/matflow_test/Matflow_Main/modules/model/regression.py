import base64
import io
import json
import joblib

import pandas as pd
from django.http import JsonResponse
from ..regressor import svr
from ...modules.utils import split_xy
from ...modules.regressor import linear_regression, ridge_regression, lasso_regression, decision_tree_regression, random_forest_regression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error


def _build_input_schema(df: pd.DataFrame):
    schema = []
    for col in df.columns:
        col_dtype = df[col].dtype
        if pd.api.types.is_bool_dtype(col_dtype):
            data_type = "int"
            default_value = 0
        elif pd.api.types.is_integer_dtype(col_dtype):
            data_type = "int"
            default_value = int(df[col].dropna().median()) if not df[col].dropna().empty else 0
        elif pd.api.types.is_numeric_dtype(col_dtype):
            data_type = "float"
            default_value = float(df[col].dropna().median()) if not df[col].dropna().empty else 0.0
        else:
            data_type = "string"
            mode_series = df[col].dropna().astype(str).mode()
            default_value = str(mode_series.iloc[0]) if not mode_series.empty else ""

        schema.append({
            "col": col,
            "data_type": data_type,
            "value": default_value,
        })
    return schema


def _coerce_numeric_like_columns(df):
    """
    Convert object columns to numeric where all non-null values are numeric-like strings.
    """
    normalized = df.copy()
    for col in normalized.columns:
        if normalized[col].dtype == "object":
            converted = pd.to_numeric(normalized[col], errors="coerce")
            non_null_count = normalized[col].notna().sum()
            converted_non_null_count = converted.notna().sum()
            if non_null_count > 0 and non_null_count == converted_non_null_count:
                normalized[col] = converted
    return normalized


def _encode_categorical_features(train_df, test_df, full_df):
    """
    Encode non-numeric feature columns consistently across train/test/full datasets.
    Uses train categories as reference and maps unseen values to -1.
    """
    categorical_cols = train_df.select_dtypes(include=["object", "category", "bool"]).columns.tolist()
    for col in categorical_cols:
        train_series = train_df[col].astype(str).fillna("__missing__")
        categories = pd.Index(train_series.unique())
        train_df[col] = pd.Categorical(train_series, categories=categories).codes

        test_series = test_df[col].astype(str).fillna("__missing__")
        full_series = full_df[col].astype(str).fillna("__missing__")
        test_df[col] = pd.Categorical(test_series, categories=categories).codes
        full_df[col] = pd.Categorical(full_series, categories=categories).codes

    return train_df, test_df, full_df, categorical_cols


def regression(file):
    dataset=pd.DataFrame(file.get("file"))
    train_data = pd.DataFrame(file.get("train"))
    test_data = pd.DataFrame(file.get("test"))
    target_var = file.get("target_var")
    auto_encode_categorical = bool(file.get("auto_encode_categorical", False))

    dataset = _coerce_numeric_like_columns(dataset)
    train_data = _coerce_numeric_like_columns(train_data)
    test_data = _coerce_numeric_like_columns(test_data)

    X_train, y_train = split_xy(train_data, target_var)
    X_test, y_test = split_xy(test_data, target_var)

    try:
        X_train, X_test = X_train.drop(target_var, axis=1), X_test.drop(target_var, axis=1)
    except:
        pass

    if not pd.api.types.is_numeric_dtype(y_train):
        return JsonResponse(
            {"error": f"Target variable '{target_var}' must be numeric for regression."},
            status=400
        )

    X, _ = split_xy(dataset, target_var)
    try:
        X = X.drop(target_var, axis=1)
    except Exception:
        pass

    detected_categorical_cols = X_train.select_dtypes(include=["object", "category", "bool"]).columns.tolist()
    if detected_categorical_cols and not auto_encode_categorical:
        return JsonResponse(
            {
                "error": "Categorical feature columns detected. Please confirm before automatic encoding.",
                "requires_confirmation": True,
                "categorical_columns": detected_categorical_cols,
            },
            status=400,
        )

    X_train, X_test, X, _ = _encode_categorical_features(X_train.copy(), X_test.copy(), X.copy())

    regressors = {
        "Linear Regression": "LR",
        "Ridge Regression": "Ridge",
        "Lasso Regression": "Lasso",
        "Decision Tree Regression": "DT",
        "Random Forest Regression": "RF"
    }
    print(f"reg e ={X_train.columns}")
    metrics= ["R-Squared", "Mean Absolute Error", "Mean Squared Error", "Root Mean Squared Error"]
    regressor = file.get("regressor")
    if regressor == "Linear Regression":
        model = linear_regression.linear_regression(X_train, y_train,file)
    elif regressor == "Ridge Regression":
        model = ridge_regression.ridge_regression(X_train, y_train,file)
    elif regressor == "Lasso Regression":
        model = lasso_regression.lasso_regression(X_train, y_train,file)
    elif regressor == "Decision Tree Regression":
        model = decision_tree_regression.decision_tree_regressor(X_train, y_train,file)
    elif regressor == "Random Forest Regression":
        model = random_forest_regression.random_forest_regressor(X_train, y_train,file)
    elif regressor == "Support Vector Regressor":
        model=svr.support_vector_regressor(X_train, y_train,file)
    model.fit(X_train, y_train)
    y_prediction = model.predict(X)

    selected_metrics = get_result(model, X_test, y_test, metrics)
    i = 0
    for X, y in zip([X_train, X_test], [y_train, y_test]):
        list2 = get_result(model, X, y, metrics)
        if (i == 0):
            list1 = get_result(model, X, y, metrics)
            i += 1
    merged_list = {
        f"Train {key}": value
        for key, value in list1.items()
    }

    merged_list.update({
        f"Test {key}": value
        for key, value in list2.items()
    })
    y_prediction=json.dumps(y_prediction.tolist())
    buffer = io.BytesIO()
    joblib.dump(model, buffer)
    buffer.seek(0)
    model_bytes = buffer.read()
    buffer.close()

    # Encode the bytes to a base64 string
    model_encoded = base64.b64encode(model_bytes).decode('utf-8')
    obj={
        "metrics": selected_metrics,   #4
        "metrics_table":merged_list,     #8
        "y_pred" : y_prediction,
        "model_deploy": model_encoded,
        "feature_columns": list(X_train.columns),
        "input_schema": _build_input_schema(X_train),
    }
    return JsonResponse(obj)

def get_result(model, X, y, metrics):
    y_pred = model.predict(X)
    metric_dict = {
        "R-Squared": r2_score(y, y_pred),
        "Mean Absolute Error": mean_absolute_error(y, y_pred),
        "Mean Squared Error": mean_squared_error(y, y_pred),
        "Root Mean Squared Error": mean_squared_error(y, y_pred, squared=False)
    }
    result=metric_dict
    return result
