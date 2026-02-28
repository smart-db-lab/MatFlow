
import pandas as pd
from ...modules import utils
from ...modules.classes import model
from ...modules.model import model_report, prediction_classification, prediction_regression, delete_model, split_dataset, \
    model_evaluation, feature_selection, classification, regression

def build_model(file):
    type = file.get("type")
    if 'Classification'==type:
        classification.classification(file)
    else:
        regression.regression(file)