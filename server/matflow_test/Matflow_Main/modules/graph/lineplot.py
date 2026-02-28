import io
import seaborn as sns
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.io as pio
from django.http import HttpResponse
from django.http import JsonResponse
import base64
import json
def Lineplot(data,x,y,hue,title,style,legend):
	if x != "-" and y != "-":
		fig, ax = plt.subplots(dpi=720)
		hue = None if (hue == "-") else hue
		style = None if (style == "-") else style
		if len(title)>0:
			ax.set_title(title)
		ax = sns.lineplot(data=data, x=x, y=y, hue=hue, style=style, legend=legend)	

		# Save the plot to a BytesIO stream
		image_stream = io.BytesIO()
		plt.savefig(image_stream, format='png', bbox_inches='tight')
		plt.close(fig)
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
		graph_json = graph.to_json()
		return JsonResponse(graph_json, safe=False)