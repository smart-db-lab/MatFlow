import base64
import io
import json
import logging
import os

import pandas as pd
import numpy as np
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from rest_framework import status
from rest_framework.views import APIView

from .Matflow_Main.modules import utils
from .Matflow_Main.modules.classes import imputer
from .Matflow_Main.modules.classifier import knn, svm, log_reg, decision_tree, random_forest, perceptron
from .Matflow_Main.modules.dataframe.correlation import display_heatmap, display_pair
from .Matflow_Main.modules.feature import feature_selection
from .Matflow_Main.modules.feature.append import append
from .Matflow_Main.modules.feature.change_dtype import Change_dtype
from .Matflow_Main.modules.feature.change_fieldname import change_field_name
from .Matflow_Main.modules.feature.cluster import cluster_dataset
from .Matflow_Main.modules.feature.creation import creation
from .Matflow_Main.modules.feature.dropping import  drop_row, drop_column
from .Matflow_Main.modules.feature.encoding import encoding
from .Matflow_Main.modules.feature.merge_dataset import merge_df
from .Matflow_Main.modules.feature.scaling import scaling
from .Matflow_Main.modules.model.classification import classification
from .Matflow_Main.modules.model.model_report import model_report
from .Matflow_Main.modules.model.prediction_classification import prediction_classification
from .Matflow_Main.modules.model.prediction_regression import prediction_regression
from .Matflow_Main.modules.model.regression import regression
from .Matflow_Main.modules.model.split_dataset import split_dataset
from .Matflow_Main.modules.model.dataset_metadata import get_dataset_metadata
from .Matflow_Main.modules.regressor import linear_regression, ridge_regression, lasso_regression, \
    decision_tree_regression, random_forest_regression, svr
from .Matflow_Main.modules.utils import split_xy
from .Matflow_Main.subpage.Reverse_ML import reverse_ml
from .Matflow_Main.subpage.temp import temp
from .Matflow_Main.subpage.time_series import  time_series
from .Matflow_Main.subpage.time_series_analysis import  time_series_analysis
import joblib
from celery.result import AsyncResult
from .tasks import run_batch_prediction
from matflow_test.services import workspace_service


# ──────────────────────────────────────────────────────────────────────────────
# Workspace helper functions
# Auth views (signup / verify_code / login) live in users/views.py
# ──────────────────────────────────────────────────────────────────────────────

def _inject_workspace(request):
    """Deserialise request data and inject a DataFrame loaded from disk as
    ``data['file']`` when *workspace_id* is present in the payload.

    Returns a plain mutable ``dict`` suitable to pass to module functions.
    Maintains full backward compatibility: if no workspace_id is provided,
    the caller is expected to have already embedded ``file`` as a list of records.
    """
    data = dict(request.data) if hasattr(request, "data") else json.loads(request.body)
    ws_id = data.get("workspace_id")
    fn = data.get("filename")
    
    print(f"[_inject_workspace] Received: workspace_id={ws_id}, filename={fn}")
    
    if ws_id:
        try:
            df = workspace_service.load_dataframe(ws_id, fn)
            data["file"] = df.to_dict(orient="records")
            print(f"[_inject_workspace] Successfully loaded {len(data['file'])} rows")
        except Exception as e:
            print(f"[_inject_workspace] Error loading dataframe: {str(e)}")
            raise
    return data


def _inject_workspace2(request):
    """Like :func:`_inject_workspace` but also loads a second file into
    ``data['file2']`` when *filename2* is provided."""
    data = _inject_workspace(request)
    ws_id = data.get("workspace_id")
    if ws_id:
        fn2 = data.get("filename2") or None
        if fn2:
            df2 = workspace_service.load_dataframe(ws_id, fn2)
            data["file2"] = df2.to_dict(orient="records")
    return data


def _inject_workspace_train_test(request):
    """Load *train* and/or *test* DataFrames from workspace when workspace_id
    is present, plus the primary *file* if *filename* is given."""
    data = dict(request.data) if hasattr(request, "data") else json.loads(request.body)
    ws_id = data.get("workspace_id")
    if not ws_id:
        return data
    train_fn = data.get("train_filename")
    test_fn  = data.get("test_filename")
    file_fn  = data.get("filename")
    if train_fn:
        data["train"] = workspace_service.load_dataframe(ws_id, train_fn).to_dict(orient="records")
    if test_fn:
        data["test"]  = workspace_service.load_dataframe(ws_id, test_fn).to_dict(orient="records")
    if file_fn:
        data["file"]  = workspace_service.load_dataframe(ws_id, file_fn).to_dict(orient="records")
    return data


