"""
Shared modern Plotly theme for all EDA graph modules.

Usage:
    from .plotly_theme import apply_modern_theme, MODERN_COLORS

    fig = px.bar(...)
    apply_modern_theme(fig, title="My Title")
"""

# ── Soft, vibrant color palette (Chart.js-inspired) ──
MODERN_COLORS = [
    "#ff6384",  # Soft Pink
    "#36a2eb",  # Sky Blue
    "#ffce56",  # Warm Yellow
    "#4bc0c0",  # Teal
    "#9966ff",  # Soft Purple
    "#ff9f40",  # Orange
    "#c9cbcf",  # Light Grey
    "#7dd3fc",  # Light Blue
    "#f0abfc",  # Lavender Pink
    "#6ee7b7",  # Mint Green
]

FONT_STACK = "Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"


def apply_modern_theme(fig, title=None):
    """
    Apply a modern, clean theme to any Plotly figure.

    This updates the figure's layout in-place and returns the figure
    for optional chaining.

    Parameters
    ----------
    fig : plotly.graph_objects.Figure
        The Plotly figure to style.
    title : str, optional
        Override the figure's title text.

    Returns
    -------
    fig : plotly.graph_objects.Figure
    """
    fig.update_layout(
        # ── Typography ──
        font=dict(
            family=FONT_STACK,
            size=13,
            color="#4b5563",
        ),
        # ── Backgrounds ──
        plot_bgcolor="#ffffff",
        paper_bgcolor="#ffffff",
        # ── Color palette ──
        colorway=MODERN_COLORS,
        # ── Axes ──
        xaxis=dict(
            gridcolor="rgba(0,0,0,0.06)",
            gridwidth=1,
            linecolor="rgba(0,0,0,0.08)",
            linewidth=1,
            zeroline=False,
            showline=True,
            automargin=True,
            tickfont=dict(size=12, color="#1f2937", family=FONT_STACK),
            title_font=dict(size=14, color="#111827", family=FONT_STACK),
        ),
        yaxis=dict(
            gridcolor="rgba(0,0,0,0.06)",
            gridwidth=1,
            linecolor="rgba(0,0,0,0.08)",
            linewidth=1,
            zeroline=False,
            showline=True,
            automargin=True,
            tickfont=dict(size=12, color="#1f2937", family=FONT_STACK),
            title_font=dict(size=14, color="#111827", family=FONT_STACK),
        ),
        # ── Hover ──
        hoverlabel=dict(
            bgcolor="rgba(50,50,50,0.85)",
            font_size=13,
            font_family=FONT_STACK,
            font_color="#ffffff",
            bordercolor="rgba(0,0,0,0)",
        ),
        hovermode="closest",
        # ── Legend ──
        legend=dict(
            font=dict(size=13, color="#111827", family=FONT_STACK),
        ),
    )

    # ── Title styling ──
    if title:
        fig.update_layout(
            title=dict(
                text=title,
                font=dict(
                    family=FONT_STACK,
                    size=18,
                    color="#374151",
                ),
                x=0.5,
                xanchor="center",
            )
        )

    return fig
