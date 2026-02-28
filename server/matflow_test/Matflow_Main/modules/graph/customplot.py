import base64
import io
import plotly.graph_objects as go
import plotly.io as pio
import seaborn as sns
import matplotlib.pyplot as plt
from django.http import HttpResponse, JsonResponse
from ...modules import utils

def Custom_plot(data,x_var,y_var, hue_var):
    num_var = utils.get_numerical(data)
    # try:
    #     selected_features = st.session_state.selected_feature[table_name]
    # except:
    #     selected_features = []
    # if 'selected_features' in x_var:
    #     x_var.remove('selected_features')
    #     x_var.extend(selected_features)
    #     x_var = list(set(x_var))
    feature_dict = {}
    for i in num_var:
        feature_dict.update({i: i})
    # with st.expander('Rename Features'):
    #     for feature in x_var:
    #         renamed_feature = st.text_input(f"Rename '{feature}' to:", feature)
    #         feature_dict[feature] = renamed_feature
    fig, axs = plt.subplots(1, 2, figsize=(20, max(min(len(x_var), 15), 9)),dpi=720)
    colors = sns.color_palette('husl', (len(x_var) + 1) * (1 if hue_var == 'None' else len(data[hue_var].unique())))
    legend_colors = {}
    labels = []
    tmp_labels = []
    for i, feature in enumerate(x_var):
        tmp = []
        if hue_var == 'None':
            legend_colors.update({feature_dict.get(feature, feature): colors[i]})
            tmp.append(feature)
        else:
            hue_labels = data[hue_var].unique()
            hue_labels.sort()
            for j, label in enumerate(hue_labels):
                label_suffix = f"{feature_dict.get(feature, feature)} {label}"
                legend_colors.update({label_suffix: colors[i * len(x_var) + j]})
                tmp.append(label_suffix)
        tmp_labels.append(tmp)
    for i in range(1 if hue_var == 'None' else len(data[hue_var].unique())):
        for j in range(len(x_var)):
            labels.append(tmp_labels[j][i])

        for i, feature in enumerate(x_var):
            if hue_var == 'None':
                sns.lineplot(data=data, x=feature, y=y_var, label=feature_dict.get(feature, feature),
                             color=legend_colors[feature], ax=axs[0],linewidth=2.5)
            else:
                hue_labels = data[hue_var].unique()
                hue_labels.sort()
                for j, label in enumerate(hue_labels):
                    hue_data = data[data[hue_var] == label]
                    label_suffix = f"{feature_dict.get(feature, feature)} {label}"
                    sns.lineplot(data=hue_data, x=feature, y=y_var, label=label_suffix,
                                 color=legend_colors[label_suffix], ax=axs[0],linewidth=2.5)

    axs[0].set_xlabel('Features')
    axs[0].set_ylabel(feature_dict[y_var])
    axs[0].legend(bbox_to_anchor=(0.5, -0.1), loc='upper center', labels=labels,
                  ncol=1 if hue_var == 'None' else len(data[hue_var].unique()))
    for legend_handle, feature_label in zip(axs[0].get_legend().legendHandles, labels):
        legend_handle.set_color(legend_colors.get(feature_label, 'black'))

    # Scatter plot for combined data
    for i, feature in enumerate(x_var):
        if hue_var == 'None':
            sns.scatterplot(data=data, x=feature, y=y_var, label=feature_dict.get(feature, feature),
                            color=legend_colors[feature], ax=axs[1])
        else:
            hue_labels = data[hue_var].unique()
            hue_labels.sort()
            for j, label in enumerate(hue_labels):
                hue_data = data[data[hue_var] == label]
                label_suffix = f"{feature_dict.get(feature, feature)} {label}"
                sns.scatterplot(data=hue_data, x=feature, y=y_var, label=label_suffix,
                                color=legend_colors[label_suffix], ax=axs[1])
    axs[1].set_xlabel('Features')
    axs[1].set_ylabel(feature_dict[y_var])
    axs[1].legend(bbox_to_anchor=(0.5, -0.1), loc='upper center', labels=labels,
                  ncol=1 if hue_var == 'None' else len(data[hue_var].unique()))
    plt.tight_layout()

    # Save the plot to a BytesIO stream
    image_stream = io.BytesIO()
    plt.savefig(image_stream, format='png', bbox_inches='tight')
    plt.close(fig)
    image_stream.seek(0)

    # Encode the image stream as base64
    image_base64 = base64.b64encode(image_stream.getvalue()).decode('utf-8')

    # Create the Plotly graph with the base64-encoded image and increase size
    graph = go.Figure(go.Image(source=f'data:image/png;base64,{image_base64}'))
    graph.update_layout(font=dict(family="Arial", size=12), width=1000, height=800,)
    # Convert the graph to HTML and send as a response
    html_content = pio.to_html(graph, full_html=False)
    response = HttpResponse(content_type='text/html')
    response.write(html_content)

    # Return the graph JSON data
    graph_json = graph.to_json()
    return JsonResponse(graph_json, safe=False)


