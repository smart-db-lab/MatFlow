import pandas as pd
import numpy as np
import seaborn as sns
from dask.diagnostics import ProgressBar

pbar = ProgressBar()
from . import utils,train,labels
import ast

import tqdm.notebook
tqdm.notebook.tqdm_notebook.pandas()
def prediction():
    sns.set_theme(style="whitegrid", font_scale=1.1, font='Calibri')
    sns.despine(left=True)

    colors = ['#e66101', '#fdb863', '#b2abd2', '#5e3c99']
    sns.set_palette(sns.color_palette(colors))
    figureSize = (4, 3)
    padInches = 0.05
    development = utils.LoadDataFromOutput('dataset-development')
    validation = utils.LoadDataFromOutput('dataset-validation')

    utils.show_dataset_with_info(development, 'Load dataset: development')
    utils.show_dataset_with_info(validation, 'Load dataset: validation')

    data = pd.concat([development, validation]).reset_index(drop=True)
    utils.show_dataset_with_info(data, 'Combined dataset')

    temp = pd.read_parquet('./code/modelUsed-RandomForestRegressor.gzip.parquet').iloc[0]
    utils.show_dataset_with_info(temp, 'modelUsed: RandomForestRegressor')

    temp['Thresholds'] = ast.literal_eval(temp['Thresholds'])

    regressor = train.TrainRandomForestRegressor(temp['Model Params'], temp['Trial Type'], temp['High Epsilon Weight']
                                                 , temp['Thresholds'], data)

    # print('Model Used:')
    # print(temp['Trial Type'])
    # if (temp['Trial Type'] == 'Thresholds Trial'):
    #     print('Thresholds: ' + str(temp['Thresholds']))
    # else:
    #     print('High Epsilon Weight: ' + str(temp['High Epsilon Weight']))
    # display(regressor)

    data = utils.LoadDataFromOutput('dataset-experimental')
    utils.show_dataset_with_info(data, 'Load data: dataset-experimental')

    results = data[['Source Key', 'Td-Dft (Debye)', 'Min Epsilon', 'Max Epsilon']].copy()
    utils.show_dataset_with_info(results, 'Min-Max Epsilon result')
    results['Min Epsilon'] = results['Min Epsilon'] / 1000
    results.loc[results['Min Epsilon'] == 0, 'Min Epsilon'] = np.nan
    utils.show_dataset_with_info(results['Min Epsilon'], 'Minimum Epsilon result')

    results['Max Epsilon'] = results['Max Epsilon'] / 1000
    results.loc[results['Max Epsilon'] == 0, 'Max Epsilon'] = np.nan
    utils.show_dataset_with_info(results['Max Epsilon'], 'Maximum Epsilon result')


    emptyDataFrame = pd.DataFrame(columns=regressor.feature_names_in_)
    formatted = pd.concat([data, emptyDataFrame]).fillna(0)
    results['Regressor Prediction'] = regressor.predict(formatted[emptyDataFrame.columns]) / 1000
    utils.show_dataset_with_info(results['Regressor Prediction'], 'Regressor Prediction result-1')



    epsilons = results['Source Key'].to_frame().join(results[['Min Epsilon', 'Max Epsilon']].apply(pd.Series)).melt(
        'Source Key').dropna()[['Source Key', 'value']]

    g = sns.lineplot(data=results, x='Source Key', y='Td-Dft (Debye)', color='#5e3c99'
                     , label=labels.TD_DFT, legend=False)
    g.axes.set_ylabel(labels.MuFull)

    ax2 = g.axes.twinx()
    sns.lineplot(data=epsilons, x='Source Key', y='value', color='#e66101'
                 , label='Actual ' + labels.Epsilon + ' Range', legend=False, ax=ax2)

    sns.scatterplot(data=results, x='Source Key', y='Regressor Prediction', color='#e66101'
                    , label='Pred. ' + labels.Epsilon, legend=False, ax=ax2, marker='d', s=100)

    g.axes.figure.legend(bbox_to_anchor=(.75, .5), frameon=True)

    ax2.set_ylabel(labels.EpsilonFull)
    ax2.set_ylim((0, 300))
    g.axes.set_ylim((0, 22))
    g.set_xlabel('')
    utils.RotateAllXText([g])
    g.figure.tight_layout()
    # st.pyplot(g.get_figure())
    g.figure.savefig('./output/chart-prediction-experimental.png', bbox_inches='tight', dpi=600)

    data = utils.LoadDataFromOutput('dataset-unknownEpsilon')
    utils.show_dataset_with_info(data, 'Load dataset: unknownEpsilon')
    results = data[['Source Key']].copy()

    emptyDataFrame = pd.DataFrame(columns=regressor.feature_names_in_)
    formatted = pd.concat([data, emptyDataFrame]).fillna(0)
    results['Regressor Prediction'] = regressor.predict(formatted[emptyDataFrame.columns]) / 1000
    utils.show_dataset_with_info(results['Regressor Prediction'], 'Regressor Prediction result-2')
    # results
    # graph 2

    g = sns.scatterplot(data=results, x=results.index, y='Regressor Prediction')
    g.set(xticklabels=[], ylabel='Regressor Predicted ' + labels.EpsilonFull)
    g.figure.savefig('./output/chart-prediction-unknown.png', bbox_inches='tight', dpi=600)
    utils.savefigure('chart-overall-RandomForestRegressor', g.get_figure())
    combined = results.merge(data, on='Source Key')
    combined[(combined['Regressor Prediction'] >= 150)].to_csv('./output/highUnknownPredictions.csv')
    pd.read_csv('./output/highUnknownPredictions.csv')
