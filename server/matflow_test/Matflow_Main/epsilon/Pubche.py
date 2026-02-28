import pandas as pd
from . import utils
import os
def pubche():
    temp = []
    dataDirectory = './rawData/PubChem/'
    for file in os.listdir(dataDirectory):
        temp.append(pd.read_csv(os.path.join(dataDirectory, file)))
        utils.show_dataset_with_info(temp[-1], 'Dataset ' + file.title())
    data = pd.concat(temp).drop_duplicates(ignore_index=True)
    utils.show_dataset_with_info(data, 'Combined dataset without duplicate entry')
    data.columns = data.columns.str.replace('_', ' ').str.title()
    utils.DropAllNullColumns(data)
    utils.ConvertStringColumnsToInt(data)
    utils.ConvertFloatColumnsToIntegerIfNoDataLoss(data)
    utils.CompressIntegerColumns(data)
    ##data.info()
    utils.InspectColumnValues(data)
    utils.show_dataset_with_info(data, 'Final Dataset')
    # data.describe()
    utils.SaveDataToOutput(data, 'extraction-pubChem')
    utils.ShowHistogramCharts(data, 'extraction-pubChem')
    utils.LoadDataFromOutput('extraction-pubChem')