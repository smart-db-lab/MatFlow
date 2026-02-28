import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from django.http import JsonResponse
import plotly.express as px
import json
import pandas as pd
from .plotly_theme import apply_modern_theme, MODERN_COLORS


def violinplot(df, data):
    # Extract parameters with defaults
    x_axes = data.get('cat')
    y_axis = data.get('num')
    hue = data.get('hue')
    orient = data.get('orient', 'Vertical')
    title = data.get('title', '')

    # Handle "-" as None for x_axes and hue
    x_axes = None if x_axes == '-' else x_axes
    hue_param = None if hue in [None, "-"] else hue

    # Ensure x_axes is a list
    if not isinstance(x_axes, list):
        x_axes = [x_axes]

    # Initialize lists to store plots
    png_list = []
    svg_list = []
    plotly_figs = []

    # Matplotlib/Seaborn violin plots
    for x_axis in x_axes:
        fig, ax = plt.subplots(figsize=(6, 6))
        plot_title = title or f"Violin Plot of {y_axis} by {x_axis or 'None'}"
        ax.set_title(plot_title)

        sns.violinplot(
            x=x_axis if orient == "Vertical" else y_axis,
            y=y_axis if orient == "Vertical" else x_axis,
            hue=hue_param,
            data=df,
            split=True if hue_param else False,
            orient='v' if orient == "Vertical" else 'h',
            ax=ax
        )

        # Adjust legend if hue is used
        if hue_param:
            ax.legend(title=hue_param, bbox_to_anchor=(1.05, 1), loc='upper left')
        else:
            ax.legend().remove()

        plt.tight_layout()

        # Save to PNG
        buf_png = io.BytesIO()
        fig.savefig(buf_png, format='png', bbox_inches='tight')
        buf_png.seek(0)
        png_list.append(base64.b64encode(buf_png.getvalue()).decode('utf-8'))

        # Save to SVG
        buf_svg = io.BytesIO()
        fig.savefig(buf_svg, format='svg', bbox_inches='tight')
        buf_svg.seek(0)
        svg_list.append(buf_svg.getvalue().decode('utf-8'))

        # Close the figure
        plt.close(fig)

    # Plotly violin plots
    for x_axis in x_axes:
        plot_title = f"Violin Plot of {y_axis}" + (f" by {x_axis}" if x_axis else '')

        fig_plotly = px.violin(
            data_frame=df,
            x=x_axis if orient == "Vertical" else y_axis,
            y=y_axis if orient == "Vertical" else x_axis,
            color=hue_param,
            color_discrete_sequence=MODERN_COLORS,
            box=True,
            title=plot_title,
        )
        apply_modern_theme(fig_plotly, title=plot_title)
        fig_plotly.update_layout(showlegend=bool(hue_param))

        plotly_figs.append(json.loads(fig_plotly.to_json()))

    # Prepare JSON response
    response_data = {
        'png': png_list,        # List of base64-encoded PNG images
        'svg': svg_list,        # List of SVG image strings
        'plotly': plotly_figs,  # List of serialized Plotly figures
    }

    return JsonResponse(response_data)
