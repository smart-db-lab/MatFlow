from sklearn.ensemble import ExtraTreesRegressor, ExtraTreesClassifier
from sklearn.model_selection import cross_validate
import numpy as np

import plotly.graph_objects as go


import pandas as pd
from sklearn.ensemble import ExtraTreesClassifier, ExtraTreesRegressor
from sklearn.model_selection import cross_validate
def feature_selection(dataset, target_var, problem_type, kfold, display_opt, selected_features=None):
    try:
        tab = dataset
        if tab.isnull().values.any():
            return ({"error": "Null values in the dataset"})

        X_n = tab.drop(columns=target_var)
        Y_n = tab[target_var]

        if problem_type == 'regression':
            scoring = ['neg_mean_absolute_error', 'neg_mean_absolute_percentage_error', 'neg_mean_squared_error',
                       'neg_root_mean_squared_error']
            df_columns = ['MAE', 'MAPE', 'MSE', 'RMSE']
            estimator = ExtraTreesRegressor()
        else:
            scoring = ['accuracy', 'precision_macro', 'recall_macro', 'f1_macro']
            df_columns = ['Accuracy', 'Precision', 'Recall', 'F1']
            estimator = ExtraTreesClassifier()

        list_X = list(X_n.columns)
        df_result = pd.DataFrame(columns=df_columns)

        if display_opt == "Custom":
            list_X = selected_features

        total_iterations = len(list_X)
        to_sort_df = df_result.copy()

        for i in range(len(list_X)):
            scores = cross_validate(estimator, X_n[list_X[i]].values.reshape(-1, 1), Y_n, cv=kfold, scoring=scoring,
                                    n_jobs=-1)
            try:
                to_sort_df.loc[list_X[i]] = [
                    round(scores['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4) for score
                    in
                    scoring]
            except Exception as e:
                print(f"Error while adding data to result dataframe: {str(e)}")
                return

        if problem_type == 'classification':
            to_sort_df = to_sort_df.sort_values('F1', ascending=False)
        else:
            to_sort_df = to_sort_df.sort_values('RMSE')

        list_X = to_sort_df.index.tolist()
        k = list_X[0]

        df_all_result = df_result.copy()
        df_all_result_group = df_result.copy()
        df_result_group = df_result.copy()

        mx_len = len(list_X)

        dropped_columns_group = df_result.copy()

        k = str(5)

        for i in range(0, len(list_X), 5):
            selected_column_data = X_n[list_X[:min(i + 5, mx_len)]]

            scores_all = cross_validate(estimator, selected_column_data, Y_n, cv=kfold, scoring=scoring, n_jobs=-1)
            try:

                df_result_group.loc[str(i + 5)] = [
                    round(scores_all['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4) for
                    score
                    in
                    scoring]
                df_all_result_group.loc[str(i + 5)] = [
                    round(scores_all['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4) for
                    score
                    in
                    scoring]
            except Exception as e:
                print(f"Error while adding data to result dataframe: {str(e)}")
                return pd.DataFrame

            if i >= 1:
                if problem_type == 'regression':
                    if df_result_group.loc[str(i + 5), 'RMSE'] >= df_result_group.loc[k, 'RMSE']:
                        dropped_columns_group.loc[str(i + 5)] = df_result_group.loc[
                            str(i + 5)]  # add column name to list
                        df_result_group = df_result_group.drop(str(i + 5))
                    else:
                        k = str(i + 5)
                else:
                    if df_result_group.loc[str(i + 5), 'F1'] <= df_result_group.loc[k, 'F1']:
                        dropped_columns_group.loc[str(i + 5)] = df_result_group.loc[str(i + 5)]
                        df_result_group = df_result_group.drop(str(i + 5))
                    else:
                        k = str(i + 5)

        dropped_columns = df_result.copy()

        all_column_data_first = pd.DataFrame()
        selected_column_data = pd.DataFrame()

        k = list_X[0]

        for i in range(len(list_X)):
            all_column_data_first[list_X[i]] = X_n[list_X[i]]
            selected_column_data[list_X[i]] = X_n[list_X[i]]

            if len(dropped_columns) > 0:
                scores_all = cross_validate(estimator, all_column_data_first, Y_n, cv=kfold, scoring=scoring, n_jobs=-1)
                scores_selected = cross_validate(estimator, selected_column_data, Y_n, cv=kfold, scoring=scoring,
                                                 n_jobs=-1)
                try:

                    df_result.loc[list_X[i]] = [
                        round(scores_selected['test_' + score].mean() * (1 if problem_type == 'classification' else -1),
                              4)
                        for score
                        in
                        scoring]
                    df_all_result.loc[list_X[i]] = [
                        round(scores_all['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4)
                        for
                        score
                        in
                        scoring]
                except Exception as e:
                    print(f"Error while adding data to result dataframe: {str(e)}")
                    return pd.DataFrame
            else:
                scores_all = cross_validate(estimator, all_column_data_first, Y_n, cv=kfold, scoring=scoring, n_jobs=-1)
                try:

                    df_result.loc[list_X[i]] = [
                        round(scores_all['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4)
                        for
                        score
                        in
                        scoring]
                    df_all_result.loc[list_X[i]] = [
                        round(scores_all['test_' + score].mean() * (1 if problem_type == 'classification' else -1), 4)
                        for
                        score
                        in
                        scoring]
                except Exception as e:
                    return pd.DataFrame

            progress_percentage = (i + 1) / total_iterations

            # create a list to store dropped columns
            if i >= 1:
                if problem_type == 'regression':
                    if df_result.loc[list_X[i], 'RMSE'] >= df_result.loc[k, 'RMSE']:
                        dropped_columns.loc[list_X[i]] = df_result.loc[list_X[i]]  # add column name to list
                        df_result = df_result.drop(list_X[i])
                        selected_column_data = selected_column_data.drop(columns=list_X[i])
                    else:
                        k = list_X[i]
                else:
                    if df_result.loc[list_X[i], 'F1'] <= df_result.loc[k, 'F1']:
                        dropped_columns.loc[list_X[i]] = df_result.loc[list_X[i]]
                        df_result = df_result.drop(list_X[i])
                        selected_column_data = selected_column_data.drop(columns=list_X[i])
                    else:
                        k = list_X[i]

        response_data = {
            "df_result_group": df_result_group.to_dict(orient='index'),
            "df_all_result_group": df_all_result_group.to_dict(orient='index'),
            "dropped_columns_group": dropped_columns_group.to_dict(orient='index'),
            "df_result": df_result.to_dict(orient='index'),
            "df_all_result": df_all_result.to_dict(orient='index'),
            "dropped_columns": dropped_columns.to_dict(orient='index'),
            "progress_message": "Feature selection process completed!",
            "group": feature_graph(df_result_group, df_all_result_group, problem_type, dropped_columns_group, 'group'),
            "single": feature_graph(df_result, df_all_result, problem_type, dropped_columns, 'single')
        }

        return (response_data)

    except Exception as e:
        error_response = {"error": str(e)}
        return (error_response)


def feature_graph(df_result, df_all_result, problem_type, dropped_columns, keys):
    # try:
    #     table_name = table_name.split('.')[0]
    # except:
    #     pass

    try:
        df_result = df_result.reset_index()
        df_all_result = df_all_result.reset_index()
        dropped_columns = dropped_columns.reset_index()
    except:
        print('Can\'t perform operation successfully')
        return

    if problem_type == "regression":
        matrices_to_display = ['MAE', 'MSE', 'RMSE']
    else:
        matrices_to_display = ['Accuracy', 'Precision', 'Recall', 'F1']

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
            print('Can\'t perform operation successfully')
            return
    else:
        try:
            merged_df = merged_df.sort_values('F1_Improved')
            dropped_columns = dropped_columns.sort_values('F1', ascending=False)
            merged_df = merged_df.reset_index()
        except:
            print('Can\'t perform operation successfully')
            return

    dropped_columns = dropped_columns.reset_index()

    data = pd.concat([df_result[['Features']], df_result[matrices_to_display]], axis=1)
    dropped_columns = pd.concat([dropped_columns[['Features']], dropped_columns[matrices_to_display]], axis=1)

    fig = go.Figure()

    for matrix_name in matrices_to_display:
        mask = np.isfinite(merged_df[f'{matrix_name}_Improved'])

        fig.add_trace(go.Scatter(x=merged_df['Features'], y=merged_df[f'{matrix_name}_Baseline'],
                                 name='Baseline',
                                 mode='lines+markers',
                                 line=dict(color='#FF4949', dash='dot'),
                                 marker=dict(symbol='circle', size=4, color='#FF4949')
                                 ))

        fig.add_trace(go.Scatter(x=merged_df['Features'][mask], y=merged_df[f'{matrix_name}_Improved'][mask],
                                 name='Improved', mode='lines+markers', line=dict(color='#19A7CE'),
                                 marker=dict(symbol='circle', size=5, color='#19A7CE')
                                 ))

    graph_data = fig.to_dict()

    selected_features_data = {
        'headers': data.columns.tolist(),
        'rows': data.values.tolist()
    }

    dropped_features_data = {
        'headers': dropped_columns.columns.tolist(),
        'rows': dropped_columns.values.tolist()
    }

    return {
        'graph_data': graph_data,
        'selected_features_data': selected_features_data,
        'dropped_features_data': dropped_features_data
    }


