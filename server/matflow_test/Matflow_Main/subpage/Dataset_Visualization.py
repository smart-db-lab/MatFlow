

from ..modules import utils
from ..modules.graph import barplot, pieplot, countplot, histogram, boxplot, violinplot, scatterplot, regplot, lineplot


def ds_visualization(dataset, table_name):
    try:
        data = dataset[table_name]
        data_opt = table_name
    except KeyError:
        st.header("No Dataset Found")
        st.stop()

    except Exception as e:
        st.write(e)
        st.stop()


    menus = ["Bar Plot", "Pie Plot", "Count Plot", "Histogram", "Box Plot", "Violin Plot", "Scatter Plot", "Reg Plot",
             "Line Plot"]
    tabs = [tab for tab in st.tabs(menus)]

    with tabs[0]:
        barplot.barplot(data)

    with tabs[1]:
        pieplot.pieplot(data)

    with tabs[2]:
        countplot.countplot(data)

    with tabs[3]:
        histogram.histogram(data)

    with tabs[4]:
        boxplot.boxplot(data)

    with tabs[5]:
        violinplot.violinplot(data)

    with tabs[6]:
        scatterplot.scatterplot(data)

    with tabs[7]:
        regplot.regplot(data)

    with tabs[8]:
        lineplot.lineplot(data)
