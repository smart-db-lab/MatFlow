from django.http import JsonResponse
from sklearn.model_selection import RandomizedSearchCV
from sklearn.tree import DecisionTreeRegressor
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


def hyperparameter_optimization(X_train, y_train,file):
    try:
        n_iter = parse_int(file.get("Number of iterations for hyperparameter search"), 10, min_value=1)
        cv = parse_int(file.get("Number of cross-validation folds"), 3, min_value=2)
        random_state = parse_int(file.get("Random state for hyperparameter search"), 42)

        param_dist = {
            "max_depth": [3, 5, 10, 15, 20, None],
            "min_samples_split": [2, 5, 10],
            "min_samples_leaf": [1, 2, 4],
            "max_features": ["sqrt", "log2", None],
            "criterion": ["absolute_error", 'friedman_mse', 'poisson', 'squared_error'],
            "random_state": [random_state],
        }
        model = DecisionTreeRegressor()

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
            error_payload("Failed to optimize Decision Tree Regression hyperparameters.", str(exc)),
            status=400,
        )

def decision_tree_regressor(X_train, y_train,file):
    criterion = file.get("criterion", "squared_error")
    # Backward compatibility with old UI/defaults
    if criterion == "mse":
        criterion = "squared_error"
    criterion = parse_choice(
        criterion,
        ["absolute_error", "friedman_mse", "poisson", "squared_error"],
        "squared_error",
    )

    min_samples_split = parse_int(file.get("min_samples_split"), 2, min_value=2)
    min_samples_leaf = parse_int(file.get("min_samples_leaf"), 1, min_value=1)
    max_depth = _to_optional_int(file.get("max_depth"))
    random_state = _to_optional_int(file.get("random_state"))
    model = DecisionTreeRegressor(
        criterion=criterion,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        random_state=random_state,
    )


    return model
