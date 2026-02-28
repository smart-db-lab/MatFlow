import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from django.http import JsonResponse
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
import pandas as pd
from .plotly_theme import apply_modern_theme, MODERN_COLORS

def customplot(df, data):
    """
    Generates custom plots (Line and Scatter) based on the provided data and returns
    separate PNG, SVG, and Plotly representations for each plot.

    Args:
        df (pd.DataFrame): The DataFrame containing the data.
        data (dict): A dictionary containing plot parameters.

    Returns:
        JsonResponse: A JSON response containing lists of PNGs, SVGs, and Plotly figures.
    """
    # Extract parameters
    xs = data.get('x_var')  # This can be a list
    y = data.get('y_var')
    hue = data.get('hue')
    color_palette = data.get('color_palette', 'husl')  # Default palette

    # Ensure xs is a list
    if not isinstance(xs, list):
        xs = [xs]

    hue_param = None if hue == "None" else hue

    # Initialize lists to hold image data and Plotly figures
    png_list = []
    svg_list = []
    plotly_figs = []

    # Determine unique hue categories if hue is used
    if hue_param:
        hue_categories = sorted(df[hue_param].unique())
        num_categories = len(hue_categories)

        # Choose a palette based on the selected palette and number of categories
        if color_palette == "husl":
            palette = sns.color_palette("husl", n_colors=num_categories)
        elif color_palette == "tab10":
            palette = sns.color_palette("tab10", n_colors=num_categories)
        elif color_palette == "tab20":
            palette = sns.color_palette("tab20", n_colors=num_categories)
        elif color_palette == "Set2":
            palette = sns.color_palette("Set2", n_colors=num_categories)
        else:
            # Fallback to husl if an unknown palette is provided
            palette = sns.color_palette("husl", n_colors=num_categories)

        palette_hex = palette.as_hex()
        hue_color_mapping = dict(zip(hue_categories, palette_hex))
    else:
        hue_color_mapping = {}

    # Iterate over each x_var to generate plots
    for x in xs:
        # --------------------
        # **Plotly Plots**
        # --------------------
        # Create separate Plotly figures for Line and Scatter plots

        # **Line Plot**
        line_title = data.get('title', f"Line Plot of {y} vs {x}")
        if hue_param:
            fig_line = go.Figure()
            for i, label in enumerate(hue_categories):
                hue_data = df[df[hue_param] == label]
                fig_line.add_trace(
                    go.Scatter(
                        x=hue_data[x],
                        y=hue_data[y],
                        mode='lines',
                        name=f"{x} {label}",
                        line=dict(color=MODERN_COLORS[i % len(MODERN_COLORS)], width=2.5)
                    )
                )
        else:
            fig_line = go.Figure(
                data=[
                    go.Scatter(
                        x=df[x],
                        y=df[y],
                        mode='lines',
                        name=x,
                        line=dict(color=MODERN_COLORS[0], width=2.5)
                    )
                ]
            )

        # Update layout for Line Plot
        fig_line.update_layout(
            xaxis_title=x,
            yaxis_title=y,
            showlegend=True,
        )
        apply_modern_theme(fig_line, title=line_title)

        # Serialize Plotly Line Plot to JSON
        plotly_figs.append(json.loads(fig_line.to_json()))

        # **Scatter Plot**
        scatter_title = data.get('title', f"Scatter Plot of {y} vs {x}")
        if hue_param:
            fig_scatter = go.Figure()
            for i, label in enumerate(hue_categories):
                hue_data = df[df[hue_param] == label]
                fig_scatter.add_trace(
                    go.Scatter(
                        x=hue_data[x],
                        y=hue_data[y],
                        mode='markers',
                        name=f"{x} {label}",
                        marker=dict(color=MODERN_COLORS[i % len(MODERN_COLORS)], size=8)
                    )
                )
        else:
            fig_scatter = go.Figure(
                data=[
                    go.Scatter(
                        x=df[x],
                        y=df[y],
                        mode='markers',
                        name=x,
                        marker=dict(color=MODERN_COLORS[0], size=8)
                    )
                ]
            )

        # Update layout for Scatter Plot
        fig_scatter.update_layout(
            xaxis_title=x,
            yaxis_title=y,
            showlegend=True,
        )
        apply_modern_theme(fig_scatter, title=scatter_title)

        # Serialize Plotly Scatter Plot to JSON
        plotly_figs.append(json.loads(fig_scatter.to_json()))

        # --------------------
        # **Seaborn/Matplotlib Plots**
        # --------------------
        # Create separate figures for Line and Scatter plots

        # **Line Plot**
        fig_matplotlib_line, ax_line = plt.subplots(figsize=(6, 6), dpi=720)

        if data.get('title'):
            ax_line.set_title(data['title'])
        else:
            ax_line.set_title(f"Line Plot of {y} vs {x}")

        if hue_param:
            sns.lineplot(
                data=df,
                x=x,
                y=y,
                hue=hue_param,
                palette=hue_color_mapping,
                ax=ax_line,
                linewidth=2.5
            )
            ax_line.legend_.remove()  # Remove individual legends to prevent repetition
        else:
            sns.lineplot(
                data=df,
                x=x,
                y=y,
                color='blue',
                ax=ax_line,
                linewidth=2.5,
                label=x
            )
            ax_line.legend_.remove()

        # Save Line Plot to PNG
        image_stream_png_line = io.BytesIO()
        fig_matplotlib_line.savefig(image_stream_png_line, format='png', bbox_inches='tight')
        image_stream_png_line.seek(0)
        image_base64_png_line = base64.b64encode(image_stream_png_line.getvalue()).decode('utf-8')
        png_list.append(image_base64_png_line)

        # Save Line Plot to SVG
        image_stream_svg_line = io.BytesIO()
        fig_matplotlib_line.savefig(image_stream_svg_line, format='svg', bbox_inches='tight')
        image_stream_svg_line.seek(0)
        image_svg_line = image_stream_svg_line.getvalue().decode('utf-8')
        svg_list.append(image_svg_line)

        plt.close(fig_matplotlib_line)

        # **Scatter Plot**
        fig_matplotlib_scatter, ax_scatter = plt.subplots(figsize=(6, 6), dpi=720)

        if data.get('title'):
            ax_scatter.set_title(data['title'])
        else:
            ax_scatter.set_title(f"Scatter Plot of {y} vs {x}")

        if hue_param:
            sns.scatterplot(
                data=df,
                x=x,
                y=y,
                hue=hue_param,
                palette=hue_color_mapping,
                ax=ax_scatter,
                s=50
            )
            ax_scatter.legend_.remove()  # Remove individual legends to prevent repetition
        else:
            sns.scatterplot(
                data=df,
                x=x,
                y=y,
                color='blue',
                ax=ax_scatter,
                s=50,
                label=x
            )
            ax_scatter.legend_.remove()

        # Save Scatter Plot to PNG
        image_stream_png_scatter = io.BytesIO()
        fig_matplotlib_scatter.savefig(image_stream_png_scatter, format='png', bbox_inches='tight')
        image_stream_png_scatter.seek(0)
        image_base64_png_scatter = base64.b64encode(image_stream_png_scatter.getvalue()).decode('utf-8')
        png_list.append(image_base64_png_scatter)

        # Save Scatter Plot to SVG
        image_stream_svg_scatter = io.BytesIO()
        fig_matplotlib_scatter.savefig(image_stream_svg_scatter, format='svg', bbox_inches='tight')
        image_stream_svg_scatter.seek(0)
        image_svg_scatter = image_stream_svg_scatter.getvalue().decode('utf-8')
        svg_list.append(image_svg_scatter)

        plt.close(fig_matplotlib_scatter)

    # Prepare the JSON response with separate lists for PNGs, SVGs, and Plotly figures
    response_data = {
        'png': png_list,        # List of base64-encoded PNG images (Line and Scatter plots)
        'svg': svg_list,        # List of SVG image strings (Line and Scatter plots)
        'plotly': plotly_figs,  # List of serialized Plotly figures (Line and Scatter plots)
    }

    return JsonResponse(response_data)