# ──────────────────────────────────────────────────────────────────────────────
# Dataset / correlation views
# ──────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def display_group(request):
    data = _inject_workspace(request)
    file = pd.DataFrame(data.get('file', []))
    group_var = data.get("group_var")
    agg_func = data.get("agg_func")
    result = file.groupby(by=group_var, as_index=False).agg(agg_func)
    return JsonResponse({'data': result.to_json(orient='records')})
@api_view(['POST'])
@permission_classes([AllowAny])
def display_correlation(request):
    data = _inject_workspace(request)
    file = pd.DataFrame(data.get('file', [])).select_dtypes(include='number')
    method = str(data.get("method") or "pearson").strip().lower()
    if method not in {"pearson", "spearman", "kendall"}:
        method = "pearson"
    correlation_data = file.corr(method=method)
    return JsonResponse({'data': correlation_data.to_json(orient='records')})
@api_view(['POST'])
@permission_classes([AllowAny])
def display_correlation_featurePair(request):
    data = _inject_workspace(request)
    correlation_data = pd.DataFrame(data.get('file', []))
    df = display_pair(correlation_data, data.get('gradient'), data.get('feature1'),
                      data.get('feature2'), data.get('high'), data.get('drop'), data.get('absol'))
    return JsonResponse({'data': df.to_json(orient='records')})
@api_view(['POST'])
@permission_classes([AllowAny])
def display_correlation_heatmap(request):
    data = _inject_workspace(request)
    correlation_data = pd.DataFrame(data.get('file', []))
    return display_heatmap(correlation_data)
