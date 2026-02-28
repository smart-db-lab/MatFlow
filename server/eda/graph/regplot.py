import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from django.http import JsonResponse
import plotly.express as px
import json
from .plotly_theme import apply_modern_theme, MODERN_COLORS


def regplot(df, data):
    # Extract parameters with defaults
    x_axes = data.get('x_var')
    y_axis = data.get('y_var')
    title = data.get('title', '')
    hue = data.get('hue')

    # Ensure x_axes is a list
    if not isinstance(x_axes, list):
        x_axes = [x_axes]

    # Handle hue parameter
    hue_param = None if hue in [None, "-"] else hue

    # Initialize lists to store plots
    plotly_figs = []
    png_list = []
    svg_list = []

    for x_axis in x_axes:
        # Plotly regression plot
        plot_title = title or f'Regression Plot of {y_axis} vs {x_axis}'
        fig_plotly = px.scatter(
            data_frame=df,
            x=x_axis,
            y=y_axis,
            color=hue_param,
            trendline='ols',
            color_discrete_sequence=MODERN_COLORS,
            trendline_color_override='#ef4444',
            title=plot_title,
            opacity=0.75,
        )
        apply_modern_theme(fig_plotly, title=plot_title)
        plotly_figs.append(json.loads(fig_plotly.to_json()))

        # Matplotlib/Seaborn regression plot
        fig, ax = plt.subplots(figsize=(6, 6))
        sns.regplot(
            x=x_axis,
            y=y_axis,
            scatter_kws={'alpha': 0.5},
            line_kws={'color': 'red'},
            data=df,
            ax=ax
        )
        ax.set_title(plot_title)
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

    # Prepare JSON response
    response_data = {
        'png': png_list,
        'svg': svg_list,
        'plotly': plotly_figs,
    }
    return JsonResponse(response_data)
