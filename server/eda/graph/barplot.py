import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from django.http import JsonResponse
import plotly.express as px
import json
import pandas as pd
from .plotly_theme import apply_modern_theme, MODERN_COLORS

def barplot(df, data):
    # Extract parameters
    x_axes = data.get('cat')            # This can be a list
    y_axis = data.get('num')
    hue = data.get('hue')
    orient = data.get('orient', 'Vertical')
    annotate = data.get('annotate')
    title = data.get('title', '')
    estimator = 'count'
    ci = 'sd'

    # Ensure x_axes is a list
    if not isinstance(x_axes, list):
        x_axes = [x_axes]

    # Handle hue parameter
    hue_param = None if hue in [None, "-"] else hue

    # Initialize lists to hold image data and Plotly figures
    png_list = []
    svg_list = []
    plotly_figs = []

    # Determine orientation
    is_vertical = orient == "Vertical"
    sns_orient = 'v' if is_vertical else 'h'
    plotly_orient = 'v' if is_vertical else 'h'

    # Determine the estimator function
    estimator_func = getattr(pd.Series, estimator)

    for cat in x_axes:
        # Set the title
        plot_title = title or f"Bar Plot of {y_axis} by {cat}"

        # Matplotlib/Seaborn plot
        fig, ax = plt.subplots(figsize=(6, 6))
        ax.set_title(plot_title)

        # Prepare seaborn parameters
        sns_params = {
            'data': df,
            'x': cat if is_vertical else y_axis,
            'y': y_axis if is_vertical else cat,
            'estimator': estimator_func,
            'ci': ci,
            'orient': sns_orient,
            'ax': ax
        }

        # Prepare the color palette
        unique_cats = df[cat].nunique()
        palette = sns.color_palette("pastel", unique_cats)

        if hue_param:
            sns_params['hue'] = hue_param
        else:
            sns_params['palette'] = palette

        # Create seaborn barplot
        sns.barplot(**sns_params)

        # Save the figure to PNG buffer
        buf_png = io.BytesIO()
        fig.savefig(buf_png, format='png', bbox_inches='tight')
        buf_png.seek(0)
        png_list.append(base64.b64encode(buf_png.getvalue()).decode('utf-8'))

        # Save the figure to SVG buffer
        buf_svg = io.BytesIO()
        fig.savefig(buf_svg, format='svg', bbox_inches='tight')
        buf_svg.seek(0)
        svg_list.append(buf_svg.getvalue().decode('utf-8'))

        # Close the figure to free up memory
        plt.close(fig)

        # Create Plotly figure
        # Group data appropriately
        group_by_cols = [cat] + ([hue_param] if hue_param else [])
        grouped_data = df.groupby(group_by_cols)[y_axis].agg(estimator_func).reset_index()

        plotly_title = title or f'Bar Plot of {y_axis} by {cat} ({estimator})'

        plotly_params = {
            'data_frame': grouped_data,
            'x': cat if is_vertical else y_axis,
            'y': y_axis if is_vertical else cat,
            'title': plotly_title,
            'orientation': plotly_orient,
            'color_discrete_sequence': MODERN_COLORS,
        }

        if hue_param:
            plotly_params['color'] = hue_param
        else:
            plotly_params['color'] = cat

        fig_plotly = px.bar(**plotly_params)
        apply_modern_theme(fig_plotly, title=plotly_title)

        # Append the serialized Plotly figure to the list
        plotly_figs.append(json.loads(fig_plotly.to_json()))

    # Prepare the JSON response
    response_data = {
        'png': png_list,
        'svg': svg_list,
        'plotly': plotly_figs,
    }
    return JsonResponse(response_data)
