import io
import seaborn as sns
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.io as pio
from django.http import HttpResponse
from django.http import JsonResponse
import base64
import json
def Pieplot(data,var,explode,title,label,pct):
	explode = float(explode)
	if var != "-":
		fig, ax = plt.subplots(dpi=720)
		if len(title) == 0:
			# title = f"{var} Pie Plot"
			ax.set_title(title)
		pct = '%1.2f%%' if pct else None

		ax = data[var].value_counts().plot(kind="pie", 
				explode=[explode for x in data[var].dropna().unique()], 
				autopct=pct
			)
			
		if label:
			ax.set_ylabel(var)
		else:
			ax.set_ylabel("")

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

