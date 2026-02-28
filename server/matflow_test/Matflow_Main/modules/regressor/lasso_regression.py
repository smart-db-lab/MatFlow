
from django.http import JsonResponse
from sklearn.linear_model import Lasso
import pandas as pd
import time
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV


def hyperparameter_optimization(X_train, y_train,file):
    n_iter = int(file.get("Number of iterations for hyperparameter search"))
    cv = int(file.get("Number of cross-validation folds"))
    random_state = int(file.get("Random state for hyperparameter search"))
    param_dist = {
        "alpha": [0.001, 0.01, 0.1, 1, 10],
        "fit_intercept": [True, False],
        "max_iter": [1000, 5000, 10000],
        "positive": [True, False],
        "selection": ["cyclic", "random"],
        "tol": [0.0001, 0.001, 0.01, 0.1],
        "warm_start": [True, False]
    }
    model = Lasso()

    clf = RandomizedSearchCV(model, param_distributions=param_dist, n_iter=n_iter, cv=cv,
                             random_state=random_state)
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

def lasso_regression(X_train,y_train,file):
    alpha = int(file.get("alpha"))
    fit_intercept = file.get("fit_intercept")
    # normalize = file.get("Normalize")
    max_iter = int(file.get("max_iter"))
    selection = file.get("selection")
    model = Lasso(alpha=alpha, fit_intercept=fit_intercept, max_iter=max_iter,
                      selection=selection)
    return model
