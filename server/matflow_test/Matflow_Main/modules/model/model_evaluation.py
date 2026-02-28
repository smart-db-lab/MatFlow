import numpy as np
import pandas as pd

from lazypredict.Supervised import LazyRegressor, LazyClassifier
from matplotlib import pyplot as plt
from modules.utils import split_xy
import seaborn as sns


def model_evaluation(dataset):
    try:
        train_data = st.session_state.dataset.get_data(dataset['train_name'])
        test_data = st.session_state.dataset.get_data(dataset['test_name'])
        target_var = dataset['target_var']
        X_train, y_train = split_xy(train_data, target_var)
        X_test, y_test = split_xy(test_data, target_var)
        target_var_type = train_data[target_var].dtype

    except:
        st.header("Properly Split Dataset First")
        return

    col1, col2 = st.columns([4, 4])

    if target_var_type == "float64" or target_var_type == "int64":

        st.write(f''' ##### As the target variable '***{target_var}***' is :blue[Continuous], Regression models are chosen.''')
        st.write('#')

        reg = LazyRegressor(verbose=0, ignore_warnings=False, custom_metric=None)
        models, predictions = reg.fit(X_train, X_test, y_train, y_test)
        st.dataframe(models)

        try:

            st.header("LazyRegressor Results - R-Squared Comparison")
            plt.figure(figsize=(4, 8))
            sns.set_theme(style="whitegrid")
            ax = sns.barplot(y=models.index, x="R-Squared", data=models)
            ax.set(xlim=(0, 1))
            st.pyplot(plt)
        except:
            st.error('Choose target variable properly.')

        # st.write(predictions)

    else:

        st.write(f''' ##### As the target variable '***{target_var}***' is :orange[Categorical], Classification models are chosen.''')
        st.write('#')

        clf = LazyClassifier(verbose=0, ignore_warnings=True, custom_metric=None)
        models, predictions = clf.fit(X_train, X_test, y_train, y_test)
        st.dataframe(models)

        try:
            st.header("Accuracy Comparison of Models")
            plt.figure(figsize=(4, 8))
            sns.set_theme(style="whitegrid")
            ax = sns.barplot(y=models.index, x="Accuracy", data=models)
            ax.set(xlim=(0, 1))
            plt.xticks(rotation=90)
            st.pyplot(plt)
        except:
            st.error('Choose target variable properly.')
