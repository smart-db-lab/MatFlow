import pandas as pd
import numpy as np

from . import utils
from . import features
import tqdm.notebook
tqdm.notebook.tqdm_notebook.pandas()
def training():
    temp = utils.LoadDataFromOutput('extraction-deep4Chem')
    utils.show_dataset_with_info(temp, 'Deep4Chem dataset')
    temp['Source'] = 'Deep4Chem'
    # print(len(temp))
    # temp.head(1)
    temp['Epsilon'] = temp['Log(Epsilon)'].apply(lambda x: 10 ** x)

    temp['Smiles'] = temp['Chromophore']
    temp.rename(columns={'Chromophore': 'Source Key'}, inplace=True)

    temp = temp[['Source', 'Source Key', 'Epsilon', 'Smiles']]

    data = temp.copy()
    temp = utils.LoadDataFromOutput('extraction-photoChemCAD3')
    utils.show_dataset_with_info(temp, 'PhotoChemCAD3 dataset')

    temp['Source'] = 'PhotoChemCAD3'
    temp.columns = temp.columns.str.replace('_', ' ').str.title()
    # print(len(temp))
    # temp.head(1)
    temp.rename(columns={'Name': 'Source Key'}, inplace=True)

    temp = temp[['Source', 'Source Key', 'Epsilon', 'Smiles']]

    data = data.append(temp)
    temp = utils.LoadDataFromOutput('extraction-dyomics')
    utils.show_dataset_with_info(temp, 'Dyomics dataset')
    temp['Source'] = 'Dyomics'
    temp.columns = temp.columns.str.replace('_', ' ').str.title()
    # print(len(temp))
    # temp.head(1)
    temp.rename(columns={'Molar Absorbance': 'Epsilon', 'Name': 'Source Key'}, inplace=True)

    temp = temp[['Source', 'Source Key', 'Epsilon', 'Smiles']]

    data = data.append(temp)
    data.reset_index(drop=True, inplace=True)
    utils.show_dataset_with_info(data, 'Combined dataset')
    # data
    temp = data['Smiles'].drop_duplicates().to_frame()

    temp = temp.join(temp['Smiles'].progress_apply(features.ComputeAllFeatures).apply(
        lambda x: pd.Series(x, dtype='object'))).fillna(0)

    data = data.merge(temp, on='Smiles')
    if ('Error' in data.columns):
        data = data[data['Error'] != True].reset_index(drop=True)
        data.drop(['Error'], axis='columns', inplace=True)
    data.columns = data.columns.str.replace('_', ' ').str.title()

    # Compressing data
    utils.ConvertFloatColumnsToIntegerIfNoDataLoss(data)
    utils.CompressIntegerColumns(data)
    utils.SaveDataToOutput(data, 'dataset-allKnownEpsilon')
    utils.show_dataset_with_info(data, 'Saved dataset-allKnownEpsilon')
    utils.LoadDataFromOutput('dataset-allKnownEpsilon')
    data.drop(['Source', 'Source Key', 'Smiles', 'Inchikey'], axis='columns', inplace=True)
    # data.head(1)
    limit = 800000
    # print('Number of entries >= 800K: ' + str(len(data[data['Epsilon'] >= limit])))
    data = data[data['Epsilon'] < limit].copy()

    # print('Columns with infinate values: ' + str(data.columns[np.isinf(data).any()].values))
    # print('Number of entries with infinate values: ' + str(len(data.index[np.isinf(data).any(1)])))

    data.replace([np.inf, -np.inf], np.nan, inplace=True)
    data.dropna(inplace=True)
    data.reset_index(drop=True, inplace=True)
    utils.RemoveStaticColumns(data)
    # print('-----------------')
    # print('-----------------')
    # print('-----------------')
    utils.RemoveDuplicateColumns(data)
    # data.info()
    utils.InspectColumnValues(data)
    # data.describe()
    utils.ShowHistogramCharts(data, 'dataset-training')

    def SplitData(data):
        validation = data.sample(frac=.1, random_state=82219)
        development_mask = pd.Series(True, index=data.index)
        development_mask[validation.index] = False
        development = data[development_mask].copy()
        development.reset_index(drop=True, inplace=True)
        validation.reset_index(drop=True, inplace=True)

        return development, validation

    development, validation = SplitData(data)
    utils.SaveDataToOutput(development, 'dataset-development')
    utils.show_dataset_with_info(development, 'Saved dataset-development')
    utils.LoadDataFromOutput('dataset-development')
    utils.SaveDataToOutput(validation, 'dataset-validation')
    utils.show_dataset_with_info(validation, 'Saved dataset-validation')
    utils.LoadDataFromOutput('dataset-validation')