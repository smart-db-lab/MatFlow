# views.py

import base64
import io

import matplotlib.pyplot as plt
import plotly.graph_objects as go
from django.http import JsonResponse
from matplotlib_venn import venn2, venn3
from matplotlib.patches import Patch
from .plotly_theme import MODERN_COLORS


def venn_diagram(df, data):
    try:
        # Get feature groups from request data with defaults
        feature_groups = data.get("feature_groups", [
            {
                "pattern": "Bond Chain-",
                "short_name": "C",
                "display_name": "Bond Chain Related Features",
                "method": "starts_with"
            },
            {
                "pattern": "Rdkit Descriptor",
                "short_name": "G", 
                "display_name": "RDKit Global Descriptors",
                "method": "starts_with"
            },
            {
                "pattern": "Rdkit Descriptor Fr",
                "short_name": "F",
                "display_name": "RDKit Functional Group Descriptors", 
                "method": "starts_with"
            }
        ])
        
        fig_width = int(data.get("fig_width", 8))

        
        # Get all column names
        columns = df.columns.tolist()
        
        # === Initialize Feature Sets (Dynamic based on user input) ===
        set_1 = set()  # First group
        set_2 = set()  # Second group  
        set_3 = set()  # Third group
        
        # Extract labels and short names from request
        labels = []
        short_names = []
        
        for group in feature_groups:
            short_name = group.get("short_name", "")
            display_name = group.get("display_name", "")
            labels.append(display_name)
            short_names.append(short_name)
        
        # Get user input patterns and methods
        pattern_1 = feature_groups[0].get("pattern", "")
        method_1 = feature_groups[0].get("method", "starts_with")
        
        pattern_2 = feature_groups[1].get("pattern", "")
        method_2 = feature_groups[1].get("method", "starts_with")
        
        pattern_3 = feature_groups[2].get("pattern", "")
        method_3 = feature_groups[2].get("method", "starts_with")
        
        # Helper function to check if column matches pattern
        def matches_pattern(col, pattern, method):
            if method == "starts_with":
                return col.startswith(pattern)
            elif method == "ends_with":
                return col.endswith(pattern)
            elif method == "contains":
                return pattern in col
            elif method == "exact_match":
                return col == pattern
            return False
        
        # === Dynamic Feature Assignment (EXACT NOTEBOOK LOGIC with user patterns) ===
        for col in df.columns:
            # First, check Group 1 pattern (like 'Bond Chain-')
            if matches_pattern(col, pattern_1, method_1):
                set_1.add(col)
                
                # Now check if this Group 1 feature also matches other patterns
                # This creates the overlapping behavior from your notebook
                # Use 'contains' logic for overlaps regardless of method
                if pattern_3 in col:  # Like 'Rdkit Descriptor Fr' in col
                    set_3.add(col)
                elif pattern_2 in col:  # Like 'Rdkit Descriptor' in col
                    set_2.add(col)
            
            # Independent check for Group 3 pattern (like 'Rdkit Descriptor Fr')
            if matches_pattern(col, pattern_3, method_3):
                set_3.add(col)
            
            # Independent check for Group 2 pattern (like 'Rdkit Descriptor' but not Fr)
            # This needs special handling to exclude Group 3 patterns
            if matches_pattern(col, pattern_2, method_2) and pattern_3 not in col:
                set_2.add(col)
        
        # Create the feature sets in order
        feature_sets = [set_1, set_2, set_3]
        
        # Ensure we have exactly 3 sets
        if len(feature_sets) != 3:
            return JsonResponse({
                "error": f"Expected 3 feature groups, got {len(feature_sets)}"
            }, status=400)
        
        # Extract the three sets (dynamic based on user input)
        set_1, set_2, set_3 = feature_sets

        # Calculate overlaps dynamically
        overlap_12 = len(set_1 & set_2)
        overlap_13 = len(set_1 & set_3)
        overlap_23 = len(set_2 & set_3)
        overlap_all_three = len(set_1 & set_2 & set_3)
        
        # Calculate exclusive regions (for proper Venn diagram display)
        set_1_only = len(set_1 - set_2 - set_3)
        set_2_only = len(set_2 - set_1 - set_3)
        set_3_only = len(set_3 - set_1 - set_2)
        overlap_12_only = len(set_1 & set_2 - set_3)
        overlap_13_only = len(set_1 & set_3 - set_2)
        overlap_23_only = len(set_2 & set_3 - set_1)
        
        # ── Render Matplotlib Venn Diagram
        fig, ax = plt.subplots(figsize=(fig_width, 6))

        # Create the Venn Diagram with Updated Labels (using short names)
        venn_diagram_plot = venn3(
            feature_sets,
            set_labels=(short_names[0], short_names[1], short_names[2]),
            ax=ax
        )

        # Update the actual Venn labels inside the corresponding areas
        if venn_diagram_plot.get_label_by_id('110'):
            venn_diagram_plot.get_label_by_id('110').set_text(f'{short_names[0]} ∩ {short_names[1]}\n{overlap_12}')
        if venn_diagram_plot.get_label_by_id('101'):
            venn_diagram_plot.get_label_by_id('101').set_text(f'{short_names[0]} ∩ {short_names[2]}\n{overlap_13}')
        if venn_diagram_plot.get_label_by_id('011'):
            venn_diagram_plot.get_label_by_id('011').set_text(f'{short_names[1]} ∩ {short_names[2]}\n{overlap_23}')
        if venn_diagram_plot.get_label_by_id('111') and overlap_all_three > 0:
            venn_diagram_plot.get_label_by_id('111').set_text(f'{short_names[0]} ∩ {short_names[1]} ∩ {short_names[2]}\n{overlap_all_three}')

        # Add external legend for full names
        legend_elements = [
            Patch(facecolor='lightcoral', edgecolor='black', label=f'{short_names[0]}: {labels[0]}'),
            Patch(facecolor='lightgreen', edgecolor='black', label=f'{short_names[1]}: {labels[1]}'),
            Patch(facecolor='lightskyblue', edgecolor='black', label=f'{short_names[2]}: {labels[2]}')
        ]

        # Add legend with tight layout adjustment
        plt.legend(handles=legend_elements, loc='lower center', bbox_to_anchor=(0.5, -0.25),
                  ncol=1, frameon=True, fontsize=10, title='Feature Groups', title_fontsize=11)

        # Tight layout and adjust spacing
        plt.tight_layout(pad=1.0)
        plt.subplots_adjust(top=0.85, bottom=0.25)

        # Save PNG (base64)
        buf_png = io.BytesIO()
        fig.savefig(buf_png, format="png", dpi=300, bbox_inches="tight")
        buf_png.seek(0)
        png_base64 = base64.b64encode(buf_png.read()).decode("utf-8")

        # Save SVG (string)
        buf_svg = io.BytesIO()
        fig.savefig(buf_svg, format="svg", bbox_inches="tight")
        buf_svg.seek(0)
        svg_string = buf_svg.read().decode("utf-8")

        plt.close(fig)

        # Create plotly version
        plotly_fig = make_plotly_venn(feature_sets, short_names, labels)

        # Prepare statistics for response (matching notebook output format)
        statistics = {
            "total_features": len(df.columns),
            "feature_counts": {
                f"{labels[0]} ({short_names[0]})": len(set_1),
                f"{labels[1]} ({short_names[1]})": len(set_2), 
                f"{labels[2]} ({short_names[2]})": len(set_3)
            },
            "overlaps": {
                f"{short_names[0]} ∩ {short_names[1]}": overlap_12,
                f"{short_names[0]} ∩ {short_names[2]}": overlap_13,
                f"{short_names[1]} ∩ {short_names[2]}": overlap_23,
                f"{short_names[0]} ∩ {short_names[1]} ∩ {short_names[2]} (All three)": overlap_all_three
            },
            "exclusive_regions": {
                f"{short_names[0]} only": set_1_only,
                f"{short_names[1]} only": set_2_only,
                f"{short_names[2]} only": set_3_only,
                f"{short_names[0]} ∩ {short_names[1]} only": overlap_12_only,
                f"{short_names[0]} ∩ {short_names[2]} only": overlap_13_only,
                f"{short_names[1]} ∩ {short_names[2]} only": overlap_23_only
            }
        }

        # Return as JSON
        return JsonResponse({
            "png": [png_base64],
            "svg": [svg_string],
            "plotly": [plotly_fig.to_dict()],
            "statistics": statistics
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


import plotly.graph_objects as go


def make_plotly_venn(sets, short_names, display_names):
    # Define colors and styling (using modern palette)
    colors = [MODERN_COLORS[0], MODERN_COLORS[2], MODERN_COLORS[5]]  # Indigo, Emerald, Cyan
    font_color = '#374151'
    opacity = 0.5
    line_width = 2

    layout = go.Layout(
        showlegend=True,
        legend=dict(
            x=0.5,
            y=-0.15,
            xanchor='center',
            yanchor='top',
            bgcolor='rgba(255, 255, 255, 0.9)',
            bordercolor='rgba(0, 0, 0, 0.3)',
            borderwidth=1,
            font=dict(size=13),
            orientation='v',
            itemsizing='constant'
        ),
        xaxis=dict(
            showticklabels=False,
            zeroline=False,
            showgrid=False,
            range=[0, 6],  # Expanded range for better spacing
            scaleanchor="y",
            scaleratio=1
        ),
        yaxis=dict(
            showticklabels=False,
            zeroline=False,
            showgrid=False,
            range=[0, 6]
        ),
        height=750,  # Increased height to accommodate legend
        width=600,
        margin=dict(l=20, r=20, b=120, t=20),  # Increased bottom margin for legend
        plot_bgcolor='white',
        shapes=[],
        annotations=[],
        hovermode=False
    )

    fig = go.Figure(layout=layout)

    if len(sets) == 2:
        A, B = sets
        a = len(A - B)
        b = len(B - A)
        ab = len(A & B)

        # Position circles with overlap
        fig.add_shape(
            type="circle",
            xref="x", yref="y",
            x0=1.0, y0=1.5, x1=3.5, y1=4.0,
            line_color=colors[0],
            fillcolor=colors[0],
            opacity=opacity,
            line_width=line_width
        )
        fig.add_shape(
            type="circle",
            xref="x", yref="y",
            x0=2.5, y0=1.5, x1=5.0, y1=4.0,
            line_color=colors[1],
            fillcolor=colors[1],
            opacity=opacity,
            line_width=line_width
        )

        # Annotate counts with better positioning and intersection labels
        fig.add_annotation(
            x=1.8, y=2.8,
            text=f"<b>{a}</b>",
            showarrow=False,
            font=dict(size=16, color=font_color)
        )
        fig.add_annotation(
            x=4.2, y=2.8,
            text=f"<b>{b}</b>",
            showarrow=False,
            font=dict(size=16, color=font_color)
        )
        # Intersection with label
        fig.add_annotation(
            x=3.0, y=2.8,
            text=f"<b>{short_names[0]} ∩ {short_names[1]}<br>{ab}</b>",
            showarrow=False,
            font=dict(size=14, color=font_color)
        )

        # Labels with better positioning and styling
        fig.add_annotation(
            x=2.0, y=4.2,
            text=f"<b>{short_names[0]}</b>",
            showarrow=False,
            font=dict(size=16, color=colors[0])
        )
        fig.add_annotation(
            x=4.0, y=4.2,
            text=f"<b>{short_names[1]}</b>",
            showarrow=False,
            font=dict(size=16, color=colors[1])
        )

    elif len(sets) == 3:
        A, B, C = sets
        a = len(A - B - C)
        b = len(B - A - C)
        c = len(C - A - B)
        ab = len(A & B - C)
        ac = len(A & C - B)
        bc = len(B & C - A)
        abc = len(A & B & C)

        # Position three circles symmetrically
        fig.add_shape(
            type="circle",
            x0=1.0, y0=2.0, x1=3.5, y1=4.5,
            line_color=colors[0],
            fillcolor=colors[0],
            opacity=opacity,
            line_width=line_width
        )
        fig.add_shape(
            type="circle",
            x0=2.5, y0=2.0, x1=5.0, y1=4.5,
            line_color=colors[1],
            fillcolor=colors[1],
            opacity=opacity,
            line_width=line_width
        )
        fig.add_shape(
            type="circle",
            x0=1.75, y0=0.5, x1=4.25, y1=3.0,
            line_color=colors[2],
            fillcolor=colors[2],
            opacity=opacity,
            line_width=line_width
        )

        # Annotate all areas with better positioning and intersection labels
        fig.add_annotation(
            x=1.5, y=3.8,
            text=f"<b>{a}</b>",
            showarrow=False,
            font=dict(size=14, color=font_color)
        )
        fig.add_annotation(
            x=4.0, y=3.8,
            text=f"<b>{b}</b>",
            showarrow=False,
            font=dict(size=14, color=font_color)
        )
        fig.add_annotation(
            x=3.0, y=1.0,
            text=f"<b>{c}</b>",
            showarrow=False,
            font=dict(size=14, color=font_color)
        )

        # Intersection annotations with labels
        fig.add_annotation(
            x=2.8, y=3.5,
            text=f"<b>{short_names[0]} ∩ {short_names[1]}<br>{ab}</b>",
            showarrow=False,
            font=dict(size=12, color=font_color)
        )
        fig.add_annotation(
            x=2.0, y=2.5,
            text=f"<b>{short_names[0]} ∩ {short_names[2]}<br>{ac}</b>",
            showarrow=False,
            font=dict(size=12, color=font_color)
        )
        fig.add_annotation(
            x=3.5, y=2.5,
            text=f"<b>{short_names[1]} ∩ {short_names[2]}<br>{bc}</b>",
            showarrow=False,
            font=dict(size=12, color=font_color)
        )

        # All three intersection
        if abc > 0:
            fig.add_annotation(
                x=3.0, y=2.8,
                text=f"<b>{short_names[0]} ∩ {short_names[1]} ∩ {short_names[2]}<br>{abc}</b>",
                showarrow=False,
                font=dict(size=11, color=font_color)
            )

        # Labels with better positioning
        fig.add_annotation(
            x=1.8, y=4.7,
            text=f"<b>{short_names[0]}</b>",
            showarrow=False,
            font=dict(size=14, color=colors[0])
        )
        fig.add_annotation(
            x=4.2, y=4.7,
            text=f"<b>{short_names[1]}</b>",
            showarrow=False,
            font=dict(size=14, color=colors[1])
        )
        fig.add_annotation(
            x=3.0, y=0.2,
            text=f"<b>{short_names[2]}</b>",
            showarrow=False,
            font=dict(size=14, color=colors[2])
        )

    # Adjust layout slightly based on number of sets
    if len(sets) == 2:
        fig.update_layout(xaxis_range=[0, 6], yaxis_range=[0, 5])
    else:
        fig.update_layout(xaxis_range=[0, 6], yaxis_range=[0, 6])

    # Add invisible traces for legend using display names
    for i, (display_name, color) in enumerate(zip(display_names, colors)):
        fig.add_trace(go.Scatter(
            x=[None], y=[None],
            mode='markers',
            marker=dict(size=12, color=color, opacity=1.0, line=dict(width=1, color='black')),
            name=f"{short_names[i]}: {display_name}",
            showlegend=True,
            hoverinfo='skip',
            visible='legendonly'
        ))

    return fig