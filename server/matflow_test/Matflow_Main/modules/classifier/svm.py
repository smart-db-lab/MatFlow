import pandas as pd
from django.http import JsonResponse
from rest_framework import status
from sklearn.model_selection import RandomizedSearchCV
from sklearn.svm import SVC

from ..utils import error_payload, parse_choice, parse_float, parse_int


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
            "C": [0.1, 1.0, 10.0, 100.0],
            "kernel": ["linear", "poly", "rbf", "sigmoid"],
            "gamma": ["scale", "auto"],
            "degree": [2, 3, 4, 5],
        }
        model = SVC()

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
        return _error_response("Invalid SVM optimization input.", str(exc))
    except Exception as exc:
        return _error_response(
            "Failed to run SVM hyperparameter optimization.",
            str(exc),
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def svm(X_train, y_train,file):
        _validate_training_data(X_train, y_train)

        C = parse_float(file.get("C"), default=1.0, min_value=1e-12)
        kernel = parse_choice(
                file.get("kernel"), ["linear", "poly", "rbf", "sigmoid"], "rbf"
        )
        tol = parse_float(file.get("tol"), default=0.001, min_value=1e-12)
        gamma = parse_choice(file.get("gamma"), ["scale", "auto"], "scale")
        degree = parse_int(file.get("degree"), default=3, min_value=1)

        return SVC(C=C, kernel=kernel, degree=degree, gamma=gamma, tol=tol)
