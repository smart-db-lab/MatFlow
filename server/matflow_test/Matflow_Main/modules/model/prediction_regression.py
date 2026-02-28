
import pandas as pd
import numpy as np
import scipy.stats as stats
from django.http import JsonResponse
import plotly.graph_objects as go
import plotly.io as pio
from plotly.subplots import make_subplots
from ...modules import utils
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from eda.graph.plotly_theme import apply_modern_theme, MODERN_COLORS

def prediction_regression(file):
    target_var = file.get( "Target Variable")
    data = pd.DataFrame(file.get("file"))
    X, y = utils.split_xy(data, target_var)
    y_pred = file.get("y_pred")
    result_opt = file.get("Result")
    return show_result(y, y_pred, result_opt)

def show_result(y, y_pred, result_opt):
    if result_opt == "Target Value":
        result = pd.DataFrame({
            "Actual": y,
            "Predicted": y_pred
        })
        result = result.to_json(orient="records")
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=list(range(len(y))), y=y, mode='lines', name='Actual',
            line=dict(color=MODERN_COLORS[0], width=2.5),
        ))
        fig.add_trace(go.Scatter(
            x=list(range(len(y_pred))), y=y_pred, mode='lines', name='Predicted',
            line=dict(color=MODERN_COLORS[1], width=2.5, dash='dot'),
            fill='tonexty',
            fillcolor='rgba(54,162,235,0.06)',
        ))
        apply_modern_theme(fig, title="Actual vs. Predicted Values")
        fig.update_layout(
            xaxis=dict(title='Sample Index'),
            yaxis=dict(title='Value'),
            legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
        )
        graph_json = fig.to_json()
        return JsonResponse({"table": result, "graph": graph_json})

    elif result_opt == "R2 Score":
        result = r2_score(y, y_pred)
        return JsonResponse({"value": result})
    elif result_opt == "MAE":
        result = mean_absolute_error(y, y_pred)
        return JsonResponse({"value": result})
    elif result_opt == "MSE":
        result = mean_squared_error(y, y_pred)
        return JsonResponse({"value": result})
    elif result_opt == "RMSE":
        result = np.sqrt(mean_squared_error(y, y_pred))
        return JsonResponse({"value": result})

    elif result_opt == "Actual vs. Predicted":
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=list(range(len(y))), y=y, mode='lines', name='Actual',
            line=dict(color=MODERN_COLORS[0], width=2.5),
        ))
        fig.add_trace(go.Scatter(
            x=list(range(len(y_pred))), y=y_pred, mode='lines', name='Predicted',
            line=dict(color=MODERN_COLORS[1], width=2.5, dash='dot'),
            fill='tonexty',
            fillcolor='rgba(54,162,235,0.06)',
        ))
        apply_modern_theme(fig, title="Actual vs. Predicted Values")
        fig.update_layout(
            xaxis=dict(title='Sample Index'),
            yaxis=dict(title='Value'),
            legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
        )
        return JsonResponse({'graph': fig.to_json()})

    elif result_opt == "Residuals vs. Predicted":
        residuals = y - y_pred
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=y_pred, y=residuals, mode='markers', name='Residuals',
            marker=dict(
                color=MODERN_COLORS[1], size=8, opacity=0.65,
                line=dict(width=1, color='rgba(255,255,255,0.8)'),
            ),
        ))
        # Zero line
        fig.add_shape(
            type="line", x0=min(y_pred), y0=0, x1=max(y_pred), y1=0,
            line=dict(color=MODERN_COLORS[0], dash="dash", width=2),
        )
        apply_modern_theme(fig, title='Residuals vs. Predicted')
        fig.update_layout(
            xaxis=dict(title='Predicted Value'),
            yaxis=dict(title='Residual'),
        )
        return JsonResponse({'graph': fig.to_json()})

    elif result_opt == "Histogram of Residuals":
        residuals = y - y_pred
        fig = go.Figure()
        fig.add_trace(go.Histogram(
            x=residuals, nbinsx=15,
            marker_color=MODERN_COLORS[1],
            marker_line=dict(width=1.5, color='rgba(255,255,255,0.8)'),
            opacity=0.85,
        ))
        apply_modern_theme(fig, title="Histogram of Residuals")
        fig.update_layout(
            xaxis=dict(title="Residual Value"),
            yaxis=dict(title="Frequency"),
            bargap=0.05,
        )
        return JsonResponse({'graph': fig.to_json()})

    elif result_opt == "QQ Plot":
        residuals = y - y_pred
        qq = stats.probplot(residuals, dist="norm")
        theoretical = qq[0][0]
        sample = qq[0][1]

        fig = go.Figure()
        # Reference line (45-degree)
        line_min = min(theoretical.min(), sample.min())
        line_max = max(theoretical.max(), sample.max())
        fig.add_trace(go.Scatter(
            x=[line_min, line_max], y=[line_min, line_max],
            mode='lines', name='Reference',
            line=dict(color=MODERN_COLORS[0], width=2, dash='dash'),
        ))
        # QQ scatter
        fig.add_trace(go.Scatter(
            x=theoretical, y=sample, mode='markers', name='Sample Quantiles',
            marker=dict(
                color=MODERN_COLORS[1], size=7, opacity=0.7,
                line=dict(width=1, color='rgba(255,255,255,0.8)'),
            ),
        ))
        apply_modern_theme(fig, title="Normal Q-Q Plot")
        fig.update_layout(
            xaxis=dict(title="Theoretical Quantiles"),
            yaxis=dict(title="Sample Quantiles"),
            legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
        )
        return JsonResponse({'graph': pio.to_json(fig)})

    elif result_opt == "Box Plot of Residuals":
        residuals = y - y_pred
        fig = go.Figure()
        fig.add_trace(go.Box(
            y=residuals, name='Residuals',
            marker_color=MODERN_COLORS[1],
            line_color=MODERN_COLORS[1],
            fillcolor='rgba(54,162,235,0.15)',
            boxmean='sd',
        ))
        apply_modern_theme(fig, title='Box Plot of Residuals')
        fig.update_layout(
            yaxis=dict(title='Residual Value'),
        )
        return JsonResponse({'graph': fig.to_json()})

    elif result_opt == "Regression Line Plot":
        fig = go.Figure()
        # Scatter points
        fig.add_trace(go.Scatter(
            x=y, y=y_pred, mode='markers', name='Predictions',
            marker=dict(
                color=MODERN_COLORS[1], size=8, opacity=0.6,
                line=dict(width=1, color='rgba(255,255,255,0.8)'),
            ),
        ))
        # Perfect prediction line (y=x)
        axis_min = min(min(y), min(y_pred))
        axis_max = max(max(y), max(y_pred))
        fig.add_trace(go.Scatter(
            x=[axis_min, axis_max], y=[axis_min, axis_max],
            mode='lines', name='Perfect Fit',
            line=dict(color=MODERN_COLORS[0], width=2.5, dash='dash'),
        ))
        apply_modern_theme(fig, title='Regression Line Plot')
        fig.update_layout(
            xaxis=dict(title='Actual Value'),
            yaxis=dict(title='Predicted Value'),
            legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='center', x=0.5),
        )
        return JsonResponse({'graph': fig.to_json()})

    elif result_opt == "Metrics Summary":
        r2 = r2_score(y, y_pred)
        mae = mean_absolute_error(y, y_pred)
        mse = mean_squared_error(y, y_pred)
        rmse = np.sqrt(mse)

        fig = make_subplots(
            rows=2, cols=2,
            specs=[[{"type": "indicator"}, {"type": "indicator"}],
                   [{"type": "indicator"}, {"type": "indicator"}]],
            horizontal_spacing=0.15,
            vertical_spacing=0.15,
        )

        fig.add_trace(go.Indicator(
            mode="gauge+number",
            value=r2,
            title={'text': 'R\u00b2 Score', 'font': {'size': 16, 'color': '#374151'}},
            number={'font': {'size': 32}},
            gauge={
                'axis': {'range': [0, 1], 'tickfont': {'size': 10, 'color': '#9ca3af'}},
                'bar': {'color': MODERN_COLORS[1], 'thickness': 0.75},
                'bgcolor': '#f3f4f6',
                'borderwidth': 0,
                'steps': [
                    {'range': [0, 0.5], 'color': '#fee2e2'},
                    {'range': [0.5, 0.8], 'color': '#fef3c7'},
                    {'range': [0.8, 1], 'color': '#d1fae5'},
                ],
            }
        ), row=1, col=1)

        fig.add_trace(go.Indicator(
            mode="number",
            value=mae,
            title={'text': 'MAE', 'font': {'size': 16, 'color': '#374151'}},
            number={'font': {'color': MODERN_COLORS[0], 'size': 36}, 'valueformat': '.4f'},
        ), row=1, col=2)

        fig.add_trace(go.Indicator(
            mode="number",
            value=mse,
            title={'text': 'MSE', 'font': {'size': 16, 'color': '#374151'}},
            number={'font': {'color': MODERN_COLORS[4], 'size': 36}, 'valueformat': '.4f'},
        ), row=2, col=1)

        fig.add_trace(go.Indicator(
            mode="number",
            value=rmse,
            title={'text': 'RMSE', 'font': {'size': 16, 'color': '#374151'}},
            number={'font': {'color': MODERN_COLORS[3], 'size': 36}, 'valueformat': '.4f'},
        ), row=2, col=2)

        apply_modern_theme(fig, title='Regression Metrics Summary')
        return JsonResponse({'graph': pio.to_json(fig)})
