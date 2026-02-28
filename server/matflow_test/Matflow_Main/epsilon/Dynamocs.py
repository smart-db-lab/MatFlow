import re
from io import StringIO
import pandas as pd
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser
from . import utils

def dynamocs():
    def GetPageText(page, resourceManager):
        result = StringIO()
        converter = TextConverter(resourceManager, result,
                                  laparams=LAParams(boxes_flow=1, char_margin=1000, line_margin=10,
                                                    detect_vertical=True, all_texts=False))
        PDFPageInterpreter(resourceManager, converter).process_page(page)

        return result.getvalue()

    pagesRaw = []
    with open('./rawData/Dyomics/Dyomics_2017.pdf', 'rb') as in_file:
        resourceManager = PDFResourceManager()

        count = 0
        for page in PDFPage.create_pages(PDFDocument(PDFParser(in_file))):
            pageText = GetPageText(page, resourceManager)
            pagesRaw.append({'page number': count, 'id': page.pageid, 'page text': pageText})
            count += 1

    def GetDyeInformationText(text):
        dyeInformation = re.split('(.+)\n(?=Absorption.+)', text)
        if (len(dyeInformation) == 1):
            return None

        results = []

        # print(dyeInformation)
        for i in range(1, len(dyeInformation), 2):
            results.append([dyeInformation[i], dyeInformation[i + 1]])

        return results

    pages = pd.DataFrame(pagesRaw)
    pages['dye information text list'] = pages['page text'].apply(GetDyeInformationText)
    utils.show_dataset_with_info(pages, 'Dye Info Text')

    data = pages[pages['dye information text list'].isnull() == False]['dye information text list'] \
        .apply(lambda x: pd.Series(x)) \
        .stack() \
        .reset_index(level=1, drop=True) \
        .apply(lambda x: pd.Series(x)) \
        .rename(columns={0: 'name', 1: 'dye information text'}) \
        .join(pages) \
        .reset_index(drop=True)

    # data.head(1)

    def BreakOutTextChunks(dyeText):
        dyeText = dyeText.strip()
        result = {}
        temp = re.search('^Absorption/emission max.+\n', dyeText)
        if (temp):
            result['absorption text'] = temp.group(0).strip()
        else:  # Handling page 91's different format
            temp = re.search('^Absorption max.+\n(Emission max.+)*', dyeText)
            result['absorption text'] = temp.group(0).strip()

        dyeText = dyeText.replace(result['absorption text'], '').strip()
        temp = re.search('^Molar absorbance.+\n', dyeText)
        result['molar absorbance text'] = temp.group(0).strip()
        dyeText = dyeText.replace(result['molar absorbance text'], '').strip()

        temp = re.search('.+Productnumber.*\n', dyeText)
        tableHeader = temp.group(0).strip()
        temp = dyeText.split(tableHeader)
        result['comments text'] = temp[0].strip()
        result['table information text'] = temp[1].strip()

        return result

    data = data['dye information text'].apply(BreakOutTextChunks) \
        .apply(lambda x: pd.Series(x)) \
        .join(data)
    # data.head(1)
    def GetAbsorptions(absorptionText):
        temp = re.search('([0-9]+)[^0-9]+([0-9]+) nm (.+)', absorptionText)

        result = {}

        if (temp):
            result['absorption'] = temp.group(1)
            result['emission max'] = temp.group(2)
            result['solution'] = temp.group(3)

            return result

        temp = re.search('([0-9]+) nm (.+)', absorptionText)
        if (temp):
            result['absorption'] = temp.group(1)
            result['solution'] = temp.group(2)
            result['emission max'] = '0'
        else:
            result['absorption'] = result['emission max'] = result['solution'] = 'Error'

        return result

    data = data['absorption text'].apply(GetAbsorptions) \
        .apply(lambda x: pd.Series(x)) \
        .join(data)

    utils.show_dataset_with_info(data, 'Processing Absorptions Text')


    def GetMolarAbsorbance(molarAbsorbanceText):
        return re.search('(([0-9]|,)+)', molarAbsorbanceText).group(0)

    data['molar absorbance'] = data['molar absorbance text'].apply(GetMolarAbsorbance)
    # data.head(1)

    data = data['table information text'].apply(lambda x: x.splitlines()) \
        .apply(lambda x: pd.Series(x)) \
        .stack() \
        .reset_index(level=1, drop=True) \
        .to_frame('table information row text') \
        .join(data) \
        .reset_index(drop=True)

    # data.head(1)
    utils.show_dataset_with_info(data, 'Processing Molar Absorbance Text')
    def GetWeight(line):
        if (len(line) <= 10):
            return 'Error: Short string found'

        weightText = re.search('([0-9]+\.[0-9]+)', line)
        if (weightText == None):
            if (re.search('^[^0-9]+$', line)):
                return 'Error: Label found'

            if (re.search('^[A-Z]*([0-9]| |,)+$', line)):
                return 'Error: Graph axis found'

            if (re.search('[0-9]+nm', line)):
                return 'Error: Label found'

            return 'Error: No weight found'

        return weightText.group(0)

    def GetTableRowInformation(tableInformationRow):
        result = {}
        result['weight'] = GetWeight(tableInformationRow)

        if ('Error' in result['weight']):
            return result

        temp = tableInformationRow.split(result['weight'])
        result['available modification'] = temp[0].strip()

        t = re.split('([^\s]+)', temp[1])
        result['product number'] = t[len(t) - 2]

        result['formula'] = temp[1].replace(result['product number'], '').strip()

        return result

    data = data['table information row text'].apply(GetTableRowInformation) \
        .apply(lambda x: pd.Series(x)) \
        .join(data)

    # st.write(data.head(1))

    # Dropping MitoDy-1 that have errors since one row is correct except for the product number and formula
    data = data[
        (data['name'] != 'MitoDy-1') | ((data['name'] == 'MitoDy-1') & (data['weight'].str.contains('Error') == False))]

    # Fixing product number
    mask = data['name'] == 'MitoDy-1'
    data.loc[mask, 'product number'] = 'MTD-1'
    data.loc[mask, 'formula'] = 'C21H25N2O3 * BF4'

    # Fixing some spaces in names
    data['name'] = data['name'].str.strip()

    if (len(data[data['weight'] == 'Error: No weight found']) != 0):
        raise 'new unhandled errors found'

    data = data[(data['weight'].str.contains('Error') == False)]

    # utils.InspectColumnValues(data[['available modification', 'product number', 'formula', 'weight']])

    # for column in ['product number', 'formula', 'weight', 'molar absorbance', 'emission max']:
    #     st.write(('All values for ' + column))
    # st.write((data.columns.unique()))
    data.drop(data.columns[data.columns.str.contains(' text')], axis='columns', inplace=True)
    data.drop(['page number', 'id'], axis='columns', inplace=True)
    utils.show_dataset_with_info(data, 'Cleaned Data')

    temp = pd.read_csv('./rawData/Dyomics/SmilesData.csv')
    temp['Name'] = temp['Name'].str.upper()
    temp['Smiles'] = temp['Correct Smiles'].fillna(temp['Generated Smiles'])
    temp = temp[['Name', 'Smiles']]
    utils.show_dataset_with_info(temp, 'Combined Processed Data with Smiles')
    # st.write(temp)

    data = data.merge(temp, left_on='name', right_on='Name')
    data.drop(['Name'], axis='columns', inplace=True)

    # st.write(('Total Count: ' + str(len(data))))
    # st.write(data.head(1))

    data.columns = data.columns.str.replace('_', ' ').str.title()
    # st.write(data.columns)

    utils.DropAllNullColumns(data)
    utils.ConvertStringColumnsToInt(data)
    utils.ConvertStringColumnsToFloat(data)
    utils.CompressIntegerColumns(data)
    # st.write(data.info())
    utils.InspectColumnValues(data)
    # st.write(data.describe())
    utils.SaveDataToOutput(data, 'extraction-dyomics')
    utils.ShowHistogramCharts(data, 'extraction-dyomics')
    utils.LoadDataFromOutput('extraction-dyomics')
