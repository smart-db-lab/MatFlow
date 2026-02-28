import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from django.http import JsonResponse
import plotly.express as px
import json
from .plotly_theme import apply_modern_theme, MODERN_COLORS

def scatterplot(df, data):
    # Extract parameters with defaults
    x_axes = data.get('x_var')
    y_axis = data.get('y_var')
    hue = data.get('hue')
    title = data.get('title', '')

    # Ensure x_axes is a list
    if not isinstance(x_axes, list):
        x_axes = [x_axes]

    # Handle hue parameter
    hue_param = None if hue in [None, "-"] else hue

    # Initialize lists to store plots
    png_list = []
    svg_list = []
    plotly_figs = []

    # Matplotlib/Seaborn scatter plots
    for x_axis in x_axes:
        fig, ax = plt.subplots(figsize=(6, 6))
        plot_title = title or f"Scatter Plot of {y_axis} vs {x_axis}"
        ax.set_title(plot_title)

        sns.scatterplot(
            data=df,
            x=x_axis,
            y=y_axis,
            hue=hue_param,
            palette='viridis',
            sizes=(20, 200),
            alpha=0.7,
            ax=ax
        )

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

    # Plotly scatter plots
    for x_axis in x_axes:
        plot_title = title or f"Scatter Plot of {y_axis} vs {x_axis}"
        fig_plotly = px.scatter(
            data_frame=df,
            x=x_axis,
            y=y_axis,
            color=hue_param,
            color_continuous_scale='Viridis',
            color_discrete_sequence=MODERN_COLORS,
            size_max=20,
            opacity=0.75,
            title=plot_title,
        )
        apply_modern_theme(fig_plotly, title=plot_title)

        plotly_figs.append(json.loads(fig_plotly.to_json()))

    # Prepare JSON response
    response_data = {
        'png': png_list,        # List of base64-encoded PNG images
        'svg': svg_list,        # List of SVG image strings
        'plotly': plotly_figs,  # List of serialized Plotly figures
    }

    return JsonResponse(response_data)
