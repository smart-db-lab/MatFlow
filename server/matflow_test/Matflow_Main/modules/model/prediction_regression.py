
import pandas as pd
import numpy as np
import scipy.stats as stats
from django.http import JsonResponse
import plotly.graph_objects as go
import plotly.io as pio
from plotly.subplots import make_subplots
from ...modules import utils
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from eda.graph.plotly_theme import apply_modern_theme, MODERN_COLORS

def prediction_regression(file):
    target_var = file.get("Target Variable")
    model_opt = file.get("regressor")
    
    # Get the dataset - now seamlessly injected by _inject_workspace from workspace_id and filename
    data_dict = file.get("file", [])
    
    if not data_dict:
        raise ValueError("Dataset not found. Ensure workspace_id and filename are properly provided.")
    
    data = pd.DataFrame(data_dict)
    X, y = utils.split_xy(data, target_var)
    y_pred = file.get("y_pred")
    
    # Parse y_pred if it's a JSON string
    if isinstance(y_pred, str):
        try:
            import json
            y_pred = json.loads(y_pred)
        except:
            pass
    
    result_opt = file.get("Result")
    return show_result(y, y_pred, result_opt, X=X, model_opt=model_opt)

def show_result(y, y_pred, result_opt, X=None, model_opt=None):
    # Ensure arrays are numpy arrays and flatten them
    y = np.asarray(y).flatten()
    y_pred = np.asarray(y_pred).flatten()

    # Align lengths defensively to avoid broadcasting errors when upstream
    # provides mismatched arrays (e.g., full y vs. test-set y_pred)
    min_len = min(len(y), len(y_pred))
    if len(y) != len(y_pred):
        y = y[:min_len]
        y_pred = y_pred[:min_len]
    if result_opt == "Target Value":
        if X is not None:
            result = X.copy().reset_index(drop=True)
            result["Actual"] = pd.Series(y).reset_index(drop=True)
            result["Predicted"] = pd.Series(y_pred).reset_index(drop=True)
        else:
            result = pd.DataFrame({"Actual": y, "Predicted": y_pred})
        result = result.to_json(orient="records")
        
        # Convert to ECharts format
        actual_data = [[i, float(val)] for i, val in enumerate(y)]
        predicted_data = [[i, float(val)] for i, val in enumerate(y_pred)]
        
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
                "type": "value",
                "name": "Value",
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
                    "lineStyle": {"width": 2.5, "color": "#ff6384"},
                    "itemStyle": {"color": "#ff6384"},
                    "areaStyle": {"color": "rgba(255, 99, 132, 0.08)"}
                },
                {
                    "name": "Predicted",
                    "type": "line",
                    "data": predicted_data,
                    "smooth": 0.3,
                    "lineStyle": {"width": 2.5, "color": "#36a2eb", "type": "dashed"},
                    "itemStyle": {"color": "#36a2eb"},
                    "areaStyle": {"color": "rgba(54, 162, 235, 0.08)"}
                }
            ]
        }
        graph_json = [option]
        return JsonResponse({"table": result, "graph": graph_json})

    elif result_opt == "R2 Score":
        result = r2_score(y, y_pred)
        return JsonResponse({"value": result})
    elif result_opt == "MAE":
        result = mean_absolute_error(y, y_pred)
        return JsonResponse({"value": result})
    elif result_opt == "MSE":
        result = mean_squared_error(y, y_pred)
        return JsonResponse({"value": result})
    elif result_opt == "RMSE":
        result = np.sqrt(mean_squared_error(y, y_pred))
        return JsonResponse({"value": result})

    elif result_opt == "Actual vs. Predicted":
        if X is not None:
            tbl = X.copy().reset_index(drop=True)
            tbl["Actual"] = pd.Series(y).reset_index(drop=True)
            tbl["Predicted"] = pd.Series(y_pred).reset_index(drop=True)
        else:
            tbl = pd.DataFrame({"Actual": y, "Predicted": y_pred})
        
        # Convert to ECharts format
        actual_data = [[i, float(val)] for i, val in enumerate(y)]
        predicted_data = [[i, float(val)] for i, val in enumerate(y_pred)]
        
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
                "type": "value",
                "name": "Value",
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
                    "lineStyle": {"width": 2.5, "color": "#ff6384"},
                    "itemStyle": {"color": "#ff6384"},
                    "areaStyle": {"color": "rgba(255, 99, 132, 0.08)"}
                },
                {
                    "name": "Predicted",
                    "type": "line",
                    "data": predicted_data,
                    "smooth": 0.3,
                    "lineStyle": {"width": 2.5, "color": "#36a2eb", "type": "dashed"},
                    "itemStyle": {"color": "#36a2eb"},
                    "areaStyle": {"color": "rgba(54, 162, 235, 0.08)"}
                }
            ]
        }
        return JsonResponse({'table': tbl.to_json(orient='records'), 'graph': [option]})

    elif result_opt == "Residuals vs. Predicted":
        residuals = y - y_pred
        data = [[float(pred), float(res)] for pred, res in zip(y_pred, residuals)]
        
        # Calculate axis limits for reference line
        axis_min = min(y_pred)
        axis_max = max(y_pred)
        zero_line = [[float(axis_min), 0], [float(axis_max), 0]]
        
        option = {
            "backgroundColor": "#ffffff",
            "title": {
                "text": "Residuals vs. Predicted Values",
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
                "bottom": "12%",
                "left": "8%",
                "right": "4%",
                "containLabel": True
            },
            "xAxis": {
                "type": "value",
                "name": "Predicted Value",
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "yAxis": {
                "type": "value",
                "name": "Residual",
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "series": [
                {
                    "name": "Residuals",
                    "type": "scatter",
                    "data": data,
                    "itemStyle": {"color": "#36a2eb", "opacity": 0.65, "borderColor": "#ffffff", "borderWidth": 1},
                    "symbolSize": 6
                },
                {
                    "name": "Zero Reference",
                    "type": "line",
                    "data": zero_line,
                    "lineStyle": {"color": "#ff6384", "type": "dashed", "width": 1.5},
                    "itemStyle": {"color": "#ff6384"},
                    "smooth": False
                }
            ]
        }
        return JsonResponse({'graph': [option]})

    elif result_opt == "Histogram of Residuals":
        residuals = y - y_pred
        hist, bin_edges = np.histogram(residuals, bins=15)
        bin_centers = [(bin_edges[i] + bin_edges[i+1]) / 2 for i in range(len(bin_edges)-1)]
        data = [[float(bc), int(h)] for bc, h in zip(bin_centers, hist)]
        
        option = {
            "backgroundColor": "#ffffff",
            "title": {
                "text": "Histogram of Residuals",
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
                "name": "Residual Value",
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "yAxis": {
                "type": "value",
                "name": "Frequency",
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "series": [
                {
                    "name": "Frequency",
                    "type": "bar",
                    "data": data,
                    "itemStyle": {"color": "#36a2eb", "borderColor": "#ffffff", "borderWidth": 1, "opacity": 0.85},
                    "barGap": "5%"
                }
            ]
        }
        return JsonResponse({'graph': [option]})

    elif result_opt == "QQ Plot":
        residuals = y - y_pred
        qq = stats.probplot(residuals, dist="norm")
        theoretical = qq[0][0]
        sample = qq[0][1]
        
        scatter_data = [[float(t), float(s)] for t, s in zip(theoretical, sample)]
        line_min = min(theoretical.min(), sample.min())
        line_max = max(theoretical.max(), sample.max())
        ref_line_data = [[float(line_min), float(line_min)], [float(line_max), float(line_max)]]
        
        option = {
            "backgroundColor": "#ffffff",
            "title": {
                "text": "Normal Q-Q Plot",
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
                "bottom": "12%",
                "left": "8%",
                "right": "4%",
                "containLabel": True
            },
            "xAxis": {
                "type": "value",
                "name": "Theoretical Quantiles",
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "yAxis": {
                "type": "value",
                "name": "Sample Quantiles",
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
                    "name": "Reference",
                    "type": "line",
                    "data": ref_line_data,
                    "lineStyle": {"color": "#ff6384", "type": "dashed", "width": 2},
                    "itemStyle": {"color": "#ff6384"},
                    "smooth": False
                },
                {
                    "name": "Sample Quantiles",
                    "type": "scatter",
                    "data": scatter_data,
                    "itemStyle": {"color": "#36a2eb", "opacity": 0.7, "borderColor": "#ffffff", "borderWidth": 1},
                    "symbolSize": 6
                }
            ]
        }
        return JsonResponse({'graph': [option]})

    elif result_opt == "Box Plot of Residuals":
        residuals = y - y_pred
        residuals_sorted = np.sort(residuals)
        q1 = np.percentile(residuals_sorted, 25)
        median = np.percentile(residuals_sorted, 50)
        q3 = np.percentile(residuals_sorted, 75)
        whisker_low = np.percentile(residuals_sorted, 5)
        whisker_high = np.percentile(residuals_sorted, 95)
        
        option = {
            "backgroundColor": "#ffffff",
            "title": {
                "text": "Box Plot of Residuals",
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
                "bottom": "12%",
                "left": "15%",
                "right": "10%",
                "containLabel": True
            },
            "xAxis": {
                "type": "category",
                "data": ["Residuals"],
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11}
            },
            "yAxis": {
                "type": "value",
                "name": "Residual Value",
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "series": [
                {
                    "name": "Residuals",
                    "type": "boxplot",
                    "data": [[
                        float(whisker_low),
                        float(q1),
                        float(median),
                        float(q3),
                        float(whisker_high)
                    ]],
                    "itemStyle": {"color": "#36a2eb", "borderColor": "#1f2937", "borderWidth": 1.5, "opacity": 0.85}
                }
            ]
        }
        return JsonResponse({'graph': [option]})

    elif result_opt == "Regression Line Plot":
        scatter_data = [[float(a), float(p)] for a, p in zip(y, y_pred)]
        axis_min = min(min(y), min(y_pred))
        axis_max = max(max(y), max(y_pred))
        perfect_line = [[float(axis_min), float(axis_min)], [float(axis_max), float(axis_max)]]
        
        option = {
            "backgroundColor": "#ffffff",
            "title": {
                "text": "Regression Line Plot",
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
                "bottom": "12%",
                "left": "8%",
                "right": "4%",
                "containLabel": True
            },
            "xAxis": {
                "type": "value",
                "name": "Actual Value",
                "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
                "axisLabel": {"color": "#1f2937", "fontSize": 11},
                "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
            },
            "yAxis": {
                "type": "value",
                "name": "Predicted Value",
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
                    "name": "Predictions",
                    "type": "scatter",
                    "data": scatter_data,
                    "itemStyle": {"color": "#36a2eb", "opacity": 0.6, "borderColor": "#ffffff", "borderWidth": 1},
                    "symbolSize": 6
                },
                {
                    "name": "Perfect Fit",
                    "type": "line",
                    "data": perfect_line,
                    "lineStyle": {"color": "#ff6384", "type": "dashed", "width": 2.5},
                    "itemStyle": {"color": "#ff6384"},
                    "smooth": False
                }
            ]
        }
        return JsonResponse({'graph': [option]})

    elif result_opt == "Metrics Summary":
        r2 = r2_score(y, y_pred)
        mae = mean_absolute_error(y, y_pred)
        mse = mean_squared_error(y, y_pred)
        rmse = np.sqrt(mse)

        fig = make_subplots(
            rows=2, cols=2,
            specs=[[{"type": "indicator"}, {"type": "indicator"}],
                   [{"type": "indicator"}, {"type": "indicator"}]],
            horizontal_spacing=0.15,
            vertical_spacing=0.15,
        )

        fig.add_trace(go.Indicator(
            mode="gauge+number",
            value=r2,
            title={'text': 'R\u00b2 Score', 'font': {'size': 16, 'color': '#374151'}},
            number={'font': {'size': 32}},
            gauge={
                'axis': {'range': [0, 1], 'tickfont': {'size': 10, 'color': '#9ca3af'}},
                'bar': {'color': MODERN_COLORS[1], 'thickness': 0.75},
                'bgcolor': '#f3f4f6',
                'borderwidth': 0,
                'steps': [
                    {'range': [0, 0.5], 'color': '#fee2e2'},
                    {'range': [0.5, 0.8], 'color': '#fef3c7'},
                    {'range': [0.8, 1], 'color': '#d1fae5'},
                ],
            }
        ), row=1, col=1)

        fig.add_trace(go.Indicator(
            mode="number",
            value=mae,
            title={'text': 'MAE', 'font': {'size': 16, 'color': '#374151'}},
            number={'font': {'color': MODERN_COLORS[0], 'size': 36}, 'valueformat': '.4f'},
        ), row=1, col=2)

        fig.add_trace(go.Indicator(
            mode="number",
            value=mse,
            title={'text': 'MSE', 'font': {'size': 16, 'color': '#374151'}},
            number={'font': {'color': MODERN_COLORS[4], 'size': 36}, 'valueformat': '.4f'},
        ), row=2, col=1)

        fig.add_trace(go.Indicator(
            mode="number",
            value=rmse,
            title={'text': 'RMSE', 'font': {'size': 16, 'color': '#374151'}},
            number={'font': {'color': MODERN_COLORS[3], 'size': 36}, 'valueformat': '.4f'},
        ), row=2, col=2)

        clean_model_name = str(model_opt or "").strip()
        metrics_title = (
            f"{clean_model_name} Model Performance Metrics"
            if clean_model_name
            else "Regression Model Performance Metrics"
        )
        apply_modern_theme(fig, title=metrics_title)
        return JsonResponse({'graph': pio.to_json(fig)})
