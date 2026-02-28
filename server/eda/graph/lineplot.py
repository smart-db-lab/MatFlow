import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from django.http import JsonResponse
import plotly.express as px
import json
import pandas as pd
import scipy.stats as stats
import plotly.graph_objects as go
from .plotly_theme import apply_modern_theme, MODERN_COLORS

def lineplot(df, data):
    # Extract parameters with defaults
    x_axes = data.get('x_var')
    y_axis = data.get('y_var')
    hue = data.get('hue')
    style = data.get('style')
    legend = data.get('legend', True)
    title = data.get('title', '')
    color_palette = data.get('color_palette', 'husl')  # Default palette
    ci_percent = data.get('ci_percent', 95)  # Default confidence interval

    # Ensure x_axes is a list
    if not isinstance(x_axes, list):
        x_axes = [x_axes]

    # Handle hue parameter
    hue_param = None if hue in [None, "-"] else hue

    # Initialize lists for images and Plotly figures
    png_list = []
    svg_list = []
    plotly_figs = []

    # Determine whether to show confidence intervals
    show_ci = ci_percent != 0

    # Function to compute mean and confidence interval
    def compute_ci(group):
        n = group[y_axis].count()
        mean = group[y_axis].mean()
        sem = stats.sem(group[y_axis], nan_policy='omit')
        h = sem * stats.t.ppf((1 + ci_percent / 100) / 2., n - 1) if n > 1 else 0
        return pd.Series({'mean': mean, 'lower': mean - h, 'upper': mean + h})

    # Helper function to convert hex color to RGBA
    def hex_to_rgba(hex_color, alpha=1.0):
        hex_color = hex_color.lstrip('#')
        rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        return f'rgba({rgb[0]}, {rgb[1]}, {rgb[2]}, {alpha})'

    # Matplotlib/Seaborn plots
    for x_axis in x_axes:
        fig, ax = plt.subplots(figsize=(6, 6))
        plot_title = title or f"Line Plot of {y_axis} vs {x_axis}"
        ax.set_title(plot_title)

        sns.lineplot(
            data=df,
            x=x_axis,
            y=y_axis,
            hue=hue_param,
            palette=color_palette
        )

        plt.tight_layout()

        # Save figure to PNG buffer
        buf_png = io.BytesIO()
        fig.savefig(buf_png, format='png', bbox_inches='tight')
        buf_png.seek(0)
        png_list.append(base64.b64encode(buf_png.getvalue()).decode('utf-8'))

        # Save figure to SVG buffer
        buf_svg = io.BytesIO()
        fig.savefig(buf_svg, format='svg', bbox_inches='tight')
        buf_svg.seek(0)
        svg_list.append(buf_svg.getvalue().decode('utf-8'))

        plt.close(fig)

    # Plotly plots
    for x_axis in x_axes:
        if hue_param:
            summary = df.groupby([x_axis, hue_param]).apply(compute_ci).reset_index()
        else:
            summary = df.groupby(x_axis).apply(compute_ci).reset_index()

        fig_plotly = go.Figure()

        # Prepare colors
        color_sequence = MODERN_COLORS

        if hue_param:
            unique_hues = summary[hue_param].unique()
            color_map = {str(hue): color_sequence[i % len(color_sequence)] for i, hue in enumerate(unique_hues)}

            for name, group in summary.groupby(hue_param):
                color = color_map[str(name)]
                fig_plotly.add_trace(go.Scatter(
                    x=group[x_axis],
                    y=group['mean'],
                    mode='lines',
                    name=str(name),
                    line_shape='linear',
                    line=dict(color=color)
                ))
                if show_ci:
                    fig_plotly.add_trace(go.Scatter(
                        x=pd.concat([group[x_axis], group[x_axis][::-1]]),
                        y=pd.concat([group['upper'], group['lower'][::-1]]),
                        fill='toself',
                        fillcolor=hex_to_rgba(color, alpha=0.2),
                        line=dict(color='rgba(255,255,255,0)'),
                        hoverinfo="skip",
                        showlegend=False,
                        name=str(name) + ' CI'
                    ))
        else:
            color = color_sequence[0]
            fig_plotly.add_trace(go.Scatter(
                x=summary[x_axis],
                y=summary['mean'],
                mode='lines',
                name=y_axis,
                line_shape='linear',
                line=dict(color=color)
            ))
            if show_ci:
                fig_plotly.add_trace(go.Scatter(
                    x=pd.concat([summary[x_axis], summary[x_axis][::-1]]),
                    y=pd.concat([summary['upper'], summary['lower'][::-1]]),
                    fill='toself',
                    fillcolor=hex_to_rgba(color, alpha=0.2),
                    line=dict(color='rgba(255,255,255,0)'),
                    hoverinfo="skip",
                    showlegend=False,
                    name='CI'
                ))

        plot_title = title or f'Line Plot of {y_axis} over {x_axis}'
        fig_plotly.update_layout(
            xaxis_title=x_axis,
            yaxis_title=y_axis,
            hovermode='x unified',
        )
        apply_modern_theme(fig_plotly, title=plot_title)

        plotly_figs.append(json.loads(fig_plotly.to_json()))

    # Prepare the JSON response
    response_data = {
        'png': png_list,        # List of base64-encoded PNG images
        'svg': svg_list,        # List of SVG image strings
        'plotly': plotly_figs   # List of serialized Plotly figures
    }
    return JsonResponse(response_data)
