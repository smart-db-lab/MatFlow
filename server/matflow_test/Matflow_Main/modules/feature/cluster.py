import base64
import io
import pandas as pd
import numpy as np
from django.http import JsonResponse, HttpResponse
import plotly.io as pio
import plotly.graph_objects as go
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
def cluster_dataset(file):
    df = pd.DataFrame( file.get("file"))
    cls_ar=file.get('data')
    n_cls = len(cls_ar)
    print(f"n_cls = {n_cls}")
    class_nms = []

    for i in range(n_cls):
        class_nms.append(cls_ar[i])

    display_type = file.get("display_type")
    X = df.iloc[:, :-1].values
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X)
    kmeans = KMeans(n_clusters=n_cls, random_state=0).fit(X)
    centroids = pca.transform(kmeans.cluster_centers_)
    fig, ax = plt.subplots()
    scatter = ax.scatter(X_pca[:, 0], X_pca[:, 1], c=kmeans.labels_)
    handles, labels = scatter.legend_elements()
    cluster_labels = class_nms      #[label]) for label in kmeans.labels_]
    centroid_labels = ["" for _ in range(n_cls)]
    ax.legend(handles, cluster_labels)
    ax.scatter(centroids[:, 0], centroids[:, 1], c='red', marker='o')
    for i, txt in enumerate(centroid_labels):
        ax.annotate(txt, (centroids[i, 0], centroids[i, 1]), xytext=(-10, 10),
                    textcoords='offset points', color='red')

    # ax.set_title('K-means Clustering of Dataset')

    df['Class'] = [cluster_labels[label] for label in kmeans.labels_]


# if display_type == "Table":
    new_value = df.to_dict(orient="records")
    # return JsonResponse(new_value, safe=False)
# else:
    # st.pyplot(fig)
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
    obj= {
        "table" : new_value,
        "graph" : graph_json
    }
    return JsonResponse(obj, safe=False)
