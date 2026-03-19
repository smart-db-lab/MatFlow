import pandas as pd

from django.http import JsonResponse
from rest_framework import status

from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV

from ..utils import error_payload, parse_choice, parse_int


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
            "n_neighbors": [3, 5, 10, 15, 20, 25],
            "weights": ["uniform", "distance"],
            "metric": ["minkowski", "euclidean", "manhattan"],
        }
        model = KNeighborsClassifier()
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
        return _error_response("Invalid KNN optimization input.", str(exc))
    except Exception as exc:
        return _error_response(
            "Failed to run KNN hyperparameter optimization.",
            str(exc),
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def knn(X_train, y_train,file):
    _validate_training_data(X_train, y_train)

    n_neighbors = parse_int(file.get("n_neighbors"), default=5, min_value=1)
    if n_neighbors > len(X_train):
        raise ValueError(
            f"n_neighbors ({n_neighbors}) cannot be greater than training rows ({len(X_train)})."
        )

    weights = parse_choice(file.get("weights"), ["uniform", "distance"], "uniform")
    metric = parse_choice(
        file.get("metric"),
        ["minkowski", "euclidean", "manhattan"],
        "minkowski",
    )

    return KNeighborsClassifier(n_neighbors=n_neighbors, weights=weights, metric=metric)
