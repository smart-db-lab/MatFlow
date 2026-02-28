import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from django.http import JsonResponse
import plotly.express as px
import json
from .plotly_theme import apply_modern_theme, MODERN_COLORS

def boxplot(df, data):
    # Extract parameters
    x_axes = data.get('cat')  # This can be a list
    y_axis = data.get('num')
    hue = data.get('hue')
    orient = data.get('orient', 'Vertical')  # Default orientation
    title = data.get('title', '')

    # Ensure x_axes is a list
    if not isinstance(x_axes, list):
        x_axes = [x_axes]

    # Handle hue parameter
    hue_param = None if hue in [None, "-"] else hue

    # Initialize lists to hold image data
    png_list = []
    svg_list = []
    plotly_figs = []

    # Determine orientation
    is_vertical = orient == "Vertical"
    sns_orient = 'v' if is_vertical else 'h'
    plotly_orient = 'v' if is_vertical else 'h'

    # Loop over each categorical variable
    for cat in x_axes:
        # Set the title
        plot_title = title or f"Box Plot of {y_axis} by {cat}"

        # Matplotlib/Seaborn plot
        fig, ax = plt.subplots(figsize=(6, 6))
        ax.set_title(plot_title)

        # Prepare seaborn parameters
        sns_params = {
            'data': df,
            'x': cat if is_vertical else y_axis,
            'y': y_axis if is_vertical else cat,
            'orient': sns_orient,
            'ax': ax
        }
        if hue_param:
            sns_params['hue'] = hue_param

        # Create the seaborn boxplot
        sns.boxplot(**sns_params)

        # Save the figure to a PNG buffer
        buf_png = io.BytesIO()
        fig.savefig(buf_png, format='png', bbox_inches='tight')
        buf_png.seek(0)
        png_list.append(base64.b64encode(buf_png.getvalue()).decode('utf-8'))

        # Save the figure to an SVG buffer
        buf_svg = io.BytesIO()
        fig.savefig(buf_svg, format='svg', bbox_inches='tight')
        buf_svg.seek(0)
        svg_list.append(buf_svg.getvalue().decode('utf-8'))

        # Close the figure to free up memory
        plt.close(fig)

        # Plotly figure
        plotly_params = {
            'data_frame': df,
            'x': cat if is_vertical else y_axis,
            'y': y_axis if is_vertical else cat,
            'orientation': plotly_orient,
            'title': plot_title,
            'color_discrete_sequence': MODERN_COLORS,
        }
        if hue_param:
            plotly_params['color'] = hue_param

        fig_plotly = px.box(**plotly_params)
        apply_modern_theme(fig_plotly, title=plot_title)

        # Serialize the Plotly figure to JSON and append to the list
        plotly_figs.append(json.loads(fig_plotly.to_json()))

    # Prepare the JSON response with separate lists for PNGs, SVGs, and Plotly figures
    response_data = {
        'png': png_list,        # List of base64-encoded PNG images
        'svg': svg_list,        # List of SVG image strings
        'plotly': plotly_figs,  # List of serialized Plotly figures
    }

    return JsonResponse(response_data)
