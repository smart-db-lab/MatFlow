
from django.http import JsonResponse
from sklearn.linear_model import Ridge
from sklearn.model_selection import RandomizedSearchCV
from ..utils import (
    parse_bool,
    parse_int,
    parse_float,
    normalize_none_like,
    params_to_table,
    error_payload,
)


def _to_optional_int(value):
    value = normalize_none_like(value)
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def hyperparameter_optimization(X_train, y_train,file):
    try:
        n_iter = parse_int(file.get("Number of iterations for hyperparameter search"), 10, min_value=1)
        cv = parse_int(file.get("Number of cross-validation folds"), 3, min_value=2)
        random_state = parse_int(file.get("Random state for hyperparameter search"), 42)
        param_dist = {
                "alpha": [0.001, 0.01, 0.1, 1, 10, 100],
                "fit_intercept": [True, False],
                "solver": ['auto', 'svd', 'cholesky', 'lsqr', 'sparse_cg', 'sag', 'saga'],
                "max_iter": [100, 500, 1000],
                "tol": [0.0001, 0.001, 0.01, 0.1, 1],
                "random_state": [0]
            }
        model = Ridge()
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
            error_payload("Failed to optimize Ridge Regression hyperparameters.", str(exc)),
            status=400,
        )


def ridge_regression(X_train, y_train,file):
    alpha = parse_float(file.get("alpha"), 1.0, min_value=0.0)
    fit_intercept = parse_bool(file.get("fit_intercept"), True)
    max_iter = _to_optional_int(file.get("max_iter"))
    solver = normalize_none_like(file.get("solver")) or "auto"
    tol = parse_float(file.get("tol"), 0.0001, min_value=0.0)
    random_state = _to_optional_int(file.get("random_state"))
    model = Ridge(
        alpha=alpha,
        fit_intercept=fit_intercept,
        max_iter=max_iter,
        solver=solver,
        tol=tol,
        random_state=random_state,
    )
    return model
