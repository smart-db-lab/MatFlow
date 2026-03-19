
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.io as pio
from django.http import JsonResponse
import numpy as np

from ...modules import utils

# def correlation(data):
# 	st.title("Feature Correlation")
#
# 	num_var = utils.get_numerical(data)
# 	col1, col2 = st.columns([8,2])
#
# 	col2.markdown("#")
# 	select_all = col2.checkbox("Select all", True, key="correlation_select_all")
#
# 	if select_all:
# 		correlation_var = col1.multiselect(
# 				"Columns",
# 				num_var,
# 				num_var,
# 				key="correlation_var"
# 			)
# 	else:
# 		correlation_var = col1.multiselect(
# 				"Columns",
# 				num_var,
# 				key="correlation_var"
# 			)
#
# 	col1, col2, col3 = st.columns([4,4,2.02])
# 	correlation_method = col1.selectbox(
# 			"Method",
# 			["pearson", "kendall", "spearman"],
# 			key="correlation_method"
# 		)
#
# 	display_type = col2.selectbox(
# 			"Display Type",
# 			["Table", "Heatmap", "Feature Pair"],
# 			key="correlation_display_type"
# 		)
#
# 	if correlation_var:
# 		if display_type == "Table":
# 			col3.markdown("#")
# 			bg_gradient = col3.checkbox("Gradient", key="correlation_bg_gradient")
# 		elif display_type == "Heatmap":
# 			col3.markdown("#")
# 			annot = col3.checkbox("Annotate", key="correlation_annot")
# 		else:
# 			col3.markdown("#")
# 			bg_gradient = col3.checkbox("Gradient", key="correlation_bg_gradient")
#
#
#
# 		correlation_data = data[correlation_var].corr(correlation_method)
# 		if display_type == "Table":
# 			display_table(correlation_data, bg_gradient)
# 		elif display_type == "Heatmap":
# 			display_heatmap(correlation_data, annot)
# 		else:
# 			display_pair(correlation_data, bg_gradient)
#
# def display_table(correlation_data, bg_gradient):
# 	if bg_gradient:
# 		st.dataframe(correlation_data.style.background_gradient())
# 	else:
# 		st.dataframe(correlation_data)


import numpy as np


def display_heatmap(correlation_data):
    correlation_data = pd.DataFrame(correlation_data)
    
    # In DatasetCorrelation.jsx, normal rows might have column_name added at the end.
    if "column_name" in correlation_data.columns:
        correlation_data = correlation_data.drop(columns=["column_name"])
    elif len(correlation_data.columns) > 0 and correlation_data.columns[-1] == "column_name":
        correlation_data = correlation_data.drop(correlation_data.columns[-1], axis=1)
    
    columns = correlation_data.columns.tolist()
    data = []
    
    # Fill data for ECharts heatmap, handling NaN/null values
    for i in range(len(columns)):
        for j in range(len(columns)):
            try:
                val = float(correlation_data.iloc[i, j])
                # Replace NaN with 0 for display purposes
                if pd.isna(val):
                    val = 0.0
                val = round(val, 3)
            except (ValueError, TypeError):
                # If conversion fails, use 0
                val = 0.0
            # Echarts heatmap requires [xIndex, yIndex, value]
            data.append([j, i, val])

    # Calculate responsive grid sizing based on number of columns
    num_cols = len(columns)
    # Minimum spacing per column (pixels)
    min_col_space = 60
    # Estimate needed height
    estimated_height = max(400, num_cols * min_col_space)
    
    option = {
        "backgroundColor": "#ffffff",
        "title": {
            "text": "Feature Correlation Heatmap",
            "left": "center",
            "top": 12,
            "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600}
        },
        "tooltip": {
            "position": "top",
            "formatter": "{c}",
            "textStyle": {"color": "#1f2937", "fontSize": 12},
            "backgroundColor": "rgba(255,255,255,0.9)",
            "borderColor": "#e5e7eb"
        },
        "grid": {
            "top": "15%",
            "bottom": "15%",
            "left": "12%",
            "right": "8%",
            "containLabel": True
        },
        "xAxis": {
            "type": "category",
            "data": columns,
            "splitArea": {"show": False},
            "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
            "axisLabel": {
                "color": "#1f2937",
                "rotate": 45,
                "interval": 0,
                "fontSize": 11,
                "overflow": "break",
                "formatter": {
                    "type": "function",
                    "source": "function(v){ var s=String(v); return s.length>12 ? s.slice(0,11)+'…' : s; }"
                }
            }
        },
        "yAxis": {
            "type": "category",
            "data": columns,
            "splitArea": {"show": False},
            "axisLine": {"lineStyle": {"color": "#e5e7eb"}},
            "axisLabel": {
                "color": "#1f2937",
                "fontSize": 11,
                "formatter": {
                    "type": "function",
                    "source": "function(v){ var s=String(v); return s.length>12 ? s.slice(0,11)+'…' : s; }"
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
        "dataZoom": [
            {
                "type": "slider",
                "show": True,
                "xAxisIndex": [0],
                "start": 0,
                "end": 100,
                "textStyle": {"color": "#1f2937"}
            },
            {
                "type": "slider",
                "show": True,
                "yAxisIndex": [0],
                "start": 0,
                "end": 100,
                "orient": "vertical",
                "textStyle": {"color": "#1f2937"}
            }
        ],
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

    return JsonResponse({"echarts": [option], "png": [], "svg": []})


def display_pair(correlation_data, bg_gradient,feature1,feature2,higher_than,drop_perfect,convert_abs):
    features = correlation_data.columns.to_list()
    features.insert(0, "-")


    if convert_abs:
        # convert to absolute value to take negative correlation into consideration and then sort by the highest correlation
        sorted_corr = correlation_data \
                        .abs() \
                        .unstack() \
                        .sort_values(ascending=False) \
                        .reset_index() \

    else:
        sorted_corr = correlation_data \
                        .unstack() \
                        .sort_values(ascending=False) \
                        .reset_index() \

    sorted_corr.rename(
            columns = {
                "level_0": "Feature 1",
                "level_1": "Feature 2",
                0: 'Correlation Coefficient'
            }, inplace=True
        )

    if drop_perfect:
        sorted_corr = sorted_corr.drop(sorted_corr[sorted_corr['Correlation Coefficient'] == 1.0].index)

    if higher_than:
        sorted_corr = sorted_corr[sorted_corr['Correlation Coefficient'] > higher_than].reset_index(drop=True)

    if feature1 != "-" and feature2 == "-":
        sorted_corr = sorted_corr.loc[sorted_corr["Feature 1"] == feature1].reset_index(drop=True)
    elif feature1 == "-" and feature2 != "-":
        sorted_corr = sorted_corr.loc[sorted_corr["Feature 2"] == feature2].reset_index(drop=True)
    elif feature1 != "-" and feature2 != "-":
        if feature1 == feature2:
            # drop observation with same features but different column
            sorted_corr.drop(sorted_corr.iloc[1::2].index, inplace=True)
            sorted_corr = sorted_corr.loc[(sorted_corr["Feature 1"] == feature1) | (sorted_corr["Feature 2"] == feature2)].reset_index(drop=True)
        else:
            sorted_corr = sorted_corr.loc[(sorted_corr["Feature 1"] == feature1) | (sorted_corr["Feature 2"] == feature2)].reset_index(drop=True)

    else:
        sorted_corr = sorted_corr.drop(sorted_corr.iloc[1::2].index).reset_index(drop=True)

    return sorted_corr
