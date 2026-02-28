import pandas as pd
import numpy as np
import seaborn as sns
from dask.diagnostics import ProgressBar
pbar = ProgressBar()
import tqdm.notebook
tqdm.notebook.tqdm_notebook.pandas()

from . import utils
from . import labels
def overall_Data():
    sns.set_theme(style="whitegrid", font_scale=1.1, font='Calibri')
    sns.despine(left=True)

    colors = ['#e66101', '#fdb863', '#b2abd2', '#5e3c99']
    sns.set_palette(sns.color_palette(colors))
    figureSize = (4, 3)
    padInches = 0.05
    data = utils.LoadDataFromOutput('dataset-allKnownEpsilon')
    utils.show_dataset_with_info(data, 'AllKnownEpsilon dataset')
    # data.head(1)

    limit = 800000
    print('Number of entries >= 800K: ' + str(len(data[data['Epsilon'] >= limit])))
    data = data[data['Epsilon'] < limit].copy()

    numberColumns = data.select_dtypes(exclude='object').columns
    # print(
    #     'Columns with infinate values: ' + str(data[numberColumns].columns[np.isinf(data[numberColumns]).any()].values))
    # print('Number of entries with infinate values: ' + str(
    #     len(data[numberColumns].index[np.isinf(data[numberColumns]).any(1)])))

    data.replace([np.inf, -np.inf], np.nan, inplace=True)
    data.dropna(inplace=True)
    data.reset_index(drop=True, inplace=True)
    graphData = data[data['Epsilon'] != -1].copy()
    graphData['IsHigh'] = graphData['Epsilon'] >= 150000
    graphData = graphData.groupby(['Source']).agg(Total=('IsHigh', 'count'), High_ε=('IsHigh', 'sum')).reset_index()
    utils.show_dataset_with_info(graphData, 'graph dataset')
    temp = graphData.sum()
    temp['Source'] = 'Total'
    temp.to_frame().T

    graphData = pd.concat([temp.to_frame().T, graphData])
    # graphData

    graphData.columns = graphData.columns.str.replace('_', ' ')
    graphData['Low ' + labels.Epsilon] = graphData['Total'] - graphData['High ' + labels.Epsilon]
    graphData = graphData[['Source', 'Low ' + labels.Epsilon, 'High ' + labels.Epsilon]].melt(id_vars='Source')

    g = sns.barplot(data=graphData, x='Source', y='value', hue='variable', palette=[colors[1], colors[0]])
    g.set_ylabel('Count')
    for ax in g.axes.containers:
        g.axes.bar_label(ax, label_type='edge')

    g.legend(title='');
    g.figure.tight_layout()
    g.get_figure().savefig('./output/chart-overall-data.png', bbox_inches='tight', dpi=600)
    utils.savefigure('chart-overall-data', g.get_figure())
