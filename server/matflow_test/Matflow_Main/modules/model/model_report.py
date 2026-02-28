import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio
from django.http import HttpResponse
from django.http import JsonResponse
from eda.graph.plotly_theme import apply_modern_theme, MODERN_COLORS


def model_report(file):
    result_df = pd.DataFrame(file.get("file"))
    display_type = file.get("Display Type", "Graph")

    if display_type == "Table":
        include_data = file.get("Include Data", False)
        return report_table(result_df, include_data)
    else:
        return report_graph(result_df, file)


def report_table(data, include_data=False):
    # Implementation for table display can be added here
    pass


def report_graph(data, file):
    model_data = data.copy()

    try:
        model_data = model_data.drop(columns=['Train Data', 'Test Data', 'Model Name'])
    except:
        pass

    orientation = file.get("Select Orientation", "Vertical")
    display_result = file.get("Display Result", "All")

    if display_result == "All":
        column = model_data
    elif display_result == "Train":
        colms = model_data.columns[model_data.columns.str.contains("Train")].to_list()
        column = model_data[colms] if colms else model_data
    elif display_result == "Test":
        colms = model_data.columns[model_data.columns.str.contains("Test")].to_list()
        column = model_data[colms] if colms else model_data
    elif display_result == "Custom":
        selected_columns = file.get("Columns", [])
        if len(selected_columns) > 0:
            column = model_data[selected_columns]
        else:
            column = model_data
    else:
        column = model_data

    # Ensure we have the model names
    model_names = data['name'].values if 'name' in data.columns else [f"Model {i + 1}" for i in range(len(data))]

    # Check if Radar chart is requested
    if orientation == "Radar":
        return report_radar(column, model_names, data)

    # Create a Plotly figure
    fig = go.Figure()

    # Add traces for each model and metric
    for i, col in enumerate(column.columns):
        for j, (idx, row) in enumerate(data.iterrows()):
            model_name = model_names[j] if j < len(model_names) else f"Model {j + 1}"

            try:
                value = row[col] if col in row else None
            except:
                value = None

            if value is not None:
                color = MODERN_COLORS[j % len(MODERN_COLORS)]
                bar_kwargs = dict(
                    name=model_name,
                    legendgroup=model_name,
                    marker_color=color,
                    marker_line=dict(width=0),
                    showlegend=True if i == 0 else False,
                    text=[f'{value:.3f}' if isinstance(value, (int, float)) else str(value)],
                    textposition='outside',
                    textfont=dict(size=10, color='#374151'),
                )
                if orientation == 'Vertical':
                    fig.add_trace(go.Bar(x=[col], y=[value], **bar_kwargs))
                else:
                    fig.add_trace(go.Bar(y=[col], x=[value], orientation='h', **bar_kwargs))

    fig.update_layout(
        barmode='group',
        bargap=0.2,
        bargroupgap=0.08,
    )

    apply_modern_theme(fig, title='Model Performance Comparison')

    fig.update_layout(
        xaxis=dict(
            title="Metrics" if orientation == 'Vertical' else "Score",
            tickangle=-30 if orientation == 'Vertical' else 0,
        ),
        yaxis=dict(
            title="Score" if orientation == 'Vertical' else "Metrics",
            autorange=True,
            tickmode='auto',
            nticks=40,
        ),
        legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
    )

    # Handle x-axis tick labels for better readability
    if orientation == 'Vertical':
        fig.update_xaxes(
            tickangle=-45,
            tickmode='array',
            tickvals=list(column.columns),
            ticktext=column.columns
        )

    graph_json = fig.to_json()
    return JsonResponse(graph_json, safe=False)


def report_radar(column, model_names, data):
    """Generate a radar chart for model comparison."""
    fig = go.Figure()

    metrics = list(column.columns)
    # Close the radar by repeating the first metric
    theta = metrics + [metrics[0]]

    for j, (idx, row) in enumerate(data.iterrows()):
        model_name = model_names[j] if j < len(model_names) else f"Model {j + 1}"
        values = []
        for col in metrics:
            try:
                v = row[col] if col in row else 0
                values.append(float(v) if v is not None else 0)
            except:
                values.append(0)
        # Close the polygon
        values = values + [values[0]]

        fig.add_trace(go.Scatterpolar(
            r=values,
            theta=theta,
            fill='toself',
            name=model_name,
            line=dict(color=MODERN_COLORS[j % len(MODERN_COLORS)], width=2),
            fillcolor=MODERN_COLORS[j % len(MODERN_COLORS)],
            opacity=0.3,
        ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, 1.05],
                tickfont=dict(size=11, color='#1f2937'),
                gridcolor='rgba(0,0,0,0.06)',
            ),
            angularaxis=dict(
                tickfont=dict(size=12, color='#1f2937'),
                gridcolor='rgba(0,0,0,0.06)',
            ),
            bgcolor='#ffffff',
        ),
    )
    apply_modern_theme(fig, title='Model Performance Radar')

    graph_json = fig.to_json()
    return JsonResponse(graph_json, safe=False)
