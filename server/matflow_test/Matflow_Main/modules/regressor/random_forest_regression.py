from django.http import JsonResponse
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import RandomizedSearchCV
from ..utils import (
    parse_int,
    normalize_none_like,
    parse_choice,
    params_to_table,
    error_payload,
)


def _to_optional_int(value):
    value = normalize_none_like(value)
    if value is None:
        return None
    return parse_int(value, default=None, allow_none=True)


def _to_optional_max_features(value):
    value = normalize_none_like(value)
    if value is None:
        return None
    return parse_choice(value, ["sqrt", "log2"], "sqrt")

def hyperparameter_optimization(X_train, y_train,file):
    try:
        n_iter = parse_int(file.get("Number of iterations for hyperparameter search"), 10, min_value=1)
        cv = parse_int(file.get("Number of cross-validation folds"), 3, min_value=2)
        random_state = parse_int(file.get("Random state for hyperparameter search"), 42)
        param_dist = {
            "n_estimators": [10, 50, 100],
            "criterion": ["friedman_mse", "squared_error", "absolute_error", "poisson"],
            "max_features": ["sqrt", "log2", None],
            "max_depth": [3, 5, 10, 15, 20, 25, None],
            "min_samples_split": [2, 5, 10],
            "min_samples_leaf": [1, 2, 4],
            "n_jobs": [-1],
            "random_state": [random_state],
        }
        model = RandomForestRegressor(random_state=random_state)
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
            error_payload("Failed to optimize Random Forest Regression hyperparameters.", str(exc)),
            status=400,
        )

def random_forest_regressor(X_train, y_train,file):

    n_estimators = parse_int(file.get("n_estimators", 100), 100, min_value=1)
    criterion = parse_choice(
        file.get("criterion", "squared_error"),
        ["friedman_mse", "squared_error", "absolute_error", "poisson"],
        "squared_error",
    )
    max_features = _to_optional_max_features(file.get("max_features"))
    min_samples_split = parse_int(file.get("min_samples_split"), 2, min_value=2)
    max_depth = _to_optional_int(file.get("max_depth"))
    min_samples_leaf = parse_int(file.get("min_samples_leaf"), 1, min_value=1)
    n_jobs = parse_int(file.get("n_jobs", -1), -1)
    random_state = _to_optional_int(file.get("random_state"))

    model = RandomForestRegressor(
        n_estimators=n_estimators,
        criterion=criterion,
        max_depth=max_depth,
        max_features=max_features,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        n_jobs=n_jobs,
        random_state=random_state,
    )

    return model
