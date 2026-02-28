import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor, ExtraTreesClassifier
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.model_selection import cross_validate

from xgboost import XGBRegressor, XGBClassifier


def feature_selection(dataset, table_name, target_var, problem_type):

    try:
        if "progress_prev_table" not in st.session_state:
            st.session_state.progress_prev_table = table_name
            st.session_state.progress_prev_target = target_var
        elif st.session_state.progress_prev_table == table_name and st.session_state.progress_prev_target == target_var:

            feature_graph(st.session_state.progress_df_result, st.session_state.progress_df_all_result, problem_type,
                          st.session_state.progress_dropped_columns, 'single_progress',
                          table_name)

            try:
                copy_df = dataset[table_name].drop(st.session_state.progress_dropped_columns.index.values.tolist(), axis=1)
                csv_data = copy_df.to_csv(index=False)
                st.download_button(
                    label=f"Download Feature Selected {table_name}",
                    data=csv_data,
                    file_name=f"feature_selected_{table_name}.csv",
                    mime="text/csv"
                )
            except:
                pass

            return

        else:
            st.session_state.progress_prev_table = table_name
            del st.session_state.progress_df_result
            del st.session_state.progress_df_all_result
            del st.session_state.progress_dropped_columns
            del st.session_state.progress_prev_target
    except:
        pass


    try:
        tab = dataset[table_name]
    except KeyError:
        st.error(f"The dataset '{table_name}' does not exist.")
        return pd.DataFrame

    if tab.isnull().values.any():
        st.header("There are Null values in the DataFrame.")
        return pd.DataFrame

    try:
        X_n = tab.drop(columns=target_var)
        Y_n = tab[target_var]
    except Exception as e:
        st.error(f"Error while getting input and output data: {str(e)}")
        return pd.DataFrame



    if problem_type == 'regression':
        scoring = ['neg_mean_absolute_error', 'neg_mean_absolute_percentage_error',
                   'neg_mean_squared_error', 'neg_root_mean_squared_error']
        df_columns = ['MAE', 'MAPE', 'MSE', 'RMSE']
        estimator_dict = {
            'ExtraTreesRegressor': ExtraTreesRegressor(),
            'RandomForestRegressor': RandomForestRegressor(),
            'GradientBoostingRegressor': GradientBoostingRegressor(),
            'XGBRegressor': XGBRegressor(),
        }
    else:
        scoring = ['accuracy', 'precision_macro', 'recall_macro', 'f1_macro']
        df_columns = ['Accuracy', 'Precision', 'Recall', 'F1']
        estimator_dict = {
            'ExtraTreesClassifier': ExtraTreesClassifier(),
            'RandomForestClassifier': RandomForestClassifier(),
            'GradientBoostingClassifier': GradientBoostingClassifier(),
            'XGBClassifier': XGBClassifier(),
        }
    c0,col1,col2,c1=st.columns([0.1,3,3,0.1])
    with col1:
        kfold = st.number_input("Enter the value for k-fold", value=2)
    with col2:
        estimator_name = st.selectbox("Select Estimator", list(estimator_dict.keys()))

    try:
        estimator = estimator_dict[estimator_name]
        list_X = list(X_n.columns)
        df_result = pd.DataFrame(columns=df_columns)
    except Exception as e:
        st.error(f"Error while initializing variables: {str(e)}")
        return pd.DataFrame

    display_opt = st.radio("", ["All", "Custom", "None"], index=2, key="display_opt", horizontal=True)

    if display_opt == 'None':
        return

    if display_opt == "Custom":
        list_X = st.multiselect("Select features to display", list_X)

    to_sort_df = df_result.copy()

    st.write('#')

    total_iterations = len(list_X)

    progress_bar = st.progress(0, text=':blue[Stage 1: Calculating scores for each feature]')

    for i in range(len(list_X)):
        scores = cross_validate(estimator, X_n[list_X[i]].values.reshape(-1, 1), Y_n, cv=kfold, scoring=scoring,
                                n_jobs=-1)
        progress_percentage = (i + 1) / total_iterations

        progress_bar.progress(progress_percentage,
                              text=':blue[Stage 1: Calculating scores for each feature]' + ('..') * (i % 3))
        try:
            to_sort_df.loc[list_X[i]] = [
                round(scores['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4) for score in
                scoring]
        except Exception as e:
            st.error(f"Error while adding data to result dataframe: {str(e)}")
            return pd.DataFrame
    progress_bar.progress(1.0, "Stage 1 completed!")

    if problem_type == 'classification':
        to_sort_df = to_sort_df.sort_values('F1', ascending=False)
    else:
        to_sort_df = to_sort_df.sort_values('RMSE')

    progress_bar = st.progress(0, text=':blue[Feature Selection in progress]')

    list_X = to_sort_df.index.tolist()
    selected = [list_X[0]]
    selected_feature_scores = df_result.copy()
    scores = cross_validate(estimator, X_n[selected].values.reshape(-1, 1), Y_n, cv=kfold, scoring=scoring, n_jobs=-1)
    selected_feature_scores.loc[list_X[0]] = [
        round(scores['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4) for score in scoring]
    list_X.remove(list_X[0])
    all_features_scores=df_result.copy()
    dropped_columns=df_result.copy()
    while len(list_X) > 0:
        var = df_result.copy()
        for i in list_X:
            scores = cross_validate(estimator, X_n[selected + [i]], Y_n, cv=kfold, scoring=scoring, n_jobs=-1)
            var.loc[i] = [round(scores['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4) for
                          score in scoring]
        var = var.sort_values('RMSE')
        list_X.remove(var.index[0])

        progress_percentage = (1.0- (len(list_X) /total_iterations))

        progress_bar.progress(progress_percentage, text=':blue[Feature Selection in progress]')

        if var.iloc[0]['RMSE'] < selected_feature_scores['RMSE'].iloc[-1]:
            selected_feature_scores.loc[var.index[0]] = var.iloc[0]
            all_features_scores.loc[var.index[0]] = var.iloc[0]
            selected.append(var.index[0])
        else:
            for j in range(len(var.index.values.tolist())):
                all_features_scores.loc[var.index[j]] = var.iloc[j]
                dropped_columns.loc[var.index[j]] = var.iloc[j]
            break

    progress_bar.progress(1.0, "Feature Selection completed!")

    st.session_state.selected_feature[table_name]=list(selected_feature_scores.index.values)

    st.session_state.progress_df_result = selected_feature_scores
    st.session_state.progress_dropped_columns = dropped_columns
    st.session_state.progress_df_all_result=all_features_scores


    feature_graph(selected_feature_scores,all_features_scores,problem_type,dropped_columns,'single_progress',table_name)

    try:
        copy_df = dataset[table_name].drop(st.session_state.progress_dropped_columns.index.values.tolist(), axis=1)
        csv_data = copy_df.to_csv(index=False)
        st.download_button(
            label=f"Download Feature Selected {table_name}",
            data=csv_data,
            file_name=f"feature_selected_{table_name}.csv",
            mime="text/csv"
        )
    except:
        pass




import plotly.graph_objects as go


def feature_graph(df_result, df_all_result, problem_type, dropped_columns, keys, table_name):
    try:
        table_name = table_name.split('.')[0]
    except:
        pass

    try:
        df_result = df_result.reset_index()
        df_all_result = df_all_result.reset_index()
        dropped_columns = dropped_columns.reset_index()
    except:
        st.error('Can\'t perform operation successfully')
        return

    if problem_type == "regression":
        # Define the chart and axis labels for regression
        matrices_to_display = st.multiselect('Select matrices to display', ['MAE', 'MAPE', 'MSE', 'RMSE'],
                                             default=['RMSE'], key=keys)
    else:
        # Define the chart and axis labels for classification
        matrices_to_display = st.multiselect('Select matrices to display', ['Accuracy', 'Precision', 'Recall', 'F1'],
                                             default=['Accuracy'], key=keys)

    df_result = df_result.rename(columns={'index': 'Features'})
    df_all_result = df_all_result.rename(columns={'index': 'Features'})

    dropped_columns = dropped_columns.rename(columns={'index': 'Features'})

    merged_df = pd.merge(df_all_result, df_result, on='Features', how='outer', suffixes=('_Baseline', '_Improved'))

    if problem_type == "regression":
        try:
            merged_df = merged_df.sort_values('RMSE_Improved', ascending=False)
            dropped_columns = dropped_columns.sort_values('RMSE', ascending=False)
            merged_df = merged_df.reset_index()
        except:
            st.error('Can\'t perform operation successfully')
            return
    else:
        try:
            merged_df = merged_df.sort_values('F1_Improved')
            dropped_columns = dropped_columns.sort_values('F1', ascending=False)
            merged_df = merged_df.reset_index()
        except:
            st.error('Can\'t perform operation successfully')
            return

    dropped_columns = dropped_columns.reset_index()

    st.write('#')

    data = pd.concat([df_result[['Features']], df_result[matrices_to_display]], axis=1)
    dropped_columns = pd.concat([dropped_columns[['Features']], dropped_columns[matrices_to_display]], axis=1)

    fig = go.Figure()

    for matrix_name in matrices_to_display:
        # Mask the missing values
        mask = np.isfinite(merged_df[f'{matrix_name}_Improved'])

        # Add a line plot trace for the baseline
        fig.add_trace(go.Scatter(x=merged_df['Features'], y=merged_df[f'{matrix_name}_Baseline'],
                                 name='Baseline',
                                 mode='lines+markers',
                                 line=dict(color='#FF4949', dash='dot'),
                                 marker=dict(symbol='circle', size=4, color='#FF4949')
                                 ))

        # Add a line plot trace for the improved
        fig.add_trace(go.Scatter(x=merged_df['Features'][mask], y=merged_df[f'{matrix_name}_Improved'][mask],
                                 name='Improved', mode='lines+markers', line=dict(color='#19A7CE'),
                                 marker=dict(symbol='circle', size=5, color='#19A7CE')
                                 ))

        dc = dict(title='<b>Features</b>',
                  tickangle=45 if keys != 'group' else 0,
                  )

    # Configure layout
    fig.update_layout(
        title='Comparison of Baseline and Improved',
        xaxis=dc,
        yaxis=dict(title=f'<b>Root-Mean-Square-Error ({matrices_to_display[0]})</b>'),
        autosize=True,  # Enables autosizing of the figure based on the container size
        hovermode='closest',  # Show data points on hover
        dragmode='zoom',  # Enable zooming and panning functionality
        width=1480,  # Set the width of the figure to 800 pixels
        height=920
        # showlegend=False  # Hide legend, as it may overlap with the plot
    )

    # Display the figure
    st.plotly_chart(fig)

    c0, col1, col2, c1 = st.columns([0.1, 4, 4, .1])

    with col1:
        st.subheader("Selected Features:")

        st.table(data)
        csv_data = data.to_csv(index=False)
        st.download_button(
            label="Download CSV",
            data=csv_data,
            file_name=f"selected_columns_{table_name}_{keys}.csv",
            mime="text/csv"
        )
    with col2:
        if len(dropped_columns) > 0:
            st.subheader("Dropped Features:")
            try:
                st.table(dropped_columns)
                csv_data = dropped_columns.to_csv(index=False)
                st.download_button(
                    label="Download CSV",
                    data=csv_data,
                    file_name=f"dropped_columns_{table_name}_{keys}.csv",
                    mime="text/csv"
                )
            except:
                pass
