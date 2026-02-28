import base64
import io
import traceback

import pandas as pd
from django.http import JsonResponse

from Matflow.debug_utilities import debug_function, debug, info, error
from sklearn.preprocessing import label_binarize

from ...modules.utils import split_xy
from ...modules.classifier import knn, svm, log_reg, decision_tree, random_forest, perceptron
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import json
import joblib
import numpy as np


@debug_function
def classification(file):
    info(f"Classification function called with keys: {file.keys()}")

    try:
        data = pd.DataFrame(file.get("file"))
        debug(f"Main data shape: {data.shape}")

        train_data = pd.DataFrame(file.get("train"))
        debug(f"Train data shape: {train_data.shape}")

        test_data = pd.DataFrame(file.get("test"))
        debug(f"Test data shape: {test_data.shape}")

        target_var = file.get("target_var")
        debug(f"Target variable: {target_var}")

        classifier = file.get("classifier")
        info(f"Selected classifier: {classifier}")

        # Split data
        info("Splitting data into features and target")
        X_train, y_train = split_xy(train_data, target_var)
        X_test, y_test = split_xy(test_data, target_var)

        debug(f"X_train shape: {X_train.shape}, y_train shape: {y_train.shape}")
        debug(f"X_test shape: {X_test.shape}, y_test shape: {y_test.shape}")

        try:
            debug("Attempting to drop target variable from feature sets")
            X_train, X_test = X_train.drop(target_var, axis=1), X_test.drop(target_var, axis=1)
            debug(f"After dropping target: X_train shape: {X_train.shape}, X_test shape: {X_test.shape}")
        except Exception as e:
            debug(f"Failed to drop target variable: {str(e)}")
            pass

        # Initialize model based on classifier
        info(f"Initializing {classifier} model")
        if classifier == "K-Nearest Neighbors":
            model = knn.knn(X_train, y_train, file)
        elif classifier == "Support Vector Machine":
            model = svm.svm(X_train, y_train, file)
        elif classifier == "Logistic Regression":
            model = log_reg.log_reg(X_train, y_train, file)
        elif classifier == "Decision Tree Classification":
            model = decision_tree.decision_tree(X_train, y_train, file)
        elif classifier == "Random Forest Classification":
            model = random_forest.random_forest(X_train, y_train, file)
        elif classifier == "Multilayer Perceptron":
            model = perceptron.perceptron(X_train, y_train, file)
        else:
            error(f"Unknown classifier: {classifier}")
            return JsonResponse({"error": f"Unknown classifier: {classifier}"}, status=400)

        debug("Model initialized successfully")

        # Determine multiclass average setting
        target_nunique = y_train.nunique()
        debug(f"Target has {target_nunique} unique values")

        if target_nunique > 2:
            multi_average = file.get("Multiclass Average")
            info(f"Multiclass averaging method: {multi_average}")
        else:
            multi_average = "binary"
            info("Using binary averaging for metrics")

        # Fit the model
        info("Fitting model to training data")
        model.fit(X_train, y_train)
        debug("Model fitting completed")

        # Get predictions on full dataset
        X, y = split_xy(data, target_var)
        try:
            X = X.drop(target_var, axis=1)
        except:
            pass

        info("Making predictions on full dataset")
        y_prediction = model.predict(X)
        debug(f"Predictions shape: {y_prediction.shape}")

        # Calculate metrics
        metrics = ["Accuracy", "Precision", "Recall", "F1-Score"]
        info("Calculating metrics on test data")
        selected_metrics = get_result(model, X_test, y_test, metrics, multi_average)
        debug(f"Test metrics: {selected_metrics}")

        # Calculate metrics for both train and test sets
        info("Calculating metrics for both train and test sets")
        i = 0
        for X_set, y_set, dataset_name in zip([X_train, X_test], [y_train, y_test], ["Train", "Test"]):
            debug(f"Calculating metrics for {dataset_name} set")
            metrics_result = get_result(model, X_set, y_set, metrics, multi_average)
            debug(f"{dataset_name} metrics: {metrics_result}")

            if i == 0:
                list1 = metrics_result
            else:
                list2 = metrics_result
            i += 1

        # Merge metrics
        info("Merging train and test metrics")
        merged_list = {
            f"Train {key}": value
            for key, value in list1.items()
        }

        merged_list.update({
            f"Test {key}": value
            for key, value in list2.items()
        })

        # Convert predictions to JSON
        debug("Converting predictions to JSON")
        y_prediction = json.dumps(y_prediction.tolist())

        # Serialize model
        info("Serializing model")
        buffer = io.BytesIO()
        joblib.dump(model, buffer)
        buffer.seek(0)
        model_bytes = buffer.read()
        buffer.close()

        # Encode the model
        model_encoded = base64.b64encode(model_bytes).decode('utf-8')
        debug(f"Model encoded successfully, size: {len(model_encoded)} characters")

        # Prepare response
        info("Preparing response object")
        obj = {
            "metrics": selected_metrics,
            "metrics_table": merged_list,
            "y_pred": y_prediction,
            "model_deploy": model_encoded
        }

        debug("Classification function completed successfully")
        return JsonResponse(obj)

    except Exception as e:
        error(f"Error in classification function: {str(e)}")
        import traceback
        error(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)


