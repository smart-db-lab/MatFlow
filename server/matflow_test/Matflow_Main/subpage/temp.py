import io
import json
import pandas as pd
import matplotlib.pyplot as plt
from statsmodels.tsa.arima.model import ARIMA
import plotly.io as pio
from django.http import HttpResponse
from django.http import JsonResponse
import base64
import plotly.graph_objects as go
from datetime import datetime, timedelta

def temp(file):
    data=pd.DataFrame(file.get('file'))
    date_columns = []

    for column_name in data.columns:
        if data[column_name].dtype == 'object' or data[column_name].dtype == 'datetime64[ns]':
            try:
                pd.to_datetime(data[column_name])
                date_columns.append(column_name)
            except ValueError:
                obj={
                    "error":True
                }
                return JsonResponse(obj, safe=False)

    if(len(date_columns)==0):
        obj = {
            "error": True
        }
        return JsonResponse(obj, safe=False)

    column = file.get("select_column")
    if(column==""):
        obj = {
            "error": False
        }
        return JsonResponse(obj, safe=False)

    data.rename(columns={date_columns[0]:"date"},inplace=True)
    data['date'] = pd.to_datetime(data["date"])
    data = data.set_index('date')
    # ----------datetime
    date_string =  str(data.index[2].date())
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",  # Year-Month-Day
        "%Y/%m/%d",  # Year/Month/Day
        "%m-%d-%Y",  # Month-Day-Year
        "%d-%m-%Y",  # Day-Month-Year
        "%m/%d/%Y",  # Month/Day/Year
        "%d/%m/%Y"  # Day/Month/Year
        "%Y/%m/%d %H:%M:%S",  # Year/Month/Day
        "%m-%d-%Y %H:%M:%S",  # Month-Day-Year
        "%d-%m-%Y %H:%M:%S",  # Day-Month-Year
        "%m/%d/%Y %H:%M:%S",  # Month/Day/Year
        "%d/%m/%Y %H:%M:%S",
    ]
    detected_format = None
    for fmt in formats:
        try:
            datetime.strptime(date_string, fmt)
            detected_format = fmt
            break
        except ValueError:
            continue
    min_date_range = data.index.min()
    max_date_range =data.index.max()
    # Convert selected range to Timestamp objects
    selected_start = min_date_range
    selected_end =  max_date_range

    # Filter the data based on the selected range
    filtered_data = data.loc[selected_start:selected_end]
    # filtered_data = data.loc[(data.index >= min_date_range) & (data.index <= max_date_range)]
    if isinstance(filtered_data, pd.DataFrame):
        fig = go.Figure()
        # Add the line plot
        fig.add_trace(go.Scatter(x=filtered_data.index, y=filtered_data[column], mode='lines', name='Value'))
        # Perform forecasting
        model = ARIMA(filtered_data[column], order=(1, 1, 1))
        model_fit = model.fit()
        # Define the prediction range
        prediction_start = selected_start
        prediction_end = selected_end
        forecast = model_fit.predict(start=prediction_start, end=prediction_end)
        # Add the forecasted values
        fig.add_trace(
            go.Scatter(x=forecast.index, y=forecast.values, mode='lines', name='Forecasted', line=dict(color='orange')))
        # Configure hover tool to display values
        fig.update_layout(hovermode='x')
        # Adjust legend position
        fig.update_layout(legend=dict(x=0, y=1, bgcolor='rgba(255, 255, 255, 0.5)'))
        # Set axis labels
        fig.update_layout(xaxis_title="Time", yaxis_title="Value")
        fig.show()
        # Save the plot to a BytesIO stream
        image_stream = io.BytesIO()
        plt.savefig(image_stream, format='png', bbox_inches='tight')
        # plt.close(fig)
        image_stream.seek(0)

        # Encode the image stream as base64
        image_base64 = base64.b64encode(image_stream.getvalue()).decode('utf-8')

        # Create the Plotly graph with the base64-encoded image and increase size
        graph = go.Figure(go.Image(source=f'data:image/png;base64,{image_base64}'))
        graph.update_layout(font=dict(family="Arial", size=12), width=1000, height=800,
                            # xaxis=dict(editable=True),yaxis=dict(editable=True)
                            )
        # Convert the graph to HTML and send as a response
        html_content = pio.to_html(graph, full_html=False)
        response = HttpResponse(content_type='text/html')
        response.write(html_content)
        # Return the graph JSON data
        # graph_json = graph.to_json()
        graph_json = fig.to_dict()

        object = {
            "graph": graph_json,
            "format": detected_format  # if detected_format else None ,
        }
        return JsonResponse(object, safe=False)
