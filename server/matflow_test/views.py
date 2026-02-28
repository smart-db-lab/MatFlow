import base64
import io
import json
import logging

import pandas as pd
import numpy as np
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()
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
from .Matflow_Main.modules.regressor import linear_regression, ridge_regression, lasso_regression, \
    decision_tree_regression, random_forest_regression, svr
from .Matflow_Main.modules.utils import split_xy
from .Matflow_Main.subpage.Reverse_ML import reverse_ml
from .Matflow_Main.subpage.temp import temp
from .Matflow_Main.subpage.time_series import  time_series
from .Matflow_Main.subpage.time_series_analysis import  time_series_analysis
import joblib


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    import random, string

    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create user with custom model fields
    user = User(
        email=email,
        username=username or '',
        full_name=username or '',
        is_active=True,
        is_email_verified=False,
    )
    user.set_password(password)

    # Generate a 6-digit verification code and store it
    code = ''.join(random.choices(string.digits, k=6))
    user.verification_token = code
    user.save()

    # Print the verification code to the server terminal
    print("\n" + "=" * 50)
    print(f"  VERIFICATION CODE for {email}")
    print(f"  Code: {code}")
    print("=" * 50 + "\n")

    return Response({
        'message': 'Account created! Please verify your email with the code sent to the server.',
        'email': email,
        'requires_verification': True,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_code(request):
    email = request.data.get('email')
    code = request.data.get('code')

    if not email or not code:
        return Response({'error': 'Email and verification code are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if user.is_email_verified:
        return Response({'message': 'Email is already verified.'}, status=status.HTTP_200_OK)

    if user.verification_token == code:
        user.is_email_verified = True
        user.verification_token = ''
        user.save()
        return Response({'message': 'Email verified successfully! You can now log in.'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
    except:
        return Response({'error': 'Please provide both username and password.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)

    if not user:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    # Log in the user
    login(request, user)

    return Response({'message': 'User logged in successfully.'}, status=status.HTTP_200_OK)
# @api_view(['GET', 'POST'])
# def test_page(request):
#     return HttpResponse("hello")
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def display_group(request):
    data = json.loads(request.body)
    file = data.get('file')
    # file=pd.read_csv(file)
    file = pd.DataFrame(file)
    group_var = data.get("group_var")
    agg_func = data.get("agg_func")
    numeric_columns = file.select_dtypes(include='number').columns
    data = file.groupby(by=group_var, as_index=False).agg(agg_func)
    data = data.to_json(orient='records')
    return JsonResponse({'data': data})
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def display_correlation(request):
    data = json.loads(request.body)
    file = data.get('file')
    file = pd.DataFrame(file)
    correlation_method="kendall"
    file = file.select_dtypes(include='number')
    correlation_data =file.corr(correlation_method)
    data = correlation_data.to_json(orient='records')
    return JsonResponse({'data': data})
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def display_correlation_featurePair(request):
    data = json.loads(request.body)
    correlation_data =pd.DataFrame(data.get('file'))
    bg_gradient= data.get('gradient')
    feature1 = data.get('feature1')
    feature2 = data.get('feature2')
    drop = data.get('drop')
    absol = data.get('absol')
    high = data.get('high')
    df=display_pair(correlation_data,bg_gradient,feature1,feature2,high,drop,absol)
    data = df.to_json(orient='records')
    return JsonResponse({'data': data})
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def display_correlation_heatmap(request):
    data = json.loads(request.body)
    correlation_data =pd.DataFrame(data.get('file'))
    response= display_heatmap(correlation_data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def feature_creation(request):
    data=json.loads(request.body)
    response = creation(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def changeDtype(request):
    data=json.loads(request.body)
    response = Change_dtype(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Alter_field(request):
    data=json.loads(request.body)
    response = change_field_name(data)
    return response
from numpyencoder import NumpyEncoder
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def feature_selection_api(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        dataset = pd.DataFrame(data.get('dataset')).reset_index(drop=True)
        # table_name = data['table_name']
        target_var = data.get('target_var')
        method = data.get('method')
        selected_features_df = feature_selection.feature_selection(data,dataset, target_var, method)
        response_data = {
            'selected_features': selected_features_df
        }
        # return JsonResponse(response_data)
        return JsonResponse(response_data, encoder=NumpyEncoder)
    else:
        return JsonResponse({'error': 'Invalid request method'})

@api_view(['GET','POST'])
@permission_classes([AllowAny])
def imputation_data1(request):
    file=json.loads(request.body)
    data=pd.DataFrame(file.get('file'))
    # num_var = utils.get_numerical(data)
    null_var = utils.get_null(data)
    low_cardinality = utils.get_low_cardinality(data, add_hyphen=True)
    response = {
        'null_var' : null_var,
        'group_by': low_cardinality
    }
    return JsonResponse(response, safe=False)

@api_view(['GET','POST'])
@permission_classes([AllowAny])
def imputation_data2(request):
    file=json.loads(request.body)
    data=pd.DataFrame(file.get('file'))
    var=file.get('Select_columns')
    num_var = utils.get_numerical(data)
    category=''
    mode=None
    max_val=None
    if var in num_var:
        category='numerical'
        max_val = abs(data[var]).max()
    else:
        category= 'categorical'
        mode = data[var].mode().to_dict()
    null_var = utils.get_null(data)
    low_cardinality = utils.get_low_cardinality(data, add_hyphen=True)
    response = {
        'null_var': null_var,
        'group_by': low_cardinality,
        'max_val': max_val,
        'mode' : mode,
        'category': category
    }
    return JsonResponse(response, safe=False)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def imputation_result(request):
    file = json.loads(request.body)
    data=pd.DataFrame(file.get('file'))
    strat,fill_group ,constant=None, None,0
    strat=file.get('strategy')
    fill_group=file.get('fill_group')
    var=file.get("Select_columns")
    constant=file.get('constant')
    print(f"{strat} {fill_group} {var} {constant}")
    fill_group = None if (fill_group == "-") else fill_group
    # print(f"{fill_group}")
    imp = imputer.Imputer(strategy=strat, columns=[var], fill_value=constant, group_col=fill_group)
    new_value = imp.fit_transform(data)
    new_value=new_value.reset_index()
    new_value=new_value.to_dict(orient='records')

    response = {
        "dataset": new_value
    }
    return JsonResponse(response, safe=False)

@api_view(['GET','POST'])
@permission_classes([AllowAny])
def merge_dataset(request):
    data=json.loads(request.body)
    response = merge_df(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Encoding(request):
    data=json.loads(request.body)
    response = encoding(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Scaling(request):
    data=json.loads(request.body)
    response = scaling(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Drop_column(request):
    data=json.loads(request.body)
    response = drop_column(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Drop_row(request):
    data=json.loads(request.body)
    response = drop_row(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Append(request):
    data=json.loads(request.body)
    response = append(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Cluster(request):
    data=json.loads(request.body)
    response = cluster_dataset(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Split(request):
    data=json.loads(request.body)
    response = split_dataset(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Hyper_opti(request):
    data=json.loads(request.body)
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
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Build_model(request):
    data=json.loads(request.body)
    type=data.get("type")
    if(type== "classifier"):
        response = classification(data)
    else:
        response = regression(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def model_evaluation(request):
    data=json.loads(request.body)
    response = model_report(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def model_prediction(request):
    data=json.loads(request.body)
    type=data.get("type")
    if(type=="regressor"):
        response=prediction_regression(data)
    else:
        response = prediction_classification(data)
    return response
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
        file = request.data
        logger.info("Parsed JSON data successfully.")
    except Exception as e:
        logger.error(f"JSON decoding failed: {e}")
        return JsonResponse({"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST)

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
        file = request.data
        logger.info("Parsed JSON data successfully.")
    except Exception as e:
        logger.error(f"JSON decoding failed: {e}")
        return JsonResponse({"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST)

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


@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Time_series(request):
    data=json.loads(request.body)
    response = time_series(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Time_series_analysis(request):
    data=json.loads(request.body)
    response = time_series_analysis(data)
    return response
@api_view(['GET','POST'])
@permission_classes([AllowAny])
def Reverse_ml(request):
    data=json.loads(request.body)
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