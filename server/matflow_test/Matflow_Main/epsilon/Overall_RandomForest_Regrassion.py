import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt


from dask.diagnostics import ProgressBar
import sys
import multiprocessing as mp

pbar = ProgressBar()
import dask
from dask.diagnostics import ProgressBar

import ast

import tqdm.notebook
tqdm.notebook.tqdm_notebook.pandas()

from . import utils
from . import labels
from . import train
def overall_RandomForest_Regrassion():

    pbar = ProgressBar()
    pbar.register()  # global registration
    if (sys.platform == 'win32' and mp.cpu_count() >= 61):
        dask.config.set(num_workers=61)
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
    # print('Developement Dataset Count: ' + str(len(development)))
    # print('Validate Dataset Count: ' + str(len(validation)))

    data = pd.concat([development, validation]).reset_index(drop=True)
    utils.show_dataset_with_info(data, 'Combined dataset')
    # utils.InspectColumnValues(data)
    # print('Total Count: ' + str(len(data)))
    # print('Number of Training Features: ' + str(len(development.columns)))
    with st.expander('Number of Training Features '):
        st.write(pd.DataFrame({'columns':development.columns}))

    # development.head(1)
    regressorModelUsed = pd.read_parquet('./code/modelUsed-RandomForestRegressor.gzip.parquet').iloc[0]
    utils.show_dataset_with_info(regressorModelUsed, 'modelUsed: RandomForestRegressor')
    regressorModelUsed['Thresholds'] = ast.literal_eval(regressorModelUsed['Thresholds'])
    print('regession step 1 done')

    regressorModelUsed['Model'] = train.TrainRandomForestRegressor(regressorModelUsed['Model Params'],
                                                                   regressorModelUsed['Trial Type'],
                                                                   regressorModelUsed['High Epsilon Weight']
                                                                   , regressorModelUsed['Thresholds'], data)

    print('regession step 2 done')
    # print(regressorModelUsed['Trial Type'])
    # if (regressorModelUsed['Trial Type'] == 'Thresholds Trial'):
    #     print('Thresholds: ' + str(regressorModelUsed['Thresholds']))
    # else:
    #     print('High Epsilon Weight: ' + str(regressorModelUsed['High Epsilon Weight']))
    #graphs

    def GraphResults(data, model, title, ax):
        X, y = train.GetXandY(data)
        y_weights = train.ComputeWeightsForRegressor(y, model['Trial Type'], model['High Epsilon Weight'],
                                                     model['Thresholds'])

        predict_y = model['Model'].predict(X)
        score = model['Model'].score(X, y, y_weights)
        # st.metric(score)
        chart = sns.scatterplot(x=y / 1000, y=predict_y / 1000, ax=ax)
        chart.set(title=title + ' Score: ' + format(score, '.2f'))
        chart.xaxis.set_label_text('Actual ' + labels.EpsilonFull)
        chart.yaxis.set_label_text('Predicted ' + labels.EpsilonFull)
        chart.axvline(150, color='#5e3c99')
        chart.axhline(150, color='#5e3c99')

    fig, axes = plt.subplots(ncols=2, figsize=(8, 4), constrained_layout=True, sharey=True, sharex=True)
    GraphResults(development, regressorModelUsed, 'Development', axes[0])
    GraphResults(validation, regressorModelUsed, 'Validation', axes[1])
    # st.pyplot(fig.get_figure())
    fig.savefig('./output/chart-overall-RandomForestRegressor.png', bbox_inches='tight', dpi=600)
    utils.savefigure('chart-overall-RandomForestRegressor', fig.get_figure())
