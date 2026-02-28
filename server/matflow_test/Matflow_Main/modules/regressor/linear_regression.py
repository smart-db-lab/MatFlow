import json

import pandas as pd

from django.http import JsonResponse
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GridSearchCV


def hyperparameter_optimization(X_train, y_train,file):
    cv = int(file.get("Number of cross-validation folds"))
    random_state = int(file.get("Random state for hyperparameter search"))
    param_grid = {
        "fit_intercept": [True, False],
    }
    model = LinearRegression()
    clf = GridSearchCV(model, param_grid=param_grid, cv=cv, n_jobs=-1)
    clf.fit(X_train, y_train)
    best_params = clf.best_params_
    rows = []
    for param in best_params:
        rows.append([param, best_params[param]])
    table=pd.DataFrame(rows, columns=['Parameter', 'Value'])
    table=table.to_dict(orient="records")
    obj = {
        "result": table,    #table
        "param": best_params     #parameter
    }
    return JsonResponse(obj)

def linear_regression(X_train,y_train,file):
    fit_intercept = bool(file.get("Fit Intercept"))
    normalize = file.get("Normalize")

    n_jobs = int(file.get("Number of jobs"))
    model = LinearRegression(fit_intercept=fit_intercept, n_jobs=n_jobs)
    return model