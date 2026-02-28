import pandas as pd
import numpy as np
from . import utils


def deep4che():
    data = pd.read_csv('./rawData/Deep4Chem/DB for chromophore_Sci_Data_rev02.csv')
    df = pd.read_csv('./rawData/Deep4Chem/DoubleCheck-High Extinction.csv')
    utils.show_dataset_with_info(data, 'DB for chromophore_Sci_Data_rev02.csv')
    utils.show_dataset_with_info(df, 'DoubleCheck-High Extinction.csv')
    temp = df[['Tag', 'Should be']]
    temp['log(Epsilon)'] = temp['Should be'].apply(lambda x: x if x != 'x' else np.nan).astype('float').apply(np.log10)
    data = data.merge(temp, on='Tag', how='left')
    utils.show_dataset_with_info(data, 'Processed Dataset')
    data['log(Epsilon)'] = data['log(Epsilon)'].fillna(data['log(e/mol-1 dm3 cm-1)'])
    data.drop(['Tag', 'Reference', 'Should be', 'log(e/mol-1 dm3 cm-1)'], axis='columns', inplace=True)
    data = data[data['log(Epsilon)'].isnull() == False].copy().reset_index(drop=True)
    data = data[data['log(Epsilon)'].isnull() == False].copy().reset_index(drop=True)
    data.columns = data.columns.str.replace('_', ' ').str.title()
    utils.DropAllNullColumns(data)
    utils.ConvertStringColumnsToInt(data)
    utils.ConvertFloatColumnsToIntegerIfNoDataLoss(data)
    utils.CompressIntegerColumns(data)
    utils.InspectColumnValues(data)
    utils.SaveDataToOutput(data, 'extraction-deep4Chem')
    utils.ShowHistogramCharts(data, 'extraction-deep4Chem')
    utils.LoadDataFromOutput('extraction-deep4Chem')

