import base64
import io
import json
import plotly.graph_objects as go
import plotly.io as pio
import pandas
import pandas as pd
from django.http import HttpResponse
from matplotlib import pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif, f_regression, mutual_info_regression, \
    SelectFromModel
from ...subpage import customFeatureSelection, Feature_Selection_All


def visualize(X, y, selected_features_df):
    response_data = {}
    if not y.dtype == 'object':
        if len(selected_features_df) >= 2:
            # Get the two best features

            # Get the two best features
            feature1 = selected_features_df.iloc[0]['Feature']
            feature2 = selected_features_df.iloc[1]['Feature']

            fig, ax = plt.subplots(dpi=300)
            sns.scatterplot(x=X[feature1], y=X[feature2], hue=y, ax=ax)
            ax.set_title(f"Scatter Plot of {feature1} vs. {feature2}")
            ax.set_xlabel(feature1)
            ax.set_ylabel(feature2)

            # Convert the figure to JSON-serializable data
            image_stream = io.BytesIO()
            plt.savefig(image_stream, format='png', bbox_inches='tight')
            plt.close(fig)
            image_stream.seek(0)

            # Encode the image stream as base64
            image_base64 = base64.b64encode(image_stream.getvalue()).decode('utf-8')

            # Create the Plotly graph with the base64-encoded image and increase size
            graph = go.Figure(go.Image(source=f'data:image/png;base64,{image_base64}'))
            graph.update_layout(font=dict(family="Arial", size=12), width=1000, height=800)

            # Convert the graph to HTML and send as a response
            html_content = pio.to_html(graph, full_html=False)
            response = HttpResponse(content_type='text/html')
            response.write(html_content)

            # Return the graph JSON data
            graph_json = graph.to_json()
            response_data = {'scatter_plot': graph_json}

    # Create a bar plot of the selected features and their scores
    fig, ax = plt.subplots()
    ax.bar(selected_features_df['Feature'], selected_features_df['Score'])
    ax.set_xticklabels(selected_features_df['Feature'], rotation=90)
    ax.set_title("Selected Features and Scores")
    ax.set_xlabel("Feature")
    ax.set_ylabel("Score")

    # Convert the figure to JSON-serializable data
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
    response_data['bar_plot'] = graph_json

    return response_data

def feature_selection(file,data, target_var, method):
    show_graph=True
    response_data = {}

    # Separate target variable and features
    X = data.drop(columns=target_var)
    y = data[target_var]

    # Auto-select task based on target variable
    if y.dtype == 'object':
        task = 'classification'
    else:
        task = 'regression'

    # Select feature selection method and score function based on task
    if task == 'classification':
        if method == 'SelectKBest':
            best_Kfeature=file.get('best_Kfeature')
            score_func = file.get('score_func')
            selector = SelectKBest(score_func=eval(score_func), k=best_Kfeature)
        else:
            estimator = RandomForestClassifier(n_estimators=100, random_state=0)
            selector = SelectFromModel(estimator=estimator)
    else:
        if method == 'SelectKBest':
            best_Kfeature = file.get('best_Kfeature')
            score_func = file.get('score_func')
            selector = SelectKBest(score_func=eval(score_func), k=best_Kfeature)
        else:
            estimator = RandomForestRegressor(n_estimators=100, random_state=0)
            selector = SelectFromModel(estimator=estimator)

    # Perform feature selection
    try:
        selector.fit(X, y)
    except ValueError:
        response_data["error"] = "Feature selection failed. Please check if the selected score function is compatible with the data."
        return response_data

    selected_features = X.columns[selector.get_support()]

    # Display selected features and scores
    if method == 'SelectKBest':
        selected_scores = selector.scores_[selector.get_support()]
    else:
        selected_scores = selector.estimator_.feature_importances_[selector.get_support()]
    selected_features_df = pd.DataFrame({
        'Feature': selected_features,
        'Score': selected_scores
    })
    selected_features_df.sort_values('Score', ascending=False, inplace=True)
    selected_features_df.reset_index(drop=True, inplace=True)

    # Prepare response data
    response_data["selected_features"] = selected_features_df.to_dict(orient='records')

    # Call customFeatureSelection if needed
    if method == 'Best Overall Features':
        #need to catch kfold and display_opt
        kfold=file.get('k_fold')
        display_opt=file.get("display_opt")
        custom_feature_data = customFeatureSelection.feature_selection(data, target_var, task, kfold, display_opt, selected_features=None)
        response_data["custom_feature_data"] = custom_feature_data

    if show_graph:
        graph_data = visualize(X, y, selected_features_df)
        response_data["graph_data"] = graph_data

    # Return selected features and scores as JSON-serializable response data
    return response_data