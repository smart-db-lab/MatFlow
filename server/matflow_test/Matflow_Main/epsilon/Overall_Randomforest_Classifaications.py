import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import sklearn.metrics as skm
from sklearn.utils import resample

from dask.diagnostics import ProgressBar

pbar = ProgressBar()

import ast

from IPython.core.display import display

import tqdm.notebook
tqdm.notebook.tqdm_notebook.pandas()

from . import utils
from . import labels
from . import train
def overall_RandomForest_Classifaications():

    sns.set_theme(style="whitegrid", font_scale=1.1, font='Calibri')
    sns.despine(left=True)

    colors = ['#e66101', '#fdb863', '#b2abd2', '#5e3c99']
    sns.set_palette(sns.color_palette(colors))
    figureSize = (4, 3)
    padInches = 0.05
    development = utils.LoadDataFromOutput('dataset-development')
    validation = utils.LoadDataFromOutput('dataset-validation')
    # print('Developement Dataset Count: ' + str(len(development)))
    # print('Validate Dataset Count: ' + str(len(validation)))
    utils.show_dataset_with_info(development, 'Load dataset: development')
    utils.show_dataset_with_info(validation, 'Load dataset: validation')


    data = pd.concat([development, validation]).reset_index(drop=True)
    # print('Total Count: ' + str(len(data)))
    # print('Number of Training Features: ' + str(len(development.columns)))
    # development.head(1)
    utils.show_dataset_with_info(data, 'Combined training dataset')
    models = pd.read_parquet('./code/trainedModels-RandomForestClassifier.gzip.parquet')
    models['Model Params'] = models['Model'].apply(ast.literal_eval)
    utils.show_dataset_with_info(models, 'trainedModels: RandomForestClassifier')

    # models.head(1)
    def ComputeAllowsLowAccuracy(threshold, data):
        _, y = train.GetXandY(data)
        y = train.ComputeLabel(y, threshold)
        y_pred = data['Epsilon'].apply(lambda x: 'low ε')
        return skm.accuracy_score(y, y_pred)

    temp = models.copy()
    temp = temp.join(temp['Model Params'].apply(lambda x: pd.Series(x, dtype='object')))
    temp['Accuracy'] = temp['Accuracy'].apply(lambda x: np.round(x, 2))
    # %%
    temp['Total Information Used'] = temp.apply(
        lambda row: train.ComputeTotalInfomationUsed(row, len(development.columns)), axis='columns')
    maxAccuracy = temp.groupby(['Threshold']).max('Accuracy')['Accuracy'].reset_index()
    # maxAccuracy
    utils.show_dataset_with_info(maxAccuracy, 'models with highest accuracy')
    totalInformationUsed = \
    temp.merge(maxAccuracy, on=['Threshold', 'Accuracy']).groupby(['Threshold']).min('Total Information Used')[
        ['Accuracy', 'Total Information Used']].reset_index()
    mostAccurateAndPreciseWithTheLeastAmountOfInformation = temp.merge(totalInformationUsed,
                                                                       on=['Threshold', 'Accuracy',
                                                                           'Total Information Used']).groupby(
        ['Threshold']).max('Precision (High ε)').reset_index()
    bestModels = temp.merge(mostAccurateAndPreciseWithTheLeastAmountOfInformation[
                                ['Threshold', 'Accuracy', 'Total Information Used', 'Precision (High ε)']],
                            on=['Threshold', 'Accuracy', 'Total Information Used', 'Precision (High ε)'])
    bestModels = bestModels.groupby(['Threshold']).first().reset_index()
    utils.show_dataset_with_info(bestModels, 'bestmodels dateset')
    bestModels['Model'] = bestModels.progress_apply(
        lambda x: train.TrainRandomForestClassifier(x['Model Params'], x['Threshold'], development), axis='columns')
    bestModels['Random Forest Classifier(Development)'] = bestModels.apply(
        lambda x: train.ComputeClassifierAccuracy(x['Model'], x['Threshold'], development), axis='columns')
    bestModels['Random Forest Classifier(Validation)'] = bestModels.apply(
        lambda x: train.ComputeClassifierAccuracy(x['Model'], x['Threshold'], validation), axis='columns')
    bestModels['Always Low ε(Development)'] = bestModels.apply(
        lambda x: ComputeAllowsLowAccuracy(x['Threshold'], development), axis='columns')
    bestModels['Always Low ε(Validation)'] = bestModels.apply(
        lambda x: ComputeAllowsLowAccuracy(x['Threshold'], validation), axis='columns')
    # utils.show_dataset_with_info(bestModels,'Selected bestModels')
    # st.write('best model print failed')


    #
    #
    classifierModelUsed = bestModels.iloc[1]
    utils.show_dataset_with_info(classifierModelUsed, 'Used ClassifierModel')
    #
    low = data[data['Epsilon'] < classifierModelUsed['Threshold']].reset_index(drop=True).copy()
    high = data[data['Epsilon'] >= classifierModelUsed['Threshold']].reset_index(drop=True).copy()
    total = len(low) + len(high)
    #
    percentageLowRuns = []
    for lowPercent in range(50, 100, 2):
        lowPercent = lowPercent / 100
        numberOfHighsNeeded = int(len(low) / lowPercent - len(low))
        newHighs = resample(high, n_samples=numberOfHighsNeeded, random_state=82219)
        lowEpsilonDevelopment, lowEpsilonValidation = train.SplitData(pd.concat([low, newHighs], ignore_index=True))
        percentageLowRuns.append([lowPercent, lowEpsilonDevelopment, lowEpsilonValidation])
    # print
    percentageLowRuns = pd.DataFrame(percentageLowRuns, columns=['Percentage Low ε', 'Development', 'Validation'])
    percentageLowRuns['Model'] = percentageLowRuns.progress_apply(
        lambda x: train.TrainRandomForestClassifier(classifierModelUsed['Model Params'],
                                                    classifierModelUsed['Threshold'], x['Development']), axis='columns')
    percentageLowRuns['Random Forest Classifier(Development)'] = percentageLowRuns.apply(
        lambda x: train.ComputeClassifierAccuracy(x['Model'], classifierModelUsed['Threshold'], x['Development']),
        axis='columns')
    percentageLowRuns['Random Forest Classifier(Validation)'] = percentageLowRuns.apply(
        lambda x: train.ComputeClassifierAccuracy(x['Model'], classifierModelUsed['Threshold'], x['Validation']),
        axis='columns')
    percentageLowRuns['Always Low ε(Development)'] = percentageLowRuns.apply(
        lambda x: ComputeAllowsLowAccuracy(classifierModelUsed['Threshold'], x['Development']), axis='columns')
    percentageLowRuns['Always Low ε(Validation)'] = percentageLowRuns.apply(
        lambda x: ComputeAllowsLowAccuracy(classifierModelUsed['Threshold'], x['Validation']), axis='columns')
    fig, axes = plt.subplots(ncols=2, figsize=(11, 4), constrained_layout=True)
    #
    graphData = bestModels[
        ['Threshold', 'Random Forest Classifier(Development)', 'Random Forest Classifier(Validation)',
         'Always Low ε(Development)', 'Always Low ε(Validation)']]
    graphData = graphData.melt(id_vars=['Threshold'])
    graphData['Threshold'] = graphData['Threshold'] / 1000

    g = sns.lineplot(data=graphData, x='Threshold', y='value', hue='variable', ax=axes[0])
    g.set(ylim=(.9, 1), ylabel='Accuracy', xlabel=labels.EpsilonFull);
    ##error##

    # g.legend_.set_bestModels['Model'] = bestModels.progress_apply(lambda x: train.TrainRandomForestClassifier(x['Model Params'], x['Threshold'], development), axis='columns')
    bestModels['Random Forest Classifier(Development)'] = bestModels.apply(
        lambda x: train.ComputeClassifierAccuracy(x['Model'], x['Threshold'], development), axis='columns')
    bestModels['Random Forest Classifier(Validation)'] = bestModels.apply(
        lambda x: train.ComputeClassifierAccuracy(x['Model'], x['Threshold'], validation), axis='columns')
    bestModels['Always Low ε(Development)'] = bestModels.apply(
        lambda x: ComputeAllowsLowAccuracy(x['Threshold'], development), axis='columns')
    bestModels['Always Low ε(Validation)'] = bestModels.apply(
        lambda x: ComputeAllowsLowAccuracy(x['Threshold'], validation), axis='columns')
    bestModels.head(1)

    classifierModelUsed = bestModels.iloc[1]

    low = data[data['Epsilon'] < classifierModelUsed['Threshold']].reset_index(drop=True).copy()
    high = data[data['Epsilon'] >= classifierModelUsed['Threshold']].reset_index(drop=True).copy()
    total = len(low) + len(high)

    percentageLowRuns = []
    for lowPercent in range(50, 100, 2):
        lowPercent = lowPercent / 100
        numberOfHighsNeeded = int(len(low) / lowPercent - len(low))
        newHighs = resample(high, n_samples=numberOfHighsNeeded, random_state=82219)
        lowEpsilonDevelopment, lowEpsilonValidation = train.SplitData(pd.concat([low, newHighs], ignore_index=True))

        percentageLowRuns.append([lowPercent, lowEpsilonDevelopment, lowEpsilonValidation])

    percentageLowRuns = pd.DataFrame(percentageLowRuns, columns=['Percentage Low ε', 'Development', 'Validation'])

    percentageLowRuns['Model'] = percentageLowRuns.progress_apply(
        lambda x: train.TrainRandomForestClassifier(classifierModelUsed['Model Params'],
                                                    classifierModelUsed['Threshold'],
                                                    x['Development']), axis='columns')
    percentageLowRuns['Random Forest Classifier(Development)'] = percentageLowRuns.apply(
        lambda x: train.ComputeClassifierAccuracy(x['Model'], classifierModelUsed['Threshold'], x['Development']),
        axis='columns')
    percentageLowRuns['Random Forest Classifier(Validation)'] = percentageLowRuns.apply(
        lambda x: train.ComputeClassifierAccuracy(x['Model'], classifierModelUsed['Threshold'], x['Validation']),
        axis='columns')
    percentageLowRuns['Always Low ε(Development)'] = percentageLowRuns.apply(
        lambda x: ComputeAllowsLowAccuracy(classifierModelUsed['Threshold'], x['Development']), axis='columns')
    percentageLowRuns['Always Low ε(Validation)'] = percentageLowRuns.apply(
        lambda x: ComputeAllowsLowAccuracy(classifierModelUsed['Threshold'], x['Validation']), axis='columns')
    # title('Model (Dataset)')

    graphData = percentageLowRuns.drop(['Development', 'Validation', 'Model'], axis='columns').melt('Percentage Low ε')
    utils.show_dataset_with_info(graphData, 'Graph Data')

    g = sns.lineplot(data=graphData, x='Percentage Low ε', y='value', hue='variable', ax=axes[1])
    g.set(ylabel='Accuracy', xlabel='Percentage Low ε in Dataset')
    g.legend_.set_title('Model(Dataset)')

    fig.savefig('./output/chart-overall-RandomForestClassifier.png', bbox_inches='tight', dpi=600)

    # st.pyplot(g.get_figure())
    utils.savefigure('chart-overall-RandomForestClassifier', g.get_figure())

    # print('Classifier model used in experiments:')
    # print('Threshold of ' + str(classifierModelUsed['Threshold']))
    # utils.show_dataset_with_info(classifierModelUsed['Model Params'],'Model Params')

    # show problem cause: dictionary data
    display(classifierModelUsed['Model Params'])
