import re
import math

with open("server/matflow_test/Matflow_Main/modules/dataframe/correlation.py", "r") as f:
    text = f.read()

old_func_regex = r"def display_heatmap\(correlation_data\):.*?return JsonResponse\(fig_json, safe=False\)"

new_func = """def display_heatmap(correlation_data):
    correlation_data = pd.DataFrame(correlation_data)
    
    # In DatasetCorrelation.jsx, normal rows have column_name added at the end.
    if "column_name" in correlation_data.columns:
        correlation_data = correlation_data.drop(columns=["column_name"])
    elif len(correlation_data.columns) > 0 and correlation_data.columns[-1] == "column_name":
        correlation_data = correlation_data.drop(correlation_data.columns[-1], axis=1)
    
    columns = correlation_data.columns.tolist()
    data = []
    
    # Fill data for ECharts heatmap
    for i in range(len(columns)):
        for j in range(len(columns)):
            val = float(correlation_data.iloc[i, j])
            if math.isnan(val):
                val = 0.0
            val = round(val, 3)
            # Echarts heatmap requires [xIndex, yIndex, value]
            data.append([j, i, val])

    option = {
        "backgroundColor": "#ffffff",
        "title": {
            "text": "Feature Correlation Heatmap",
            "left": "center",
            "top": 8,
            "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600}
        },
        "tooltip": {
            "position": "top",
            "formatter": "{c}"
        },
        "grid": {
            "height": "75%", "top": "15%", "left": "15%", "right": "10%"
        },
        "xAxis": {
            "type": "category",
            "data": columns,
            "splitArea": {"show": True},
            "axisLabel": {
                "color": "#1f2937",
                "rotate": 45,
                "interval": 0,
                "formatter": {
                    "type": "function",
                    "source": "function(v){ var s=String(v); return s.length>15 ? s.slice(0,14)+'…' : s; }"
                }
            }
        },
        "yAxis": {
            "type": "category",
            "data": columns,
            "splitArea": {"show": True},
            "axisLabel": {
                "color": "#1f2937",
                "formatter": {
                    "type": "function",
                    "source": "function(v){ var s=String(v); return s.length>15 ? s.slice(0,14)+'…' : s; }"
                }
            }
        },
        "visualMap": {
            "min": -1,
            "max": 1,
            "calculable": True,
            "orient": "horizontal",
            "left": "center",
            "bottom": "0%",
            "inRange": {
                "color": ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
            }
        },
        "series": [{
            "name": "Correlation",
            "type": "heatmap",
            "data": data,
            "label": {
                "show": True
            },
            "emphasis": {
                "itemStyle": {
                    "shadowBlur": 10,
                    "shadowColor": "rgba(0, 0, 0, 0.5)"
                }
            }
        }]
    }

    return JsonResponse({"echarts": [option], "png": [], "svg": []})"""

new_text = re.sub(old_func_regex, new_func, text, flags=re.DOTALL)

with open("server/matflow_test/Matflow_Main/modules/dataframe/correlation.py", "w") as f:
    f.write(new_text)

print("Patch applied.")
