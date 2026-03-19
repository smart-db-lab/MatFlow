import time

import pandas as pd

from django.http import JsonResponse
from rest_framework import status
from sklearn.model_selection import RandomizedSearchCV
from sklearn.tree import DecisionTreeClassifier

from ..utils import (
    error_payload,
    normalize_none_like,
    parse_choice,
    parse_int,
)


def _error_response(message, details=None, status_code=status.HTTP_400_BAD_REQUEST):
    return JsonResponse(error_payload(message, details), status=status_code)


def _validate_training_data(X_train, y_train):
    if X_train is None or y_train is None:
        raise ValueError("Training dataset is missing.")
    if len(X_train) == 0 or len(y_train) == 0:
        raise ValueError("Training dataset is empty.")

def hyperparameter_optimization(X_train, y_train,file):
    try:
        _validate_training_data(X_train, y_train)

        n_iter = parse_int(
            file.get("Number of iterations for hyperparameter search"),
            default=10,
            min_value=1,
        )
        cv = parse_int(
            file.get("Number of cross-validation folds"),
            default=3,
            min_value=2,
        )
        random_state = parse_int(
            file.get("Random state for hyperparameter search"),
            default=42,
        )
        if len(X_train) < cv:
            raise ValueError(
                f"Number of cross-validation folds ({cv}) cannot exceed training rows ({len(X_train)})."
            )

        param_dist = {
            "criterion": ["gini", "entropy", "log_loss"],
            "max_depth": [None, 1, 2, 3, 4, 5, 10, 20, 50, 100],
            "min_samples_split": [2, 5, 10, 20],
            "min_samples_leaf": [1, 2, 4, 8, 10],
            "random_state": [random_state],
        }
        model = DecisionTreeClassifier()
        clf = RandomizedSearchCV(
            model,
            param_distributions=param_dist,
            n_iter=n_iter,
            cv=cv,
            random_state=random_state,
            error_score="raise",
        )
        clf.fit(X_train, y_train)
        cv_results = clf.cv_results_
        param_names = list(cv_results["params"][0].keys())

        results_list = []
        for i in range(len(cv_results["params"])):
            param_dict = {}
            for param in param_names:
                param_dict[param] = cv_results["params"][i][param]
            param_dict["accuracy"] = cv_results["mean_test_score"][i]
            results_list.append(param_dict)

        results_df = pd.DataFrame(results_list)
        results_df = results_df.sort_values(by=["accuracy"], ascending=False)
        obj = {
            "result": results_df.to_dict(orient="records"),
            "param": clf.best_params_,
        }
        return JsonResponse(obj)
    except ValueError as exc:
        return _error_response("Invalid Decision Tree optimization input.", str(exc))
    except Exception as exc:
        return _error_response(
            "Failed to run Decision Tree hyperparameter optimization.",
            str(exc),
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def decision_tree(X_train, y_train,file):
    _validate_training_data(X_train, y_train)

    criterion = parse_choice(
        file.get("criterion"), ["gini", "entropy", "log_loss"], "gini"
    )
    min_samples_split = parse_int(
        file.get("min_samples_split"),
        default=2,
        min_value=2,
    )
    min_samples_leaf = parse_int(
        file.get("min_samples_leaf"),
        default=1,
        min_value=1,
    )

    raw_max_depth = normalize_none_like(file.get("max_depth"))
    if raw_max_depth is None:
        max_depth = None
    else:
        max_depth = parse_int(raw_max_depth, default=5, min_value=1)

    random_state = parse_int(file.get("random_state"), default=42)

    return DecisionTreeClassifier(
        criterion=criterion,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        random_state=random_state,
    )
