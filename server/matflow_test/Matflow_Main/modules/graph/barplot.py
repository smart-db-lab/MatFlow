import io
import seaborn as sns
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.io as pio
from django.http import HttpResponse
from django.http import JsonResponse
import base64
import json

def Barplot(data,cat,num,hue,orient,annotate,title):
	errorbar=True
	fig, ax = plt.subplots(dpi=720)
	if cat != "-" and num != "-":
		hue = None if (hue == "-") else hue
		errorbar = ("ci", 95) if errorbar== True else None

		if orient == "Vertical":
			try:
				data[cat] = data[cat].astype(int)
			except:
				pass
			ax = sns.barplot(data=data, x=cat, y=num, hue=hue, errorbar=errorbar)
		else:
			data[cat] = data[cat].astype(str)
			order = sorted(data[cat].unique())
			ax = sns.barplot(data=data, x=num, y=cat, hue=hue, order=order, errorbar=errorbar)
		if len(title) == 0:
			# title = f"Barplot of {num} by {cat}"
			# if hue:
			# 	title = f"Barplot of {num} by {cat} and {hue}"
			ax.set_title(title)
		if annotate== True:
			if orient == "Vertical":
				for bar in ax.patches:
					ax.annotate(format("{:.3f}".format(bar.get_height())),
								(bar.get_x() + 0.5 * bar.get_width(),
								 bar.get_height()), ha='center', va='center',
								size=11, xytext=(0, 8),
								textcoords='offset points'
								)
			else:
				for rect in ax.patches:
					plt.text(1.05 * rect.get_width(),
							 rect.get_y() + 0.5 * rect.get_height(),
							 '%.3f' % float(rect.get_width()),
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


