import pandas as pd
import numpy as np
from django.http import JsonResponse

def convert_to_native_python(obj):
    """Recursively convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        val = float(obj)
        if np.isnan(val):
            return None
        elif np.isinf(val):
            return None
        return val
    elif isinstance(obj, float):
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


def model_report(file):
    result_df = pd.DataFrame(file.get("file"))
    display_type = file.get("Display Type", "Graph")

    if display_type == "Table":
        include_data = file.get("Include Data", False)
        return report_table(result_df, include_data)
    else:
        return report_graph(result_df, file)


def report_table(data, include_data=False):
    # Implementation for table display can be added here
    pass


def report_graph(data, file):
    model_data = data.copy()

    try:
        model_data = model_data.drop(columns=['Train Data', 'Test Data', 'Model Name'])
    except:
        pass

    orientation = file.get("Select Orientation", "Vertical")
    display_result = file.get("Display Result", "All")

    if display_result == "All":
        column = model_data
    elif display_result == "Train":
        colms = model_data.columns[model_data.columns.str.contains("Train")].to_list()
        column = model_data[colms] if colms else model_data
    elif display_result == "Test":
        colms = model_data.columns[model_data.columns.str.contains("Test")].to_list()
        column = model_data[colms] if colms else model_data
    elif display_result == "Custom":
        selected_columns = file.get("Columns", [])
        if len(selected_columns) > 0:
            column = model_data[selected_columns]
        else:
            column = model_data
    else:
        column = model_data

    # Ensure we have the model names
    model_names = data['name'].values if 'name' in data.columns else [f"Model {i + 1}" for i in range(len(data))]

    # Check if Radar chart is requested
    if orientation == "Radar":
        return report_radar(column, model_names, model_data)

    # Create ECharts bar chart
    # Modern color palette
    colors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#14B8A6', '#F97316', '#6366F1']
    
    # Prepare series data for each model
    series_data = []
    for j, (idx, row) in enumerate(model_data.iterrows()):
        model_name = model_names[j] if j < len(model_names) else f"Model {j + 1}"
        values = []
        for col in column.columns:
            try:
                value = row[col] if col in row else None
            except:
                value = None
            # Only try to convert numeric values, skip non-numeric columns
            if isinstance(value, str):
                try:
                    values.append(float(value))
                except (ValueError, TypeError):
                    values.append(0)
            else:
                values.append(float(value) if value is not None else 0)
        
        series_data.append({
            "name": model_name,
            "type": "bar",
            "data": values,
            "itemStyle": {"color": colors[j % len(colors)]},
            "label": {
                "show": False
            }
        })
    
    option = {
        "backgroundColor": "#ffffff",
        "title": {
            "text": "Model Performance Comparison",
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
        "legend": {
            "orient": "horizontal",
            "bottom": "0%",
            "left": "center",
            "textStyle": {"color": "#374151", "fontSize": 12}
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
            "data": [str(col) for col in column.columns],
            "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
            "axisLabel": {"color": "#1f2937", "fontSize": 11, "rotate": -45 if orientation == "Vertical" else 0},
            "splitLine": {"show": False}
        } if orientation == "Vertical" else {
            "type": "value",
            "name": "Score",
            "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
            "axisLabel": {"color": "#1f2937", "fontSize": 11},
            "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
        },
        "yAxis": {
            "type": "value",
            "name": "Score",
            "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
            "axisLabel": {"color": "#1f2937", "fontSize": 11},
            "splitLine": {"lineStyle": {"color": "#f3f4f6"}}
        } if orientation == "Vertical" else {
            "type": "category",
            "data": [str(col) for col in column.columns],
            "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
            "axisLabel": {"color": "#1f2937", "fontSize": 11},
            "splitLine": {"show": False}
        },
        "series": series_data
    }
    
    return JsonResponse({'data': None, 'layout': None, 'graph': [convert_to_native_python(option)]}, safe=False)


def report_radar(column, model_names, model_data):
    """Generate an ECharts radar chart for model comparison."""
    # Modern color palette
    colors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#14B8A6', '#F97316', '#6366F1']
    
    metrics = list(column.columns)
    
    # Prepare series data for each model
    series_data = []
    for j, (idx, row) in enumerate(model_data.iterrows()):
        model_name = model_names[j] if j < len(model_names) else f"Model {j + 1}"
        values = []
        for col in metrics:
            try:
                v = row[col] if col in row else 0
                # Handle string values that might be numeric
                if isinstance(v, str):
                    try:
                        v = float(v)
                    except (ValueError, TypeError):
                        v = 0
                values.append(float(v) if v is not None else 0)
            except:
                values.append(0)
        
        series_data.append({
            "name": model_name,
            "value": values,
            "areaStyle": {
                "opacity": 0.3
            },
            "lineStyle": {
                "color": colors[j % len(colors)],
                "width": 2
            },
            "itemStyle": {
                "color": colors[j % len(colors)]
            }
        })
    
    option = {
        "backgroundColor": "#ffffff",
        "title": {
            "text": "Model Performance Radar",
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
        "legend": {
            "orient": "horizontal",
            "bottom": "5%",
            "left": "center",
            "textStyle": {"color": "#374151", "fontSize": 12}
        },
        "radar": {
            "indicator": [{"name": str(metric), "max": 1.05} for metric in metrics],
            "shape": "polygon",
            "splitNumber": 4,
            "name": {
                "textStyle": {
                    "color": "#1f2937",
                    "fontSize": 11
                }
            },
            "splitLine": {
                "lineStyle": {
                    "color": ["rgba(0,0,0,0.06)", "rgba(0,0,0,0.06)", "rgba(0,0,0,0.06)", "rgba(0,0,0,0.06)"],
                    "width": 1
                }
            },
            "axisLine": {
                "lineStyle": {
                    "color": "#e5e7eb",
                    "width": 1
                }
            },
            "splitArea": {
                "show": False
            }
        },
        "series": [
            {
                "type": "radar",
                "data": series_data
            }
        ]
    }
    
    return JsonResponse({'data': None, 'layout': None, 'graph': [convert_to_native_python(option)]}, safe=False)
