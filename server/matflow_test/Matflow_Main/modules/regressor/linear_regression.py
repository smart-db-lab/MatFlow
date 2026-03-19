from django.http import JsonResponse
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GridSearchCV
from ..utils import (
    parse_bool,
    parse_int,
    params_to_table,
    error_payload,
)


def hyperparameter_optimization(X_train, y_train,file):
    try:
        cv = parse_int(file.get("Number of cross-validation folds"), 3, min_value=2)
        param_grid = {
            "fit_intercept": [True, False],
        }
        model = LinearRegression()
        clf = GridSearchCV(model, param_grid=param_grid, cv=cv, n_jobs=-1)
        clf.fit(X_train, y_train)
        best_params = clf.best_params_
        obj = {
            "result": params_to_table(best_params),
            "param": best_params,
        }
        return JsonResponse(obj)
    except Exception as exc:
        return JsonResponse(
            error_payload("Failed to optimize Linear Regression hyperparameters.", str(exc)),
            status=400,
        )


def linear_regression(X_train,y_train,file):
    fit_intercept = parse_bool(file.get("fit_intercept", file.get("Fit Intercept")), default=True)
    n_jobs = parse_int(file.get("Number of jobs", -1), -1)
    model = LinearRegression(fit_intercept=fit_intercept, n_jobs=n_jobs)
    return model