import json

import matplotlib
import pandas as pd
from django.http import JsonResponse
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from eda.graph.barplot import barplot
from eda.graph.boxplot import boxplot
from eda.graph.countplot import countplot
from eda.graph.customplot import customplot
from eda.graph.histogram import histogram
from eda.graph.lineplot import lineplot
from eda.graph.pieplot import pieplot
from eda.graph.regplot import regplot
from eda.graph.scatterplot import scatterplot
from eda.graph.vennDiagram import venn_diagram
from eda.graph.violinplot import violinplot
from eda.graph.vennDiagram import venn_diagram

# Ensure the 'Agg' backend is used for matplotlib
matplotlib.use('Agg')


class EDA(APIView):
    permission_classes = [AllowAny]

    def post(self, request, plot_type):
        data = json.loads(request.body)
        file = data.get('file')
        df = pd.DataFrame(file)
        # Based on plot_type, call the appropriate method
        if plot_type == 'barplot':
            return barplot(df, data)
        elif plot_type == 'boxplot':
            return boxplot(df, data)
        elif plot_type == 'countplot':
            return countplot(df, data)
        elif plot_type == 'histogram':
            return histogram(df, data)
        elif plot_type == 'lineplot':
            return lineplot(df, data)
        elif plot_type == 'pieplot':
            return pieplot(df, data)
        elif plot_type == 'regplot':
            return regplot(df, data)
        elif plot_type == 'scatterplot':
            return scatterplot(df, data)
        elif plot_type == 'violinplot':
            return violinplot(df, data)
        elif plot_type == 'venn-diagram':
            return venn_diagram(df,data)
        else:
            return JsonResponse({'error': 'Invalid plot type'}, status=400)
