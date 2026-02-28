import pandas as pd
from . import utils


def photoche():
    data = pd.read_csv('./rawData/PhotoChemCAD3/2018_03 PCAD3.csv')
    utils.show_dataset_with_info(data, 'PCAD3 Data')
    # st.write(data)
    temp = pd.read_csv('./rawData/PhotoChemCAD3/SmilesData.csv')
    utils.show_dataset_with_info(temp, 'Smiles Data')
    temp['Smiles'] = temp['Correct Smiles'].fillna(temp['Generated Smiles'])
    # st.write(temp.head(1))
    data = data.merge(temp[['Structure', 'Smiles']], on='Structure')
    # st.write(('Total Count: ' + str(len(data))))
    # st.write(data.head(1))
    data.columns = data.columns.str.replace('_', ' ').str.title()
    utils.DropAllNullColumns(data)
    utils.ConvertStringColumnsToInt(data)
    utils.ConvertFloatColumnsToIntegerIfNoDataLoss(data)
    utils.CompressIntegerColumns(data)
    # st.write(data.info())
    utils.InspectColumnValues(data)
    # st.write(data.describe())
    utils.SaveDataToOutput(data, 'extraction-photoChemCAD3')
    utils.ShowHistogramCharts(data, 'extraction-photoChemCAD3')
    utils.LoadDataFromOutput('extraction-photoChemCAD3')