import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from django.http import JsonResponse
import plotly.express as px
import json
import pandas as pd
from .plotly_theme import apply_modern_theme, MODERN_COLORS

def countplot(df, data):
    try:
        # Extract parameters
        x_axes = data.get('cat')  # This can be a list
        title = data.get('title')
        hue = data.get('hue')
        orient = data.get('orient', 'Vertical')  # Default to 'Vertical' if not specified

        if not isinstance(x_axes, list):
            x_axes = [x_axes]

        hue_param = None if hue in [None, "-"] else hue

        png_list = []
        svg_list = []
        plotly_figs = []

        # Determine orientation
        is_vertical = orient == "Vertical"
        plotly_orient = 'v' if is_vertical else 'h'

        # Loop over each categorical variable
        for var in x_axes:
            # Set the title
            plot_title = title or f"Count Plot of {var}"

            # Matplotlib/Seaborn plot
            fig, ax = plt.subplots(figsize=(6, 6))
            ax.set_title(plot_title)

            # Create the countplot
            sns.countplot(
                data=df,
                x=var if is_vertical else None,
                y=None if is_vertical else var,
                hue=hue_param,
                ax=ax
            )

            plt.tight_layout()

            # Manage legend
            if hue_param:
                ax.legend(title=hue_param)
            else:
                ax.legend().remove()

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

            plt.close(fig)

            # Plotly figure
            plotly_params = {
                'data_frame': df,
                'title': plot_title,
                'barmode': 'group',
                'color_discrete_sequence': MODERN_COLORS,
                'orientation': plotly_orient,
            }

            if hue_param:
                plotly_params['color'] = hue_param

            if is_vertical:
                plotly_params['x'] = var
            else:
                plotly_params['y'] = var

            fig_plotly = px.bar(**plotly_params)
            apply_modern_theme(fig_plotly, title=plot_title)

            plotly_figs.append(json.loads(fig_plotly.to_json()))

        # Prepare the JSON response
        response_data = {
            'png': png_list,        # List of base64-encoded PNG images
            'svg': svg_list,        # List of SVG image strings
            'plotly': plotly_figs,  # List of serialized Plotly figures
        }
        return JsonResponse(response_data)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
