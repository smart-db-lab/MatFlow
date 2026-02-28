import pandas as pd
from rdkit import Chem
from . import utils
from . import features
def unknown():
    data = utils.LoadDataFromOutput('extraction-pubChem')
    utils.show_dataset_with_info(data, 'PubChem dataset')

    data['Source'] = 'PubChem'
    data.columns = data.columns.str.replace('_', ' ').str.title()
    # print(len(data))
    # data.head(1)
    data['Source Key'] = data['Cid'].astype(str)
    data.rename(columns={'Isosmiles': 'Smiles'}, inplace=True)
    data = data[['Source', 'Source Key', 'Smiles']]
    temp = data['Smiles'].drop_duplicates().to_frame()

    temp = temp.join(temp['Smiles'].progress_apply(features.ComputeAllFeatures).apply(
        lambda x: pd.Series(x, dtype='object'))).fillna(0)

    # Removing any entry that failed to compute all features
    temp = temp[temp['Total Atom Count'].isna() == False].drop_duplicates()

    data = data.merge(temp, on='Smiles')

    # len(data)
    data = data[data['Error'] != True].reset_index(drop=True)
    data.drop(['Error'], axis='columns', inplace=True)
    knownEpsilons = utils.LoadDataFromOutput('dataset-allKnownEpsilon')['Smiles'].progress_apply(
        lambda x: Chem.inchi.MolToInchiKey(Chem.MolFromSmiles(x))).to_list()

    data = data[data['InchiKey'].isin(knownEpsilons) == False].reset_index(drop=True)
    # len(data)
    data.drop(['InchiKey'], axis='columns', inplace=True)

    # Standardizing Column names
    data.columns = data.columns.str.replace('_', ' ').str.title()

    # Compressing data
    utils.ConvertFloatColumnsToIntegerIfNoDataLoss(data)
    utils.CompressIntegerColumns(data)
    utils.RemoveStaticColumns(data)
    # print('-----------------')
    # print('-----------------')
    # print('-----------------')
    utils.RemoveDuplicateColumns(data)
    # data.info()
    utils.InspectColumnValues(data)
    # data.describe()
    utils.SaveDataToOutput(data, 'dataset-unknownEpsilon')
    utils.ShowHistogramCharts(data, 'dataset-unknownEpsilon')
    utils.LoadDataFromOutput('dataset-unknownEpsilon')

