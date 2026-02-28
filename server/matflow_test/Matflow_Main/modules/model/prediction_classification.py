
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

def prediction_classification(file):
    target_var = file.get("Target Variable")
    model_opt=file.get("regressor")
    data = pd.DataFrame(file.get("file"))
    y_pred = file.get("y_pred")
    X, y = utils.split_xy(data, target_var)
    result_opt = file.get("Result")
    if y.nunique() > 2:
        return  show_result(y, y_pred, result_opt, None,X,model_opt)
    else:
        return show_result(y, y_pred, result_opt, "binary",X,model_opt)

def show_result(y, y_pred, result_opt, multi_average,X,model_name):
    le = LabelEncoder()
    if result_opt in ["Accuracy", "Precision", "Recall", "F1-Score"]:
        # For multiclass, use 'weighted' average to get a single scalar
        avg = multi_average if multi_average else 'weighted'
        metric_dict = {
            "Accuracy": float(accuracy_score(y, y_pred)),
            "Precision": float(precision_score(y, y_pred, average=avg)),
            "Recall": float(recall_score(y, y_pred, average=avg)),
            "F1-Score": float(f1_score(y, y_pred, average=avg))
        }

        result = metric_dict.get(result_opt)
        return JsonResponse(result, safe=False)
    elif result_opt == "Target Value":
        result = pd.DataFrame({
            "Actual": y,
            "Predicted": y_pred
        })
        graph=actvspred(y, y_pred,"Actual vs. Predicted")
        result_json = result.to_json(orient="records")
        result_dict = json.loads(result_json)
        obj={
                "table":result_dict,
                "graph":graph
        }
        return JsonResponse(obj, safe=False)
    elif result_opt == "Classification Report":
        result = classification_report(y, y_pred)
        return JsonResponse(result, safe=False)

    elif result_opt == "Confusion Matrix":
        cm = confusion_matrix(y, y_pred)
        labels = [str(l) for l in np.unique(y_pred)]
        fig = go.Figure(data=go.Heatmap(
            z=cm,
            x=labels,
            y=labels,
            colorscale=[[0, '#ffffff'], [0.5, '#fbb4c4'], [1, '#ff6384']],
            text=cm,
            texttemplate='<b>%{text}</b>',
            textfont=dict(size=18, color='#1f2937'),
            hovertemplate='Actual: %{y}<br>Predicted: %{x}<br>Count: %{text}<extra></extra>',
            xgap=3,
            ygap=3,
            showscale=True,
            colorbar=dict(
                thickness=12,
                outlinewidth=0,
                tickfont=dict(size=11, color='#6b7280'),
            ),
        ))
        fig.update_layout(
            xaxis=dict(title="Predicted Label", automargin=True, side='bottom', tickangle=0),
            yaxis=dict(title="Actual Label", automargin=True, autorange='reversed'),
        )
        apply_modern_theme(fig, title="Confusion Matrix")
        fig_json = pio.to_json(fig)
        return JsonResponse({'graph': fig_json})

    elif result_opt == "Actual vs. Predicted":
        x_range = np.arange(len(y))
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=x_range, y=y, mode='lines+markers', name='Actual',
            line=dict(color=MODERN_COLORS[0], width=2.5),
            marker=dict(size=4, color=MODERN_COLORS[0]),
        ))
        fig.add_trace(go.Scatter(
            x=x_range, y=y_pred, mode='lines+markers', name='Predicted',
            line=dict(color=MODERN_COLORS[1], width=2.5, dash='dot'),
            marker=dict(size=4, color=MODERN_COLORS[1]),
        ))
        apply_modern_theme(fig, title="Actual vs. Predicted Values")
        fig.update_layout(
            xaxis=dict(title='Sample Index'),
            yaxis=dict(title='Class Value'),
            legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
        )
        fig_json = pio.to_json(fig)
        return JsonResponse({'graph': fig_json})

    elif result_opt == "Precision-Recall Curve":
        if y.nunique() > 2:
            return JsonResponse({'error': 'Precision-Recall curve is not supported for multiclass classification'})
        else:
            y_encoded = le.fit_transform(y)
            y_pred_encoded = le.transform(y_pred)
            precision, recall, _ = precision_recall_curve(y_encoded.ravel(), y_pred_encoded.ravel())
            ap = average_precision_score(y_encoded, y_pred_encoded)

            fig = go.Figure()
            # Filled area under curve
            fig.add_trace(go.Scatter(
                x=recall, y=precision, mode='lines',
                name=f'PR Curve (AP={ap:.2f})',
                line=dict(color=MODERN_COLORS[0], width=2.5),
                fill='tozeroy',
                fillcolor='rgba(255,99,132,0.12)',
            ))
            # Baseline
            fig.add_shape(
                type='line', x0=0, y0=1, x1=1, y1=0,
                line=dict(color='rgba(0,0,0,0.15)', dash='dash', width=1.5),
            )
            apply_modern_theme(fig, title='Precision-Recall Curve')
            fig.update_layout(
                xaxis=dict(title='Recall', range=[0, 1.02]),
                yaxis=dict(title='Precision', range=[0, 1.05]),
                legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
            )
            fig_json = pio.to_json(fig)
            return JsonResponse({'graph': fig_json})

    elif result_opt == "ROC Curve":
        if y.nunique() > 2:
            label_encoder = LabelEncoder()
            label_encoder.fit(y)
            y = label_encoder.transform(y)
            classes = label_encoder.classes_
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
            min_max_scaler = MinMaxScaler()
            X_train_norm = min_max_scaler.fit_transform(X_train)
            X_test_norm = min_max_scaler.fit_transform(X_test)
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
            y_test_binarized = label_binarize(y_test, classes=np.unique(y_test))
            fpr = {}
            tpr = {}
            roc_auc = dict()
            n_class = classes.shape[0]
            for i in range(n_class):
                fpr[i], tpr[i], _ = roc_curve(y_test_binarized[:, i], pred_prob[:, i])
                roc_auc[i] = auc(fpr[i], tpr[i])
            fig = go.Figure()
            for i in range(n_class):
                color = MODERN_COLORS[i % len(MODERN_COLORS)]
                fig.add_trace(go.Scatter(
                    x=fpr[i], y=tpr[i], mode='lines',
                    name='%s vs Rest (AUC=%.2f)' % (classes[i], roc_auc[i]),
                    line=dict(color=color, width=2.5),
                ))
            # Diagonal baseline
            fig.add_shape(
                type='line', x0=0, y0=0, x1=1, y1=1,
                line=dict(dash='dash', color='rgba(0,0,0,0.2)', width=1.5),
            )
            apply_modern_theme(fig, title='Multiclass ROC Curve')
            fig.update_layout(
                xaxis=dict(title='False Positive Rate', range=[0, 1.02]),
                yaxis=dict(title='True Positive Rate', range=[0, 1.05]),
                legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
            )
            fig_json = pio.to_json(fig)
            return JsonResponse({'graph': fig_json})
        else:
            y_encoded = le.fit_transform(y)
            y_pred_encoded = le.transform(y_pred)
            fpr, tpr, _ = roc_curve(y_encoded.ravel(), y_pred_encoded.ravel())
            roc_auc_val = auc(fpr, tpr)

            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=fpr, y=tpr, mode='lines',
                name=f'ROC Curve (AUC={roc_auc_val:.2f})',
                line=dict(color=MODERN_COLORS[1], width=2.5),
                fill='tozeroy',
                fillcolor='rgba(54,162,235,0.10)',
            ))
            fig.add_shape(
                type='line', x0=0, y0=0, x1=1, y1=1,
                line=dict(dash='dash', color='rgba(0,0,0,0.2)', width=1.5),
            )
            apply_modern_theme(fig, title='ROC Curve')
            fig.update_layout(
                xaxis=dict(title='False Positive Rate', range=[0, 1.02]),
                yaxis=dict(title='True Positive Rate', range=[0, 1.05]),
                legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
            )
            fig_json = pio.to_json(fig)
            return JsonResponse({'graph': fig_json})

    elif result_opt == "Class-wise Metrics":
        report = classification_report(y, y_pred, output_dict=True)
        class_names = [k for k in report.keys() if k not in ('accuracy', 'macro avg', 'weighted avg')]
        metrics = ['precision', 'recall', 'f1-score']
        fig = go.Figure()
        for i, metric in enumerate(metrics):
            values = [report[cls][metric] for cls in class_names]
            fig.add_trace(go.Bar(
                name=metric.replace('-', ' ').title(),
                x=class_names,
                y=values,
                marker_color=MODERN_COLORS[i % len(MODERN_COLORS)],
                marker_line=dict(width=0),
                text=[f'{v:.2f}' for v in values],
                textposition='outside',
                textfont=dict(size=11, color='#374151'),
            ))
        fig.update_layout(
            barmode='group',
            bargap=0.25,
            bargroupgap=0.08,
        )
        apply_modern_theme(fig, title='Class-wise Metrics')
        fig.update_layout(
            xaxis=dict(title='Class'),
            yaxis=dict(title='Score', range=[0, 1.12]),
            legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
        )
        fig_json = pio.to_json(fig)
        return JsonResponse({'graph': fig_json})

def actvspred(y, y_pred, graph_header):
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=list(range(len(y))), y=y, mode='lines+markers', name='Actual',
        line=dict(color=MODERN_COLORS[0], width=2.5),
        marker=dict(size=4, color=MODERN_COLORS[0]),
    ))
    fig.add_trace(go.Scatter(
        x=list(range(len(y_pred))), y=y_pred, mode='lines+markers', name='Predicted',
        line=dict(color=MODERN_COLORS[1], width=2.5, dash='dot'),
        marker=dict(size=4, color=MODERN_COLORS[1]),
    ))
    apply_modern_theme(fig, title=graph_header)
    fig.update_layout(
        xaxis=dict(title='Sample Index'),
        yaxis=dict(title='Class Value'),
        legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
    )
    return fig.to_json()
