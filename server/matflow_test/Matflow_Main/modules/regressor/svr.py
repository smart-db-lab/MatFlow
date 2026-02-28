import time

import pandas as pd

from django.http import JsonResponse
from sklearn.svm import SVR
from sklearn.model_selection import RandomizedSearchCV


def hyperparameter_optimization(X_train, y_train,file):
    print(file.keys())
    print("svr")

    cv = int(file.get("Number of cross-validation folds"))
    param_dist = {
        "kernel": ["linear", "rbf", "poly", "sigmoid"],
        "C": [0.1, 1.0, 10.0],
        "epsilon": [0.1, 0.01, 0.001],
    }
    model = SVR()
    clf = RandomizedSearchCV(model, param_distributions=param_dist, n_jobs=-1, cv=cv)
    clf.fit(X_train, y_train)
    best_params = clf.best_params_
    rows = []
    for param in best_params:
        rows.append([param, best_params[param]])
    table = pd.DataFrame(rows, columns=['Parameter', 'Value'])
    table=table.to_dict(orient="records")
    obj = {
        "result": table,  # table
        "param": best_params  # parameter
    }
    return JsonResponse(obj)

def support_vector_regressor(X_train, y_train,file):
    kernel = file.get("kernel")
    C = float(file.get("C"))
    epsilon = float(file.get("epsilon"))
    model = SVR(
            kernel=kernel,
            C=C,
            epsilon=epsilon
    )
    return model