@api_view(['POST'])
@permission_classes([AllowAny])
def feature_creation(request):
    data = _inject_workspace(request)
    response = creation(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def changeDtype(request):
    data = _inject_workspace(request)
    response = Change_dtype(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Alter_field(request):
    data = _inject_workspace(request)
    response = change_field_name(data)
    return response
from numpyencoder import NumpyEncoder
@api_view(['POST'])
@permission_classes([AllowAny])
def feature_selection_api(request):
    data = dict(request.data) if hasattr(request, 'data') else json.loads(request.body)
    ws_id = data.get('workspace_id')
    if ws_id:
        fn = data.get('filename') or None
        df = workspace_service.load_dataframe(ws_id, fn)
        data['dataset'] = df.to_dict(orient='records')
    dataset = pd.DataFrame(data.get('dataset', [])).reset_index(drop=True)
    target_var = data.get('target_var')
    method = data.get('method')
    selected_features_df = feature_selection.feature_selection(data, dataset, target_var, method)
    return JsonResponse({'selected_features': selected_features_df}, encoder=NumpyEncoder)

@api_view(['POST'])
@permission_classes([AllowAny])
def imputation_data1(request):
    file = _inject_workspace(request)
    data = pd.DataFrame(file.get('file', []))
    null_var = utils.get_null(data)
    low_cardinality = utils.get_low_cardinality(data, add_hyphen=True)
    return JsonResponse({'null_var': null_var, 'group_by': low_cardinality}, safe=False)

@api_view(['POST'])
@permission_classes([AllowAny])
def imputation_data2(request):
    file = _inject_workspace(request)
    data = pd.DataFrame(file.get('file', []))
    var = file.get('Select_columns')
    num_var = utils.get_numerical(data)
    category = ''
    mode = None
    max_val = None
    if var in num_var:
        category = 'numerical'
        max_val = abs(data[var]).max()
    else:
        category = 'categorical'
        mode = data[var].mode().to_dict()
    null_var = utils.get_null(data)
    low_cardinality = utils.get_low_cardinality(data, add_hyphen=True)
    return JsonResponse({
        'null_var': null_var,
        'group_by': low_cardinality,
        'max_val': max_val,
        'mode': mode,
        'category': category,
    }, safe=False)


@api_view(['POST'])
@permission_classes([AllowAny])
def imputation_result(request):
    file = _inject_workspace(request)
    data = pd.DataFrame(file.get('file', []))
    strat = file.get('strategy')
    fill_group = file.get('fill_group')
    var = file.get("Select_columns")
    constant = file.get('constant', 0)
    fill_group = None if (fill_group == "-") else fill_group
    imp = imputer.Imputer(strategy=strat, columns=[var], fill_value=constant, group_col=fill_group)
    new_value = imp.fit_transform(data).reset_index().to_dict(orient='records')
    return JsonResponse({"dataset": new_value}, safe=False)

@api_view(['POST'])
@permission_classes([AllowAny])
def merge_dataset(request):
    data = _inject_workspace2(request)
    response = merge_df(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Encoding(request):
    data = _inject_workspace(request)
    response = encoding(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Scaling(request):
    data = _inject_workspace(request)
    response = scaling(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Drop_column(request):
    data = _inject_workspace(request)
    response = drop_column(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Drop_row(request):
    data = _inject_workspace(request)
    response = drop_row(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Append(request):
    data = _inject_workspace2(request)
    response = append(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Cluster(request):
    data = _inject_workspace(request)
    response = cluster_dataset(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Split(request):
    data = _inject_workspace(request)
    response = split_dataset(data)
    # Persist train/test splits to the workspace when workspace_id is provided
    ws_id = data.get('workspace_id')
    if ws_id and getattr(response, 'status_code', None) == 200:
        try:
            result = json.loads(response.content)
            if 'train' in result and 'test' in result:
                train_df = pd.DataFrame(result['train'])
                test_df  = pd.DataFrame(result['test'])
                
                # Get filename with extension
                filename = data.get('filename', 'data.csv')
                base = os.path.splitext(filename)[0]
                ext = os.path.splitext(filename)[1]  # Preserve original extension
                
                # Save the dataframes to workspace with original extension
                train_filename = f'train_{base}{ext}'
                test_filename = f'test_{base}{ext}'
                workspace_service.save_dataframe(ws_id, train_df, 'train_test', train_filename)
                workspace_service.save_dataframe(ws_id, test_df,  'train_test', test_filename)
                
                # Log successful file saving
                print(f"Successfully saved split files: {train_filename}, {test_filename} in train_test folder")
        except Exception as e:
            print(f"Error saving split files to workspace: {str(e)}")
            import traceback
            traceback.print_exc()
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def DatasetMetadata(request):
    """
    Get dataset metadata including column names, types, and sample rows.
    This endpoint is optimized to avoid loading the entire dataset when only metadata is needed.
    """
    data = _inject_workspace(request)
    response = get_dataset_metadata(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Hyper_opti(request):
    data = _inject_workspace_train_test(request)
    train_data=pd.DataFrame(data.get("train"))
    test_data=pd.DataFrame(data.get("test"))
    target_var=data.get("target_var")
    # print(f"{train_data.head} {test_data.head} {target_var}")
    X_train, y_train = split_xy(train_data, target_var)
    X_test, y_test = split_xy(test_data, target_var)
    type=data.get("type")
    if(type=="classifier"):
        classifier=data.get("classifier")
        if(classifier=="K-Nearest Neighbors"):
            response= knn.hyperparameter_optimization(X_train, y_train,data)
        elif(classifier=="Support Vector Machine"):
            response= svm.hyperparameter_optimization(X_train, y_train,data)
        elif(classifier=="Logistic Regression"):
            response= log_reg.hyperparameter_optimization(X_train, y_train,data)
        elif(classifier=="Decision Tree Classification"):
            response= decision_tree.hyperparameter_optimization(X_train, y_train,data)
        elif(classifier=="Random Forest Classification"):
            response = random_forest.hyperparameter_optimization(X_train, y_train, data)
        elif(classifier=="Multilayer Perceptron"):
            response = perceptron.hyperparameter_optimization(X_train, y_train, data)
    else :
        regressor = data.get("regressor")
        if regressor == "Linear Regression":
            response = linear_regression.hyperparameter_optimization(X_train, y_train,data)
        elif regressor == "Ridge Regression":
            response = ridge_regression.hyperparameter_optimization(X_train, y_train,data)
        elif regressor == "Lasso Regression":
            response = lasso_regression.hyperparameter_optimization(X_train, y_train,data)
        elif regressor == "Decision Tree Regression":
            response = decision_tree_regression.hyperparameter_optimization(X_train, y_train,data)
        elif regressor == "Random Forest Regression":
            response = random_forest_regression.hyperparameter_optimization(X_train, y_train,data)
        elif regressor == "Support Vector Regressor":
            response = svr.hyperparameter_optimization(X_train, y_train,data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Build_model(request):
    data = _inject_workspace_train_test(request)
    if data.get("type") == "classifier":
        response = classification(data)
    else:
        response = regression(data)

    # Persist model + metadata to workspace/models when workspace context exists.
    ws_id = data.get("workspace_id")
    if ws_id and getattr(response, "status_code", None) == 200:
        try:
            payload = json.loads(response.content)
            model_encoded = payload.get("model_deploy")
            if isinstance(model_encoded, str) and model_encoded:
                from projects.models import Workspace

                ws = Workspace.objects.get(pk=ws_id)

                raw_model_name = str(data.get("model_name") or "model").strip()
                safe_model_name = "".join(
                    ch if (ch.isalnum() or ch in ("_", "-", ".")) else "_"
                    for ch in raw_model_name
                ).strip("._") or "model"

                model_filename = f"{safe_model_name}.pkl"
                metadata_filename = f"{safe_model_name}.metadata.json"

                model_bytes = base64.b64decode(model_encoded)
                model_path = ws.output_path("models", model_filename)
                os.makedirs(os.path.dirname(model_path), exist_ok=True)
                with open(model_path, "wb") as model_fp:
                    model_fp.write(model_bytes)

                metadata = {
                    "model_name": safe_model_name,
                    "target_var": data.get("target_var"),
                    "type": data.get("type"),
                    "regressor": data.get("regressor"),
                    "classifier": data.get("classifier"),
                    "input_schema": payload.get("input_schema", []),
                    "feature_columns": payload.get("feature_columns", []),
                    "train_filename": data.get("train_filename"),
                    "test_filename": data.get("test_filename"),
                }

                metadata_path = ws.output_path("models", metadata_filename)
                with open(metadata_path, "w", encoding="utf-8") as meta_fp:
                    json.dump(metadata, meta_fp, ensure_ascii=False, indent=2)

                payload["workspace_model_file"] = model_filename
                payload["workspace_metadata_file"] = metadata_filename
                response = JsonResponse(payload, status=200)
        except Exception as e:
            logger.exception("Failed to persist model in workspace: %s", e)

    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def model_evaluation(request):
    data = dict(request.data) if hasattr(request, 'data') else json.loads(request.body)
    response = model_report(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def model_prediction(request):
    data = _inject_workspace(request)
    model_type = data.get("type")
    
    # Log for debugging
    ws_id = data.get("workspace_id")
    fn = data.get("filename")
    print(f"[model_prediction] workspace_id={ws_id}, filename={fn}, type={model_type}")
    
    try:
        if model_type == "regressor":
            response = prediction_regression(data)
        else:
            response = prediction_classification(data)
        return response
    except ValueError as exc:
        print(f"[model_prediction] ValueError: {str(exc)}")
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        print(f"[model_prediction] Unexpected error: {str(exc)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(exc)}, status=500)
import pickle
from django.http import HttpResponse
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def download_model(file):
    model = pickle.loads(file.get("model"))
    model_binary = pickle.dumps(model)
    response = HttpResponse(model_binary, content_type='application/octet-stream')
    response['Content-Disposition'] = f'attachment; filename="model_name".pkl"'
    return response




# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
)

@api_view(['GET','POST'])
@permission_classes([AllowAny])
def deploy_data(request):
    logger.info("=== deploy_data called ===")

    def _sanitize_for_json(value):
        """
        Recursively convert non-JSON-safe numeric values to None.
        - NaN, +inf, -inf -> None
        - numpy scalar types -> native Python types
        """
        if isinstance(value, dict):
            return {k: _sanitize_for_json(v) for k, v in value.items()}

        if isinstance(value, list):
            return [_sanitize_for_json(v) for v in value]

        if isinstance(value, tuple):
            return [_sanitize_for_json(v) for v in value]

        if isinstance(value, (np.integer,)):
            return int(value)

        if isinstance(value, (np.floating, float)):
            if np.isnan(value) or np.isinf(value):
                return None
            return float(value)

        try:
            if pd.isna(value):
                return None
        except Exception:
            pass

        return value

    # Step 1: Parse the incoming JSON data
    try:
        file = dict(request.data)
        logger.info("Parsed JSON data successfully.")
    except Exception as e:
        logger.error(f"JSON decoding failed: {e}")
        return JsonResponse({"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST)

    # Load train data from workspace when workspace_id is provided
    ws_id = file.get('workspace_id')
    if ws_id:
        train_fn = file.get('train_filename') or file.get('filename')
        if train_fn:
            try:
                file['train'] = workspace_service.load_dataframe(ws_id, train_fn).to_dict(orient='records')
            except Exception as e:
                return JsonResponse({"error": f"Failed to load workspace data: {e}"},
                                    status=status.HTTP_400_BAD_REQUEST)

    # Validate required keys
    required_keys = ['train', 'target_var']
    for key in required_keys:
        if key not in file:
            logger.error(f"Missing required key: {key}")
            return JsonResponse({"error": f"Missing required key: {key}"}, status=status.HTTP_400_BAD_REQUEST)

    def _coerce_numeric_like_columns(df):
        normalized = df.copy()
        for col in normalized.columns:
            if normalized[col].dtype == "object":
                converted = pd.to_numeric(normalized[col], errors="coerce")
                non_null_count = normalized[col].notna().sum()
                converted_non_null_count = converted.notna().sum()
                if non_null_count > 0 and non_null_count == converted_non_null_count:
                    normalized[col] = converted
        return normalized

    # Step 2: Convert 'train' data to a Pandas DataFrame
    train_data_list = file.get('train')
    if not isinstance(train_data_list, list) or not train_data_list:
        logger.error("Invalid or empty 'train' data.")
        return JsonResponse({"error": "Invalid or empty 'train' data."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        train_data = pd.DataFrame(train_data_list)
        train_data = _coerce_numeric_like_columns(train_data)
        logger.info(f"train_data created with shape: {train_data.shape}")
        logger.info(f"train_data columns: {train_data.columns.tolist()}")
    except Exception as e:
        logger.error(f"Failed to create DataFrame from 'train' data: {e}")
        return JsonResponse({"error": "Failed to process 'train' data."}, status=status.HTTP_400_BAD_REQUEST)

    target_var_original = file.get('target_var')
    if not target_var_original:
        logger.error("No target_var provided in the request.")
        return JsonResponse(
            {"error": "No target_var provided in the request."},
            status=status.HTTP_400_BAD_REQUEST
        )
    logger.info(f"Original target variable: {target_var_original}")

    # Step 5: Transform target_var to match standardized column names
    if isinstance(target_var_original, str):
        target_var = target_var_original.strip()
    else:
        logger.error("Invalid type for target_var. It should be a string.")
        return JsonResponse(
            {"error": "Invalid type for target_var. It should be a string."},
            status=status.HTTP_400_BAD_REQUEST
        )
    logger.info(f"Transformed target variable: {target_var}")

    # Step 6: Validate the presence of target_var in DataFrame
    if target_var not in train_data.columns:
        logger.error(f"Target variable '{target_var}' not found in train_data columns.")
        return JsonResponse(
            {"error": f"Target variable '{target_var}' not found in data."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Step 7: Determine if the task is Regression or Classification
    is_classification = not pd.api.types.is_numeric_dtype(train_data[target_var])
    task_type = "Classification" if is_classification else "Regression"
    logger.info(f"Task type determined: {task_type}")

    # Encode the target variable if classification
    if is_classification:
        try:
            train_data[target_var] = train_data[target_var].astype('category').cat.codes
            logger.info(f"Encoded '{target_var}' column with values: {train_data[target_var].unique()}")
        except Exception as e:
            logger.error(f"Failed to encode target variable '{target_var}': {e}")
            return JsonResponse(
                {"error": f"Failed to encode target variable '{target_var}': {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # Step 8: Define feature columns excluding the target variable and 'Id'
    exclude_columns = ['Id']
    col_names_all = [col for col in train_data.columns if col != target_var and col not in exclude_columns]
    logger.info(f"Feature columns before excluding {exclude_columns}: {col_names_all}")

    # Step 10: Verify that all required columns are present
    required_columns = col_names_all + [target_var]
    missing_columns = [col for col in required_columns if col not in train_data.columns]
    if missing_columns:
        logger.error(f"Missing columns in training data: {missing_columns}")
        return JsonResponse(
            {"error": f"Missing columns in training data: {missing_columns}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Step 11: Calculate correlations
    try:
        correlations = train_data[col_names_all + [target_var]].corr(numeric_only=True)[target_var]
        logger.info(f"Calculated correlations for target '{target_var}':\n{correlations}")
    except KeyError as e:
        logger.error(f"Correlation calculation failed due to missing column: {e}")
        return JsonResponse(
            {"error": f"Correlation calculation failed: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"An unexpected error occurred during correlation calculation: {e}")
        return JsonResponse(
            {"error": "An unexpected error occurred during correlation calculation."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Step 12: Create DataFrame for correlations
    try:
        df_correlations = pd.DataFrame(correlations).rename(columns={target_var: f'Correlation({target_var})'})
        df_correlations['Threshold'] = ''
        logger.info("Created DataFrame for correlations.")
    except Exception as e:
        logger.error(f"Failed to create correlations DataFrame: {e}")
        return JsonResponse(
            {"error": "Failed to create correlations DataFrame."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    result = []

    # Step 13: Process each feature column
    for col in col_names_all:
        try:
            if pd.api.types.is_numeric_dtype(train_data[col]):
                max_abs = train_data[col].abs().max()
                data_type = 'int' if pd.api.types.is_integer_dtype(train_data[col]) else 'float'
                correlation = correlations.get(col, 0)
                threshold = max_abs if correlation >= 0 else -max_abs
                threshold_value = float(threshold) if data_type == 'float' else int(threshold)
            else:
                data_type = 'string'
                mode_series = train_data[col].dropna().mode()
                threshold_value = str(mode_series.iloc[0]) if not mode_series.empty else ""
                threshold = threshold_value

            result.append({
                "col": col,
                "value": threshold_value,
                "data_type": data_type
            })
            if col in df_correlations.index:
                df_correlations.at[col, 'Threshold'] = threshold
            logger.info(f"Processed column '{col}': Threshold={threshold_value}, Data Type={data_type}")
        except Exception as e:
            logger.error(f"Error processing column '{col}': {e}")
            return JsonResponse(
                {"error": f"Error processing column '{col}': {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # Step 14: Drop the target variable's correlation row if present
    if target_var in df_correlations.index:
        df_correlations = df_correlations.drop(target_var)
        logger.info("Dropped the target variable's correlation row from df_correlations.")

    # Step 15: Rename the correlation column
    df_correlations = df_correlations.rename(columns={f'Correlation({target_var})': 'Correlation'})
    logger.info("Renamed correlation column to 'Correlation'.")

    # Step 16: Prepare the DataFrame for the response
    df_correlations = df_correlations.rename_axis("Feature", axis="index")
    df_correlations = df_correlations.reset_index().to_dict(orient='records')
    logger.info("Converted df_correlations to dictionary for response.")

    # Step 17: Structure the JSON response
    response = {
        "task_type": task_type,
        "result": result,
        "correlations": df_correlations
    }

    response = _sanitize_for_json(response)
    logger.info("Sending JSON response.")
    return JsonResponse(response, status=status.HTTP_200_OK)


@api_view(['GET','POST'])
@permission_classes([AllowAny])
def deploy_result(request):
    logger.info("=== deploy_result called ===")

    # Step 1: Parse the incoming JSON data
    try:
        file = dict(request.data)
        logger.info("Parsed JSON data successfully.")
    except Exception as e:
        logger.error(f"JSON decoding failed: {e}")
        return JsonResponse({"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST)

    # Load train data from workspace when workspace_id is provided
    ws_id = file.get('workspace_id')
    if ws_id:
        train_fn = file.get('train_filename') or file.get('filename')
        if train_fn:
            try:
                file['train'] = workspace_service.load_dataframe(ws_id, train_fn).to_dict(orient='records')
            except Exception as e:
                return JsonResponse({"error": f"Failed to load workspace data: {e}"},
                                    status=status.HTTP_400_BAD_REQUEST)

    # Validate required keys
    required_keys = ['model_deploy', 'result', 'train', 'target_var']
    for key in required_keys:
        if key not in file:
            logger.error(f"Missing required key: {key}")
            return JsonResponse({"error": f"Missing required key: {key}"}, status=status.HTTP_400_BAD_REQUEST)

    # Step 2: Decode and deserialize the model using joblib
    try:
        model_encoded = file.get("model_deploy")
        if not model_encoded or not isinstance(model_encoded, str):
            logger.error("Invalid or empty model_deploy payload.")
            return JsonResponse(
                {"error": "Invalid or empty model_deploy payload."},
                status=status.HTTP_400_BAD_REQUEST
            )
        model_bytes = base64.b64decode(model_encoded)
        buffer = io.BytesIO(model_bytes)
        model = joblib.load(buffer)
        buffer.close()
        logger.info("Model deserialized successfully.")
    except (base64.binascii.Error, joblib.externals.loky.process_executor.TerminatedWorkerError, EOFError) as e:
        logger.error(f"Failed to decode or deserialize model: {e}")
        return JsonResponse(
            {"error": f"Failed to decode or deserialize model: {e}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error during model deserialization: {e}")
        return JsonResponse(
            {"error": "Unexpected error during model deserialization."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    def _coerce_numeric_like_columns(df):
        normalized = df.copy()
        for col in normalized.columns:
            if normalized[col].dtype == "object":
                converted = pd.to_numeric(normalized[col], errors="coerce")
                non_null_count = normalized[col].notna().sum()
                converted_non_null_count = converted.notna().sum()
                if non_null_count > 0 and non_null_count == converted_non_null_count:
                    normalized[col] = converted
        return normalized

    # Step 3: Retrieve result and train data
    result = file.get("result")
    if not isinstance(result, dict):
        logger.error("'result' should be a dictionary of feature values.")
        return JsonResponse(
            {"error": "'result' should be a dictionary of feature values."},
            status=status.HTTP_400_BAD_REQUEST
        )

    train_data_list = file.get('train')
    if not isinstance(train_data_list, list) or not train_data_list:
        logger.error("Invalid or empty 'train' data.")
        return JsonResponse({"error": "Invalid or empty 'train' data."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        train_data = pd.DataFrame(train_data_list)
        train_data = _coerce_numeric_like_columns(train_data)
        logger.info(f"train_data created with shape: {train_data.shape}")
        logger.info(f"train_data columns: {train_data.columns.tolist()}")
    except Exception as e:
        logger.error(f"Failed to create DataFrame from 'train' data: {e}")
        return JsonResponse({"error": "Failed to process 'train' data."}, status=status.HTTP_400_BAD_REQUEST)

    target_var_original = file.get('target_var')
    if not target_var_original:
        logger.error("No target_var provided in the request.")
        return JsonResponse(
            {"error": "No target_var provided in the request."},
            status=status.HTTP_400_BAD_REQUEST
        )
    target_var = target_var_original.strip()
    logger.info(f"Target variable: {target_var}")

    # Step 4: Define feature columns.
    # Prefer model feature names (exact training-time schema) to avoid mismatch errors.
    model_feature_names = getattr(model, "feature_names_in_", None)
    if model_feature_names is not None and len(model_feature_names) > 0:
        col_names_all = [str(col).strip() for col in model_feature_names]
        logger.info(f"Using model.feature_names_in_ for prediction columns: {col_names_all}")
    else:
        # Fallback for models without feature_names_in_
        exclude_columns = []
        col_names_all = [col.strip() for col in train_data.columns if
                         col != target_var and col not in exclude_columns]
        logger.info(f"Using train-data derived prediction columns: {col_names_all}")

    # Step 5: Prepare input features
    X_input = []
    missing_features = []
    for col in col_names_all:
        if col in result:
            X_input.append(result[col])
        elif col == 'Id' and 'Id' in train_data.columns and not train_data['Id'].isna().all():
            # Backward compatibility for older models trained with Id.
            # If UI does not provide Id, use median Id from training data.
            id_fill = train_data['Id'].median()
            X_input.append(id_fill)
            logger.warning(f"Missing feature 'Id' in request; using training median Id={id_fill}.")
        else:
            logger.error(f"Missing required feature: {col}")
            return JsonResponse(
                {"error": f"Missing required feature: {col}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Convert X_input to appropriate data types based on training data
    for idx, col in enumerate(col_names_all):
        try:
            if pd.api.types.is_integer_dtype(train_data[col]):
                X_input[idx] = int(X_input[idx])
            elif pd.api.types.is_float_dtype(train_data[col]):
                X_input[idx] = float(X_input[idx])
            elif pd.api.types.is_object_dtype(train_data[col]):
                X_input[idx] = str(X_input[idx])
            else:
                logger.warning(f"Unhandled data type for feature '{col}'.")
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid value for feature '{col}': {X_input[idx]} ({e})")
            return JsonResponse(
                {"error": f"Invalid value for feature '{col}': {X_input[idx]}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    logger.info(f"Prepared input features: {X_input}")

    # Step 6: Make prediction
    try:
        # Ensure that X_input is a DataFrame with correct columns
        X_input_df = pd.DataFrame([X_input], columns=col_names_all)

        # Align categorical feature encoding with training-time category space.
        for col in col_names_all:
            if col in train_data.columns and (
                pd.api.types.is_object_dtype(train_data[col]) or
                pd.api.types.is_categorical_dtype(train_data[col]) or
                pd.api.types.is_bool_dtype(train_data[col])
            ):
                categories = pd.Index(train_data[col].astype(str).fillna("__missing__").unique())
                input_value = str(X_input_df.at[0, col]) if pd.notna(X_input_df.at[0, col]) else "__missing__"
                X_input_df[col] = pd.Categorical([input_value], categories=categories).codes

        prediction = model.predict(X_input_df)
        logger.info(f"Prediction made successfully: {prediction[0]}")
    except Exception as e:
        logger.error(f"Model prediction failed: {e}")
        return JsonResponse(
            {"error": f"Model prediction failed: {e}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Step 7: Return the prediction
    obj = {
        'pred': prediction[0],
    }
    return JsonResponse(obj, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def deploy_batch(request):
    """
    Enqueue a batch prediction job and return a task_id immediately.
    The client polls deploy_batch_status/<task_id>/ for progress and results.

    Accepts: model_deploy (base64), train (list[dict]), target_var (str), batch_data (list[dict])
    Returns: { task_id: str }
    """
    logger.info("=== deploy_batch called ===")

    payload = request.data

    required_keys = ['model_deploy', 'train', 'target_var', 'batch_data']
    for key in required_keys:
        if key not in payload:
            return JsonResponse({"error": f"Missing required key: {key}"}, status=status.HTTP_400_BAD_REQUEST)

    if not isinstance(payload['batch_data'], list) or len(payload['batch_data']) == 0:
        return JsonResponse({"error": "batch_data must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)

    task = run_batch_prediction.delay(dict(payload))
    logger.info(f"Enqueued batch prediction task: {task.id}")
    return JsonResponse({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
@permission_classes([AllowAny])
def deploy_batch_status(request, task_id):
    """
    Poll the status of a batch prediction task.

    States:
      PENDING   – queued, not started yet
      PROGRESS  – { processed: int, total: int }
      SUCCESS   – full result payload
      FAILURE   – { error: str }
    """
    result = AsyncResult(task_id)

    if result.state == 'PENDING':
        return JsonResponse({"status": "PENDING"}, status=status.HTTP_200_OK)

    if result.state == 'PROGRESS':
        return JsonResponse({"status": "PROGRESS", **result.info}, status=status.HTTP_200_OK)

    if result.state == 'SUCCESS':
        data = result.get()
        if "error" in data:
            return JsonResponse({"status": "FAILURE", "error": data["error"]}, status=status.HTTP_200_OK)
        return JsonResponse({"status": "SUCCESS", **data}, status=status.HTTP_200_OK)

    if result.state == 'REVOKED':
        return JsonResponse({"status": "CANCELLED"}, status=status.HTTP_200_OK)

    # FAILURE or any other terminal state
    return JsonResponse(
        {"status": "FAILURE", "error": str(result.info)},
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def deploy_batch_cancel(request, task_id):
    """
    Cancel a queued/running batch prediction task.
    """
    result = AsyncResult(task_id)

    if result.state in {'SUCCESS', 'FAILURE', 'REVOKED'}:
        return JsonResponse(
            {"status": result.state, "message": "Task is already in a terminal state."},
            status=status.HTTP_200_OK,
        )

    result.revoke(terminate=True)
    return JsonResponse({"status": "CANCELLED"}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def Time_series(request):
    data = dict(request.data) if hasattr(request, 'data') else json.loads(request.body)
    response = time_series(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Time_series_analysis(request):
    data = dict(request.data) if hasattr(request, 'data') else json.loads(request.body)
    response = time_series_analysis(data)
    return response
@api_view(['POST'])
@permission_classes([AllowAny])
def Reverse_ml(request):
    data = dict(request.data) if hasattr(request, 'data') else json.loads(request.body)
    response = reverse_ml(data)
    return response



def custom(data, var, params):
    idx_start = int(params.get("idx_start", 0))
    idx_end = int(params.get("idx_end", data.shape[0]))
    is_filter = params.get("is_filter", False)
    if is_filter:
        filtered_data = filter_data(data, params, var)
        data_slice = filtered_data.loc[idx_start:idx_end, var]
    else:
        data_slice = data.loc[idx_start:idx_end, var]

    return data_slice.to_dict(orient="records")

def filter_data(data, params, display_var):
    filter_var = params.get("filter_var", "")
    filter_operator = params.get("filter_cond", "")
    filter_value = params.get("filter_value", "")

    filtered_data = filter_result(data, filter_var, filter_operator, filter_value)
    result = filtered_data[display_var]

    return result

def filter_result(data, filter_var, filter_operator, filter_value):
    if filter_operator == "<":
        result = data.loc[data[filter_var] < filter_value]
    elif filter_operator == ">":
        result = data.loc[data[filter_var] > filter_value]
    elif filter_operator == "==":
        if type(filter_value) != str:  # np.isna() cannot pass str as parameter
            if np.isnan(filter_value):  # check if value is nan
                result = data.loc[data[filter_var].isna() == True]
            else:
                result = data.loc[data[filter_var] == filter_value]
        else:
            result = data.loc[data[filter_var] == filter_value]
    elif filter_operator == "<=":
        result = data.loc[data[filter_var] <= filter_value]
    elif filter_operator == ">=":
        result = data.loc[data[filter_var] >= filter_value]
    else:
        if type(filter_value) != str:  # np.isna() cannot pass str as parameter
            if np.isnan(filter_value):  # check if value is nan
                result = data.loc[data[filter_var].isna() == False]
            else:
                result = data.loc[data[filter_var] == filter_value]
        else:
            result = data.loc[data[filter_var] != filter_value]

    return result


from .utils import objective_function  # Import the objective function
from pyswarm import pso


class PsoOptimizeModel(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        X_train_scaled = data['X_train_scaled']  # Assume these come pre-scaled and as lists
        y_train = data['y_train']
        X_test_scaled = data['X_test_scaled']
        y_test = data['y_test']
        model_type = data['model_type']
        lb = [data['lb']]
        ub = [data['ub']]

        swarmsize = data.get('swarmsize', 50)
        maxiter = data.get('maxiter', 100)
        omega = data.get('omega', 0.5)
        phip = data.get('phip', 0.5)
        phig = data.get('phig', 0.5)
        minstep = data.get('minstep', 1e-8)
        minfunc = data.get('minfunc', 1e-8)
        debug = data.get('debug', True)

        best_params, best_mse = pso(
            objective_function,
            lb, ub,
            args=(model_type, X_train_scaled, y_train, X_test_scaled, y_test, debug),
            swarmsize=swarmsize,
            maxiter=maxiter,
            minstep=minstep,
            minfunc=minfunc,
            omega=omega,
            phip=phip,
            phig=phig
        )

        # Re-run model with best params for additional metrics
        final_metrics = objective_function(best_params, model_type, X_train_scaled, y_train, X_test_scaled, y_test,
                                           debug=False)
        final_mse, final_rmse, final_r_squared = final_metrics

        return Response({
            'best_params': best_params,
            'MSE': best_mse,
            'RMSE': final_rmse,
            'R²': final_r_squared
        }, status=status.HTTP_200_OK)