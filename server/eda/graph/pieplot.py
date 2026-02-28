import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from django.http import JsonResponse
import plotly.express as px
import json
import pandas as pd
from .plotly_theme import apply_modern_theme, MODERN_COLORS

def pieplot(df, data):
    # Extract parameters with defaults
    x_axes = data.get('cat')
    title = data.get('title', '')

    # Ensure x_axes is a list
    if not isinstance(x_axes, list):
        x_axes = [x_axes]

    # Initialize lists to hold image data and Plotly figures
    png_list = []
    svg_list = []
    plotly_figs = []

    # Loop over each categorical variable
    for x_axis in x_axes:
        # Prepare data for plotting
        pie_counts = df[x_axis].value_counts().reset_index()
        pie_counts.columns = [x_axis, 'counts']

        # Set plot title
        plot_title = title or f'Pie Chart of {x_axis}'

        # Create Plotly pie chart
        fig_plotly = px.pie(
            data_frame=pie_counts,
            names=x_axis,
            values='counts',
            title=plot_title,
            color_discrete_sequence=MODERN_COLORS,
            hole=0.35,  # Modern donut style
        )
        fig_plotly.update_traces(
            textposition='inside',
            textinfo='percent+label',
            marker=dict(line=dict(color='#ffffff', width=2)),
        )
        apply_modern_theme(fig_plotly, title=plot_title)

        plotly_figs.append(json.loads(fig_plotly.to_json()))

        # Create Matplotlib pie chart
        fig, ax = plt.subplots(figsize=(6, 6))
        ax.pie(
            pie_counts['counts'],
            labels=pie_counts[x_axis],
            autopct='%1.1f%%',
            startangle=90,
            colors=sns.color_palette('pastel', len(pie_counts))
        )

        ax.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.
        ax.set_title(plot_title)

        plt.tight_layout()

        # Save the figure to a PNG buffer
        buf_png = io.BytesIO()
        fig.savefig(buf_png, format='png', bbox_inches='tight')
        buf_png.seek(0)
        png_base64 = base64.b64encode(buf_png.getvalue()).decode('utf-8')
        png_list.append(png_base64)

        # Save the figure to an SVG buffer
        buf_svg = io.BytesIO()
        fig.savefig(buf_svg, format='svg', bbox_inches='tight')
        buf_svg.seek(0)
        svg_str = buf_svg.getvalue().decode('utf-8')
        svg_list.append(svg_str)

        plt.close(fig)

    # Prepare the JSON response
    response_data = {
        'png': png_list,       # List of base64-encoded PNG images
        'svg': svg_list,       # List of SVG image strings
        'plotly': plotly_figs  # List of serialized Plotly figures
    }
    return JsonResponse(response_data)
