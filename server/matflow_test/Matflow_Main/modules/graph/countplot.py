import io
import seaborn as sns
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.io as pio
from django.http import HttpResponse
from django.http import JsonResponse
import base64
import json
def Countplot(data,var,title,hue,orient,annot):
	if var != "-":
		fig, ax = plt.subplots(dpi=1200)
		if hue == "-":
			hue = None
		if len(title) == 0:
			# title = f"{var} Count"
			ax.set_title(title)
			ax.title.set_position([.5, 1.5])

		if orient == "Vertical":
			ax = sns.countplot(data=data, x=var, hue=hue)
		else:
			ax = sns.countplot(data=data, y=var, hue=hue)

		if annot:
			if orient == "Vertical":
				for bar in ax.patches:
					ax.annotate(format(int(bar.get_height())),
				            (bar.get_x()+0.5*bar.get_width(),
				            bar.get_height()), ha='center', va='center',
				            size=11, xytext=(0, 8),
				            textcoords='offset points'
			            )
			else:
				for rect in ax.patches:
					plt.text(1.05*rect.get_width(), 
							rect.get_y()+0.5*rect.get_height(),
				            '%d' % int(rect.get_width()),
				            ha='center', va='center'
			            )
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