@debug_function
def get_result(self, y, y_pred, metrics=None, average=None):
    """
    Calculate classification metrics with proper handling of mixed types and dimensions.
    """
    try:
        # Debug incoming data types and shapes
        debug(f"y type: {type(y)}, shape: {y.shape if hasattr(y, 'shape') else 'no shape'}")
        debug(f"y_pred type: {type(y_pred)}, shape: {y_pred.shape if hasattr(y_pred, 'shape') else 'no shape'}")
        
        # For KNN and other models using whole dataframes as input
        if isinstance(y, pd.DataFrame) and hasattr(y_pred, 'name'):
            debug(f"Extracting target variable {y_pred.name} from DataFrame")
            # In this case, y is the X_test dataframe and y_pred is the actual target Series
            target_name = y_pred.name
            # If target variable is in the dataframe, extract it
            if target_name in y.columns:
                actual_y = y[target_name]
                debug(f"Extracted actual target values shape: {actual_y.shape}")
            else:
                debug("Target variable not found in DataFrame. Using y_pred as both actual and predicted")
                actual_y = y_pred
            predictions = y_pred  # y_pred is already the predictions Series
        else:
            # For normal cases where y is the actual values and y_pred are predictions
            actual_y = y
            predictions = y_pred
            
        # Extract unique values from both series without trying to combine them
        if isinstance(actual_y, pd.Series):
            actual_values = actual_y.unique()
        elif hasattr(actual_y, 'shape') and len(actual_y.shape) > 1:
            actual_values = np.unique(actual_y.flatten())
        else:
            actual_values = np.unique(actual_y)
            
        if isinstance(predictions, pd.Series):
            pred_values = predictions.unique()
        elif hasattr(predictions, 'shape') and len(predictions.shape) > 1:
            pred_values = np.unique(predictions.flatten())
        else:
            pred_values = np.unique(predictions)
            
        # Get unique labels (safely) by checking types
        unique_labels = set()
        for val in actual_values:
            unique_labels.add(val)
        for val in pred_values:
            unique_labels.add(val)
            
        unique_labels = list(unique_labels)
        debug(f"Unique labels in classification: {unique_labels}")

        # Detect string labels
        is_string_label = any(isinstance(label, str) for label in unique_labels)
        debug(f"Using string labels: {is_string_label}")

        # Choose appropriate averaging method
        if average is None:
            average = "binary" if len(unique_labels) == 2 else "macro"

        # If we ended up with "binary" but the labels are strings, switch to
        # "macro" (or you could set a specific pos_label here).
        if average == "binary" and is_string_label:
            debug(
                "Binary task with non-numeric labels detected – "
                "switching average from 'binary' to 'macro'"
            )
            average = "macro"
        # ------------------------------------------------------------------

        debug(f"Using averaging method: {average}")

        # Initialize metrics dictionary
        metric_dict = {}

        # Calculate metrics
        try:
            metric_dict["Accuracy"] = accuracy_score(actual_y, predictions)
            
            if is_string_label or len(unique_labels) > 2:
                # For string labels or multiclass
                metric_dict["Precision"] = precision_score(actual_y, predictions, average=average)
                metric_dict["Recall"] = recall_score(actual_y, predictions, average=average)
                metric_dict["F1 Score"] = f1_score(actual_y, predictions, average=average)
            else:
                # For binary numeric labels
                metric_dict["Precision"] = precision_score(actual_y, predictions)
                metric_dict["Recall"] = recall_score(actual_y, predictions)
                metric_dict["F1 Score"] = f1_score(actual_y, predictions)
        except Exception as metric_error:
            error(f"Error computing specific metric: {str(metric_error)}")
            # Set failed metrics to NaN
            for metric_name in ["Accuracy", "Precision", "Recall", "F1 Score"]:
                if metric_name not in metric_dict:
                    metric_dict[metric_name] = float('nan')
            
        return metric_dict

    except Exception as e:
        error(f"Error calculating metrics: {str(e)}")
        error(traceback.format_exc())
        return {"error": str(e)}