
from django.http import JsonResponse
from sklearn.linear_model import Lasso
from sklearn.model_selection import RandomizedSearchCV
from ..utils import (
    parse_bool,
    parse_int,
    parse_float,
    params_to_table,
    error_payload,
)


def hyperparameter_optimization(X_train, y_train,file):
    try:
        n_iter = parse_int(file.get("Number of iterations for hyperparameter search"), 10, min_value=1)
        cv = parse_int(file.get("Number of cross-validation folds"), 3, min_value=2)
        random_state = parse_int(file.get("Random state for hyperparameter search"), 42)
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

        obj = {
            "result": params_to_table(best_params),
            "param": best_params,
        }
        return JsonResponse(obj)
    except Exception as exc:
        return JsonResponse(
            error_payload("Failed to optimize Lasso Regression hyperparameters.", str(exc)),
            status=400,
        )

def lasso_regression(X_train,y_train,file):
    alpha = parse_float(file.get("alpha"), 1.0, min_value=0.0)
    fit_intercept = parse_bool(file.get("fit_intercept"), True)
    max_iter = parse_int(file.get("max_iter"), 1000, min_value=1)
    selection = file.get("selection", "cyclic")
    tol = parse_float(file.get("tol"), 0.0001, min_value=0.0)
    warm_start = parse_bool(file.get("warm_start"), False)
    model = Lasso(
        alpha=alpha,
        fit_intercept=fit_intercept,
        max_iter=max_iter,
        selection=selection,
        tol=tol,
        warm_start=warm_start,
    )
    return model
