
import pandas as pd
from ..modules import utils
from ..modules.classes import model
from ..modules.model import model_report, prediction_classification, prediction_regression, delete_model, split_dataset, \
    model_evaluation, feature_selection, classification, regression


def model_builder(dataset, table_name):
    try:
        dataset = st.session_state["dataset"]

    except KeyError:
        st.header("No Dataset Found")
        return

    except Exception as e:
        st.warning(e)
        return

    menus = ["Split Dataset", "Build Model","Model Evaluation", "Model Prediction",  "Models"]
    tabs = st.tabs(menus)
    #

    try:
        models = st.session_state["models"]
    except:
        st.session_state["models"] = model.Models()
        models = st.session_state["models"]

    with tabs[0]:
        split_dataset.split_dataset(dataset, table_name)
    with tabs[1]:
        if 'splitted_data' in st.session_state:
            split_name = st.selectbox('Select Train Test Dataset', st.session_state.splitted_data.keys())
            if 'Classification' in st.session_state.splitted_data[split_name]['type']:
                classification.classification(split_name, models)
            else:
                regression.regression(split_name, models)
        else:
            st.header('Split Dataset First')
    with tabs[2]:
        if 'all_models' in st.session_state:
            split_name = st.selectbox('Select Train Test Dataset', st.session_state.splitted_data.keys(),
                                      key='evaluation')
            if split_name:
                model_report.model_report(split_name,models)
        else:
            st.header('Build Model First')
    with tabs[3]:
        ## try catch needed here
        if "all_models" in st.session_state:
            all_models = st.session_state.all_models

            model_name = st.selectbox(
                "Select Model",
                all_models.keys()
            )
            if all_models[model_name][0] == 'Classification':
                prediction_classification.prediction(dataset, models, model_name)
            else:
                prediction_regression.prediction(dataset, models, model_name)
        else:
            st.header('No Model Found')
    with tabs[4]:
        if "models" in st.session_state:
            delete_model.delete_model(models)
        else:
            st.header('No Model Found')
