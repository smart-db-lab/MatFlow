import base64
import io
import matplotlib.pyplot as plt
import seaborn as sns
from django.http import JsonResponse
import plotly.express as px
import plotly.figure_factory as ff
import json
import pandas as pd
import logging
from .plotly_theme import apply_modern_theme, MODERN_COLORS

# Set up logging
logger = logging.getLogger(__name__)

def histogram(df, data):
    try:
        # Extract parameters with defaults
        nums = data.get('var')  # List or single variable
        title = data.get('title', '')
        orient = data.get('orient', 'Vertical')
        bins = data.get('bins', 20)
        kde = data.get('kde', False)

        # Ensure nums is a list
        if not isinstance(nums, list):
            nums = [nums]

        # Ensure bins is a positive integer
        bins = bins if isinstance(bins, int) and bins > 0 else 20

        # Convert kde and legend to booleans if they are strings
        if isinstance(kde, str):
            kde = kde.lower() == 'true'


        # Initialize lists to hold image data and Plotly figures
        png_list = []
        svg_list = []
        plotly_figs = []

        # Determine orientation
        is_vertical = orient == 'Vertical'
        plotly_orient = 'v' if is_vertical else 'h'

        # Iterate over variables to create Plotly figures
        for num in nums:
            logger.info(f"Creating Plotly histogram for variable: {num}")

            # Create Plotly histogram or distplot
            plot_title = title or f'Histogram of {num}'

            if kde:
                # Use create_distplot
                hist_data = [df[num].dropna()]
                group_labels = [num]
                bin_size = (df[num].max() - df[num].min()) / bins

                fig_plotly = ff.create_distplot(
                    hist_data, group_labels,
                    bin_size=bin_size,
                    show_hist=True,
                    show_rug=False,
                    colors=MODERN_COLORS,
                )

                # Orientation adjustment for KDE plots
                if not is_vertical:
                    for trace in fig_plotly.data:
                        x = trace.x
                        trace.x = trace.y
                        trace.y = x

            else:
                # Use px.histogram
                plotly_params = {
                    'data_frame': df,
                    'nbins': bins,
                    'color_discrete_sequence': MODERN_COLORS,
                    'title': plot_title,
                    'opacity': 0.85,
                }
                if is_vertical:
                    plotly_params['x'] = num
                else:
                    plotly_params['y'] = num

                fig_plotly = px.histogram(**plotly_params)

            # Apply modern theme
            apply_modern_theme(fig_plotly, title=plot_title)

            # Update traces with subtle bar outlines
            fig_plotly.update_traces(
                marker=dict(
                    line=dict(
                        width=1,
                        color='rgba(255,255,255,0.6)'
                    )
                )
            )

            # Serialize Plotly figure
            plotly_fig_serialized = json.loads(fig_plotly.to_json())
            plotly_figs.append(plotly_fig_serialized)
            logger.info(f"Successfully created Plotly figure for {num}")

        # Proceed with matplotlib/seaborn plots
        for num in nums:
            fig, ax = plt.subplots(figsize=(6, 6))
            plot_title = title or f'Histogram of {num}'
            ax.set_title(plot_title)

            sns_params = {
                'data': df,
                'bins': bins,
                'kde': kde,
                'ax': ax
            }
            if is_vertical:
                sns_params['x'] = num
            else:
                sns_params['y'] = num

            sns.histplot(**sns_params)

            plt.tight_layout()

            # Save the figure in both PNG and SVG formats
            buf_png = io.BytesIO()
            fig.savefig(buf_png, format='png', bbox_inches='tight')
            buf_png.seek(0)
            png_base64 = base64.b64encode(buf_png.getvalue()).decode('utf-8')
            png_list.append(png_base64)

            buf_svg = io.BytesIO()
            fig.savefig(buf_svg, format='svg', bbox_inches='tight')
            buf_svg.seek(0)
            svg_str = buf_svg.getvalue().decode('utf-8')
            svg_list.append(svg_str)

            plt.close(fig)

        # Return images and Plotly figures in the response
        response_data = {
            'png': png_list,       # List of base64-encoded PNG images
            'svg': svg_list,       # List of SVG image strings
            'plotly': plotly_figs  # List of serialized Plotly figures
        }
        return JsonResponse(response_data)

    except Exception as e:
        logger.error(f"Error in histogram: {e}")
        return JsonResponse({'error': str(e)}, status=500)
