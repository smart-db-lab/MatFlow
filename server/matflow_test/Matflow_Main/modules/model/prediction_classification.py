
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder,label_binarize
from sklearn.multiclass import OneVsRestClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from ...modules import utils
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report,confusion_matrix, roc_curve, precision_recall_curve, auc, average_precision_score
import io
import seaborn as sns
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.io as pio
from django.http import HttpResponse
from django.http import JsonResponse
import base64
import json
from eda.graph.plotly_theme import apply_modern_theme, MODERN_COLORS

# Maximum character length for feature names and labels in graphs
MAX_LABEL_LENGTH = 10

def convert_to_native_python(obj):
    """Recursively convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        val = float(obj)
        # Convert NaN and Infinity to null for JSON compatibility
        if np.isnan(val):
            return None
        elif np.isinf(val):
            return None
        return val
    elif isinstance(obj, float):
        # Handle Python floats too
        if np.isnan(obj):
            return None
        elif np.isinf(obj):
            return None
        return obj
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, dict):
        return {k: convert_to_native_python(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_to_native_python(item) for item in obj]
    return obj

def prediction_classification(file):
    target_var = file.get("Target Variable")
    model_opt = file.get("regressor")
    
    # Get the dataset - now seamlessly injected by _inject_workspace from workspace_id and filename
    data_dict = file.get("file", [])
    
    if not data_dict:
        raise ValueError("Dataset not found. Ensure workspace_id and filename are properly provided.")
        
    data = pd.DataFrame(data_dict)
    X, y_series = utils.split_xy(data, target_var)
    y_pred = file.get("y_pred")
    
    # Parse y_pred if it's a JSON string
    if isinstance(y_pred, str):
        try:
            import json
            y_pred = json.loads(y_pred)
        except:
            pass
    
    # Align lengths defensively to avoid broadcasting errors when upstream
    # provides mismatched arrays (e.g., full y vs. test-set y_pred)
    y_array = np.asarray(y_series).flatten()
    y_pred_array = np.asarray(y_pred).flatten()
    min_len = min(len(y_array), len(y_pred_array))
    if len(y_array) != len(y_pred_array):
        y_array = y_array[:min_len]
        y_pred_array = y_pred_array[:min_len]

    # Use trimmed arrays for downstream metrics
    y = pd.Series(y_array)
    y_pred = pd.Series(y_pred_array)
    result_opt = file.get("Result")
    if y.nunique() > 2:
        return show_result(y, y_pred, result_opt, None, X, model_opt)
    else:
        return show_result(y, y_pred, result_opt, "binary", X, model_opt)

def show_result(y, y_pred, result_opt, multi_average, X, model_name):
    le = LabelEncoder()
    if result_opt in ["Accuracy", "Precision", "Recall", "F1-Score"]:
        # For multiclass, use 'weighted' average to get a single scalar
        avg = multi_average if multi_average else 'weighted'
        metric_dict = {
            "Accuracy": f"{float(accuracy_score(y, y_pred)):.4g}",
            "Precision": f"{float(precision_score(y, y_pred, average=avg)):.4g}",
            "Recall": f"{float(recall_score(y, y_pred, average=avg)):.4g}",
            "F1-Score": f"{float(f1_score(y, y_pred, average=avg)):.4g}"
        }

        result = metric_dict.get(result_opt)
        return JsonResponse(result, safe=False)
    elif result_opt == "Target Value":
        result = X.copy().reset_index(drop=True)
        result["Actual"] = pd.Series(y).reset_index(drop=True)
        result["Predicted"] = pd.Series(y_pred).reset_index(drop=True)
        graph_json = actvspred(y, y_pred,"Actual vs. Predicted")
        result_dict = json.loads(result.to_json(orient="records"))
        obj={
                "table":result_dict,
                "graph":[json.loads(graph_json)]
        }
        return JsonResponse(obj, safe=False)
    elif result_opt == "Classification Report":
        result = classification_report(y, y_pred)
        return JsonResponse(result, safe=False)

    elif result_opt == "Confusion Matrix":
        cm = confusion_matrix(y, y_pred)
        labels = [str(l)[:MAX_LABEL_LENGTH] + ('...' if len(str(l)) > MAX_LABEL_LENGTH else '') for l in np.unique(y_pred)]
        
        # Convert confusion matrix to ECharts heatmap format
        # ECharts expects data as [x, y, value] tuples
        heatmap_data = []
        max_value = int(cm.max().item()) if hasattr(cm.max(), 'item') else int(cm.max())  # Convert numpy type to Python int
        for i, actual_label in enumerate(labels):
            for j, pred_label in enumerate(labels):
                value = int(cm[i, j].item()) if hasattr(cm[i, j], 'item') else int(cm[i, j])  # Ensure native Python int
                heatmap_data.append([j, i, value])
        
        option = {
            "backgroundColor": "#ffffff",
            "title": {
                "text": "Confusion Matrix",
                "left": "center",
                "top": 12,
                "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600}
            },
            "tooltip": {
                "trigger": "item",
                "textStyle": {"color": "#1f2937", "fontSize": 12},
                "backgroundColor": "rgba(255,255,255,0.9)",
                "borderColor": "#e5e7eb"
            },
            "grid": {
                "top": "15%",
                "bottom": "10%",
                "left": "12%",
                "right": "4%",
                "containLabel": True
            },
            "xAxis": {
                "type": "category",
                "name": "Predicted Label",
                "data": labels,
                "position": "bottom",
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"show": False}
            },
            "yAxis": {
                "type": "category",
                "name": "Actual Label",
                "data": list(reversed(labels)),
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"show": False}
            },
            "visualMap": {
                "min": 0,
                "max": max_value,
                "realtime": True,
                "calculable": True,
                "inRange": {
                    # Light teal scale aligned with Matflow design system
                    "color": [
                        "#f8fafc",
                        "#f0fdfa",
                        "#ccfbf1",
                        "#99f6e4",
                        "#5eead4",
                        "#2dd4bf",
                        "#14b8a6",
                    ]
                },
                "textStyle": {"color": "#1f2937"}
            },
            "series": [
                {
                    "name": "Count",
                    "type": "heatmap",
                    "data": heatmap_data,
                    "label": {
                        "show": True,
                        "formatter": "{c}",
                        "color": "#1f2937",
                        "fontSize": 13,
                        "fontWeight": 600
                    },
                    "itemStyle": {
                        "borderWidth": 3,
                        "borderColor": "#f1f5f9"
                    }
                }
            ]
        }
        
        graph_json = [convert_to_native_python(option)]
        return JsonResponse({'graph': graph_json})

    elif result_opt == "Actual vs. Predicted":
        tbl = X.copy().reset_index(drop=True)
        tbl["Actual"] = pd.Series(y).reset_index(drop=True)
        tbl["Predicted"] = pd.Series(y_pred).reset_index(drop=True)
        x_range = np.arange(len(y))

        # Use categorical-safe encoding for charting (works for string labels like Iris-setosa)
        chart_encoder = LabelEncoder()
        combined_labels = pd.concat(
            [pd.Series(y).astype(str), pd.Series(y_pred).astype(str)],
            ignore_index=True,
        )
        chart_encoder.fit(combined_labels)
        # Truncate class labels to MAX_LABEL_LENGTH characters for readability
        class_labels = [str(c)[:MAX_LABEL_LENGTH] + ('...' if len(str(c)) > MAX_LABEL_LENGTH else '') for c in chart_encoder.classes_]
        y_chart = chart_encoder.transform(pd.Series(y).astype(str))
        y_pred_chart = chart_encoder.transform(pd.Series(y_pred).astype(str))

        # Keep x numeric and y as category labels for readable axis labels
        actual_data = [
            [int(i), class_labels[int(v)]]
            for i, v in zip(x_range, y_chart)
        ]
        predicted_data = [
            [int(i), class_labels[int(v)]]
            for i, v in zip(x_range, y_pred_chart)
        ]

        option = {
            "backgroundColor": "#ffffff",
            "title": {
                "text": "Actual vs. Predicted Values",
                "left": "center",
                "top": 12,
                "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600}
            },
            "tooltip": {
                "trigger": "axis",
                "axisPointer": {"type": "cross"},
                "textStyle": {"color": "#1f2937", "fontSize": 12},
                "backgroundColor": "rgba(255,255,255,0.9)",
                "borderColor": "#e5e7eb"
            },
            "grid": {
                "top": "15%",
                "bottom": "12%",
                "left": "8%",
                "right": "4%",
                "containLabel": True
            },
            "xAxis": {
                "type": "value",
                "name": "Sample Index",
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "yAxis": {
                "type": "category",
                "name": "Class Label",
                "data": class_labels,
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "legend": {
                "orient": "horizontal",
                "bottom": "0%",
                "left": "center",
                "textStyle": {"color": "#374151", "fontSize": 12}
            },
            "series": [
                {
                    "name": "Actual",
                    "type": "line",
                    "data": actual_data,
                    "smooth": 0.3,
                    "symbol": "circle",
                    "symbolSize": 5,
                    "lineStyle": {"width": 2.5, "color": "#ff6384"},
                    "itemStyle": {"color": "#ff6384", "borderColor": "#ffffff", "borderWidth": 1},
                    "areaStyle": {"color": "rgba(255, 99, 132, 0.08)"}
                },
                {
                    "name": "Predicted",
                    "type": "line",
                    "data": predicted_data,
                    "smooth": 0.3,
                    "symbol": "circle",
                    "symbolSize": 5,
                    "lineStyle": {"width": 2.5, "color": "#36a2eb", "type": "dashed"},
                    "itemStyle": {"color": "#36a2eb", "borderColor": "#ffffff", "borderWidth": 1},
                    "areaStyle": {"color": "rgba(54, 162, 235, 0.08)"}
                }
            ]
        }
        return JsonResponse({'table': json.loads(tbl.to_json(orient='records')), 'graph': [option]})

    elif result_opt == "Precision-Recall Curve":
        # Build robust label space from both actual and predicted labels
        y_str = pd.Series(y).astype(str)
        y_pred_str = pd.Series(y_pred).astype(str)
        label_encoder = LabelEncoder()
        label_encoder.fit(pd.concat([y_str, y_pred_str], ignore_index=True))
        labels = [str(l)[:MAX_LABEL_LENGTH] + ('...' if len(str(l)) > MAX_LABEL_LENGTH else '') for l in label_encoder.classes_]
        y_encoded = label_encoder.transform(y_str)
        y_pred_encoded = label_encoder.transform(y_pred_str)

        if len(labels) < 2:
            return JsonResponse({'error': 'Precision-Recall curve requires at least two classes.'})

        # One-vs-rest PR curves (supports both binary and multiclass)
        y_true_bin = label_binarize(y_encoded, classes=np.arange(len(labels)))
        y_pred_bin = label_binarize(y_pred_encoded, classes=np.arange(len(labels)))
        if y_true_bin.ndim == 1:
            y_true_bin = y_true_bin.reshape(-1, 1)
            y_pred_bin = y_pred_bin.reshape(-1, 1)

        series = []
        ap_scores = []
        colors = ["#0D9488", "#2dd4bf", "#0F766E", "#5EEAD4", "#14b8a6", "#99f6e4"]
        for idx, cls_label in enumerate(labels):
            # Skip classes that are absent in ground truth in this slice
            if np.unique(y_true_bin[:, idx]).size < 2:
                continue
            precision, recall, _ = precision_recall_curve(
                y_true_bin[:, idx], y_pred_bin[:, idx]
            )
            ap = average_precision_score(y_true_bin[:, idx], y_pred_bin[:, idx])
            ap_scores.append(float(ap))
            curve_data = [[float(r), float(p)] for r, p in zip(recall, precision)]
            color = colors[idx % len(colors)]
            series.append({
                "name": f"{cls_label} (AP={ap:.4g})",
                "type": "line",
                "data": curve_data,
                "smooth": True,
                "lineStyle": {"color": color, "width": 2.3},
                "itemStyle": {"color": color},
                "areaStyle": {"color": "rgba(13, 148, 136, 0.08)"},
            })

        if not series:
            return JsonResponse({'error': 'Unable to compute Precision-Recall curve for the selected data.'})

        macro_ap = float(np.mean(ap_scores)) if ap_scores else 0.0
        option = {
            "backgroundColor": "#ffffff",
            "title": {
                "text": f"Precision-Recall Curve (mAP={macro_ap:.3f})",
                "left": "center",
                "top": 12,
                "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600}
            },
            "tooltip": {
                "trigger": "axis",
                "textStyle": {"color": "#1f2937", "fontSize": 12},
                "backgroundColor": "rgba(255,255,255,0.9)",
                "borderColor": "#e5e7eb"
            },
            "grid": {
                "top": "15%",
                "bottom": "12%",
                "left": "8%",
                "right": "4%",
                "containLabel": True
            },
            "xAxis": {
                "type": "value",
                "name": "Recall",
                "min": 0,
                "max": 1.02,
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "yAxis": {
                "type": "value",
                "name": "Precision",
                "min": 0,
                "max": 1.05,
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "legend": {
                "orient": "horizontal",
                "bottom": "0%",
                "left": "center",
                "textStyle": {"color": "#374151", "fontSize": 11}
            },
            "series": series,
        }
        return JsonResponse({'graph': [convert_to_native_python(option)]})

    elif result_opt == "ROC Curve":
        # Determine number of unique classes in actual values
        n_unique_classes = y.nunique()
        
        if n_unique_classes > 2:
            # Multiclass ROC Curve (One-vs-Rest)
            label_encoder = LabelEncoder()
            label_encoder.fit(y)
            y_enc = label_encoder.transform(y)
            classes = label_encoder.classes_
            X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2)
            min_max_scaler = MinMaxScaler()
            X_train_norm = min_max_scaler.fit_transform(X_train)
            X_test_norm = min_max_scaler.transform(X_test)
            if model_name == "Random Forest Classification":
                RF = OneVsRestClassifier(RandomForestClassifier(max_features=0.2))
                RF.fit(X_train_norm, y_train)
                y_pred = RF.predict(X_test_norm)
                pred_prob = RF.predict_proba(X_test_norm)
            elif model_name == "Multilayer Perceptron":
                mlp = MLPClassifier(hidden_layer_sizes=(100, 50))
                mlp.fit(X_train_norm, y_train)
                y_pred = mlp.predict(X_test_norm)
                pred_prob = mlp.predict_proba(X_test_norm)
            elif model_name == "K-Nearest Neighbors":
                k = 5
                knn = KNeighborsClassifier(n_neighbors=k)
                knn.fit(X_train_norm, y_train)
                y_pred = knn.predict(X_test_norm)
                pred_prob = knn.predict_proba(X_test_norm)
            elif model_name == "Support Vector Machine":
                svm = OneVsRestClassifier(SVC(kernel='linear', probability=True))
                svm.fit(X_train_norm, y_train)
                y_pred = svm.predict(X_test_norm)
                pred_prob = svm.predict_proba(X_test_norm)
            elif model_name == "Logistic Regression":
                lr = OneVsRestClassifier(LogisticRegression(solver='lbfgs'))
                lr.fit(X_train_norm, y_train)
                y_pred = lr.predict(X_test_norm)
                pred_prob = lr.predict_proba(X_test_norm)
            elif model_name == "Decision Tree Classification":
                dt = OneVsRestClassifier(DecisionTreeClassifier())
                dt.fit(X_train_norm, y_train)
                y_pred = dt.predict(X_test_norm)
                pred_prob = dt.predict_proba(X_test_norm)
            else:
               raise ValueError("Invalid model name specified.")
            # Use all known classes from label_encoder, not just classes in y_test
            # This handles cases where test set might not have all 3 classes represented
            y_test_binarized = label_binarize(y_test, classes=np.arange(len(classes)))
            fpr = {}
            tpr = {}
            roc_auc = dict()
            n_class = classes.shape[0]
            # Ensure we don't access indices beyond what pred_prob has
            n_pred_classes = pred_prob.shape[1]
            n_class_to_process = min(n_class, n_pred_classes)
            for i in range(n_class_to_process):
                fpr[i], tpr[i], _ = roc_curve(y_test_binarized[:, i], pred_prob[:, i])
                roc_auc[i] = auc(fpr[i], tpr[i])
            
            series_data = []
            colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40', '#c9cbcf', '#7dd3fc', '#f0abfc', '#6ee7b7']
            
            for i in range(n_class_to_process):
                curve_data = [[float(f), float(t)] for f, t in zip(fpr[i], tpr[i])]  # Ensure native Python float
                roc_auc_val = float(roc_auc[i]) if hasattr(roc_auc[i], '__float__') else roc_auc[i]  # Convert to native float
                # Handle NaN in AUC
                if np.isnan(roc_auc_val):
                    auc_str = "nan"
                else:
                    auc_str = f"{roc_auc_val:.3f}"
                # Truncate class name to MAX_LABEL_LENGTH
                class_name = str(classes[i])[:MAX_LABEL_LENGTH] + ('...' if len(str(classes[i])) > MAX_LABEL_LENGTH else '')
                series_data.append({
                    "name": f"{class_name} vs Rest (AUC={auc_str})",
                    "type": "line",
                    "data": curve_data,
                    "smooth": True,
                    "lineStyle": {"color": colors[i % len(colors)], "width": 2.5},
                    "itemStyle": {"color": colors[i % len(colors)]}
                })
            
            # Add diagonal baseline
            series_data.append({
                "name": "Random Classifier",
                "type": "line",
                "data": [[0, 0], [1, 1]],
                "lineStyle": {"color": "rgba(0,0,0,0.3)", "type": "dashed", "width": 1.5},
                "itemStyle": {"color": "rgba(0,0,0,0.3)"}
            })
            
            option = {
                "responsive": True,
                "backgroundColor": "#ffffff",
                "title": {
                    "text": "Multiclass ROC Curve",
                    "left": "center",
                    "top": 12,
                    "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600}
                },
                "tooltip": {
                    "trigger": "axis",
                    "textStyle": {"color": "#1f2937", "fontSize": 12},
                    "backgroundColor": "rgba(255,255,255,0.9)",
                    "borderColor": "#e5e7eb"
                },
                "grid": {
                    "top": "15%",
                    "bottom": "12%",
                    "left": "8%",
                    "right": "4%",
                    "containLabel": True
                },
                "xAxis": {
                    "type": "value",
                    "name": "False Positive Rate",
                    "min": 0,
                    "max": 1.02,
                    "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                    "axisLabel": {"color": "#1f2937", "fontSize": 11},
                    "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
                },
                "yAxis": {
                    "type": "value",
                    "name": "True Positive Rate",
                    "min": 0,
                    "max": 1.05,
                    "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                    "axisLabel": {"color": "#1f2937", "fontSize": 11},
                    "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
                },
                "legend": {
                    "orient": "vertical",
                    "right": "2%",
                    "top": "15%",
                    "textStyle": {"color": "#374151", "fontSize": 11}
                },
                "series": series_data
            }
            return JsonResponse({'graph': [convert_to_native_python(option)]})
        else:
            # Create label encoder that knows all unique labels in y and y_pred
            all_labels = np.unique(np.concatenate([y.values if hasattr(y, 'values') else y, 
                                                   y_pred.values if hasattr(y_pred, 'values') else y_pred]))
            le_roc = LabelEncoder()
            le_roc.fit(all_labels)
            y_encoded = le_roc.transform(y)
            y_pred_encoded = le_roc.transform(y_pred)
            
            # Check if ROC curve is possible (need at least 2 classes)
            if len(np.unique(y_encoded)) < 2 or len(np.unique(y_pred_encoded)) < 2:
                # Return empty graph with message
                option = {
                    "responsive": True,
                    "backgroundColor": "#ffffff",
                    "title": {
                        "text": "ROC Curve - Insufficient Classes",
                        "left": "center",
                        "top": 12,
                        "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600},
                        "subtext": "ROC curve requires at least 2 classes in both actual and predicted values",
                        "subtextStyle": {"color": "#dc2626", "fontSize": 12}
                    },
                    "tooltip": {"show": False},
                    "grid": {"show": False},
                    "xAxis": {"show": False},
                    "yAxis": {"show": False},
                    "series": []
                }
                return JsonResponse({'graph': [convert_to_native_python(option)]})
            
            # For binary classification, roc_curve expects 0/1 or probabilities
            fpr, tpr, _ = roc_curve(y_encoded, y_pred_encoded)
            roc_auc_val = auc(fpr, tpr)
            
            # Check if AUC is NaN (can happen if predictions are identical)
            if np.isnan(roc_auc_val):
                option = {
                    "responsive": True,
                    "backgroundColor": "#ffffff",
                    "title": {
                        "text": "ROC Curve - Unable to Calculate",
                        "left": "center",
                        "top": 12,
                        "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600},
                        "subtext": "Cannot calculate ROC curve - all predictions may be the same class",
                        "subtextStyle": {"color": "#dc2626", "fontSize": 12}
                    },
                    "tooltip": {"show": False},
                    "grid": {"show": False},
                    "xAxis": {"show": False},
                    "yAxis": {"show": False},
                    "series": []
                }
                return JsonResponse({'graph': [convert_to_native_python(option)]})
            
            curve_data = [[float(f), float(t)] for f, t in zip(fpr, tpr)]  # Ensure native Python float
            roc_auc_val = float(roc_auc_val) if hasattr(roc_auc_val, '__float__') else roc_auc_val  # Convert to native float
            
            # Handle NaN in AUC for title
            if np.isnan(roc_auc_val):
                auc_str = "nan"
            else:
                auc_str = f"{roc_auc_val:.3f}"
            
            option = {
                "responsive": True,
                "backgroundColor": "#ffffff",
                "title": {
                    "text": f"ROC Curve (AUC={auc_str})",
                    "left": "center",
                    "top": 12,
                    "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600}
                },
                "tooltip": {
                    "trigger": "axis",
                    "textStyle": {"color": "#1f2937", "fontSize": 12},
                    "backgroundColor": "rgba(255,255,255,0.9)",
                    "borderColor": "#e5e7eb"
                },
                "grid": {
                    "top": "15%",
                    "bottom": "12%",
                    "left": "8%",
                    "right": "4%",
                    "containLabel": True
                },
                "xAxis": {
                    "type": "value",
                    "name": "False Positive Rate",
                    "min": 0,
                    "max": 1.02,
                    "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                    "axisLabel": {"color": "#1f2937", "fontSize": 11},
                    "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
                },
                "yAxis": {
                    "type": "value",
                    "name": "True Positive Rate",
                    "min": 0,
                    "max": 1.05,
                    "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                    "axisLabel": {"color": "#1f2937", "fontSize": 11},
                    "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
                },
                "legend": {
                    "orient": "vertical",
                    "right": "2%",
                    "top": "15%",
                    "textStyle": {"color": "#374151", "fontSize": 11}
                },
                "series": [
                    {
                        "name": "ROC Curve",
                        "type": "line",
                        "data": curve_data,
                        "smooth": True,
                        "lineStyle": {"color": "#36a2eb", "width": 2.5},
                        "itemStyle": {"color": "#36a2eb"},
                        "areaStyle": {"color": "rgba(54, 162, 235, 0.15)"}
                    },
                    {
                        "name": "Random Classifier",
                        "type": "line",
                        "data": [[0, 0], [1, 1]],
                        "lineStyle": {"color": "rgba(0,0,0,0.3)", "type": "dashed", "width": 1.5},
                        "itemStyle": {"color": "rgba(0,0,0,0.3)"}
                    }
                ]
            }
            return JsonResponse({'graph': [convert_to_native_python(option)]})

    elif result_opt == "Class-wise Metrics":
        report = classification_report(y, y_pred, output_dict=True)
        class_names = [k for k in report.keys() if k not in ('accuracy', 'macro avg', 'weighted avg')]
        # Truncate class names to MAX_LABEL_LENGTH
        class_names_truncated = [str(c)[:MAX_LABEL_LENGTH] + ('...' if len(str(c)) > MAX_LABEL_LENGTH else '') for c in class_names]
        metrics = ['precision', 'recall', 'f1-score']
        
        # Convert to ECharts bar chart
        series_data = []
        colors = ['#ff6384', '#36a2eb', '#ffce56']
        
        for i, metric in enumerate(metrics):
            values = [float(report[cls][metric]) for cls in class_names]  # Convert to native Python float
            series_data.append({
                "name": metric.replace('-', ' ').title(),
                "type": "bar",
                "data": [round(v, 4) for v in values],
                "itemStyle": {"color": colors[i]},
                "label": {
                    "show": True,
                    "position": "top",
                    "color": "#374151",
                    "fontSize": 11,
                    "formatter": "{c}"
                }
            })
        
        option = {
            "backgroundColor": "#ffffff",
            "title": {
                "text": "Class-wise Metrics",
                "left": "center",
                "top": 12,
                "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600}
            },
            "tooltip": {
                "trigger": "axis",
                "axisPointer": {"type": "shadow"},
                "textStyle": {"color": "#1f2937", "fontSize": 12},
                "backgroundColor": "rgba(255,255,255,0.9)",
                "borderColor": "#e5e7eb"
            },
            "grid": {
                "top": "15%",
                "bottom": "12%",
                "left": "8%",
                "right": "4%",
                "containLabel": True
            },
            "xAxis": {
                "type": "category",
                "data": class_names_truncated,
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"show": False}
            },
            "yAxis": {
                "type": "value",
                "name": "Score",
                "min": 0,
                "max": 1.1,
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "legend": {
                "orient": "horizontal",
                "bottom": "0%",
                "left": "center",
                "textStyle": {"color": "#374151", "fontSize": 12}
            },
            "series": series_data
        }
        
        return JsonResponse({'graph': [convert_to_native_python(option)]})

def actvspred(y, y_pred, graph_header):
    # Limit class value labels to MAX_LABEL_LENGTH characters for readability
    y_labels = [str(val)[:MAX_LABEL_LENGTH] + ('...' if len(str(val)) > MAX_LABEL_LENGTH else '') for val in y]
    y_pred_labels = [str(val)[:MAX_LABEL_LENGTH] + ('...' if len(str(val)) > MAX_LABEL_LENGTH else '') for val in y_pred]
    
    # Convert to ECharts format
    actual_data = [[int(i), label] for i, label in enumerate(y_labels)]
    predicted_data = [[int(i), label] for i, label in enumerate(y_pred_labels)]
    
    option = {
        "responsive": True,
        "backgroundColor": "#ffffff",
        "title": {
            "text": graph_header,
            "left": "center",
            "top": 12,
            "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600}
        },
        "tooltip": {
            "trigger": "axis",
            "axisPointer": {"type": "cross"},
            "textStyle": {"color": "#1f2937", "fontSize": 12},
            "backgroundColor": "rgba(255,255,255,0.9)",
            "borderColor": "#e5e7eb"
        },
        "grid": {
            "top": "15%",
            "bottom": "12%",
            "left": "8%",
            "right": "4%",
            "containLabel": True
        },
        "xAxis": {
            "type": "value",
            "name": "Sample Index",
            "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
            "axisLabel": {"color": "#1f2937", "fontSize": 11},
            "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
        },
        "yAxis": {
            "type": "category",
            "name": "Class Value",
            "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
            "axisLabel": {"color": "#1f2937", "fontSize": 10},
            "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
        },
        "legend": {
            "orient": "horizontal",
            "bottom": "0%",
            "left": "center",
            "textStyle": {"color": "#374151", "fontSize": 12}
        },
        "series": [
            {
                "name": "Actual",
                "type": "scatter",
                "data": actual_data,
                "symbolSize": 5,
                "itemStyle": {"color": MODERN_COLORS[0], "opacity": 0.7, "borderColor": "#ffffff", "borderWidth": 1},
                "label": {
                    "show": False
                }
            },
            {
                "name": "Predicted",
                "type": "scatter",
                "data": predicted_data,
                "symbolSize": 5,
                "itemStyle": {"color": MODERN_COLORS[1], "opacity": 0.7, "borderColor": "#ffffff", "borderWidth": 1},
                "label": {
                    "show": False
                }
            }
        ]
    }
    
    return json.dumps(convert_to_native_python(option))
