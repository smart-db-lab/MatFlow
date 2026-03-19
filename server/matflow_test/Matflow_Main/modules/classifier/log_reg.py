import pandas as pd
from django.http import JsonResponse
from rest_framework import status

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import RandomizedSearchCV

from ..utils import error_payload, parse_choice, parse_float, parse_int


def _error_response(message, details=None, status_code=status.HTTP_400_BAD_REQUEST):
    return JsonResponse(error_payload(message, details), status=status_code)


def _validate_training_data(X_train, y_train):
    if X_train is None or y_train is None:
        raise ValueError("Training dataset is missing.")
    if len(X_train) == 0 or len(y_train) == 0:
        raise ValueError("Training dataset is empty.")


def _normalize_penalty(value):
    if value in {None, "none", "None", "NONE"}:
        return None
    return value


def _validate_penalty_solver(penalty, solver):
    allowed = {
        "lbfgs": {"l2", None},
        "newton-cg": {"l2", None},
        "liblinear": {"l1", "l2"},
        "sag": {"l2", None},
        "saga": {"l1", "l2", "elasticnet", None},
    }
    if penalty not in allowed.get(solver, set()):
        raise ValueError(
            f"Penalty '{penalty}' is not supported by solver '{solver}'."
        )

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
            "penalty": ["l1", "l2", "elasticnet", None],
            "C": [0.01, 0.1, 1, 10, 100],
            "solver": ["lbfgs", "liblinear", "newton-cg", "sag", "saga"],
            "max_iter": [100, 200, 300, 400, 500],
            "tol": [1e-4, 1e-3, 1e-2],
            "random_state": [42],
            "l1_ratio": [0.1, 0.5, 0.9],
        }
        model = LogisticRegression()

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

        best_param = clf.best_params_
        obj = {
            "result": results_df.to_dict(orient="records"),
            "param": best_param,
        }
        return JsonResponse(obj)
    except ValueError as exc:
        return _error_response("Invalid Logistic Regression optimization input.", str(exc))
    except Exception as exc:
        return _error_response(
            "Failed to run Logistic Regression hyperparameter optimization.",
            str(exc),
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def log_reg(X_train, y_train,file):
    _validate_training_data(X_train, y_train)

    penalty = _normalize_penalty(file.get("penalty"))
    penalty = parse_choice(penalty, [None, "l1", "l2", "elasticnet"], "l2")
    solver = parse_choice(
        file.get("solver"),
        ["lbfgs", "liblinear", "newton-cg", "sag", "saga"],
        "lbfgs",
    )
    _validate_penalty_solver(penalty, solver)

    C = parse_float(file.get("C"), default=1.0, min_value=1e-12)
    max_iter = parse_int(file.get("max_iter"), default=100, min_value=1)
    tol = parse_float(file.get("tol"), default=0.0001, min_value=1e-12)
    random_state = parse_int(file.get("random_state"), default=42)

    kwargs = {
        "penalty": penalty,
        "C": C,
        "tol": tol,
        "solver": solver,
        "max_iter": max_iter,
        "random_state": random_state,
    }

    if penalty == "elasticnet":
        kwargs["l1_ratio"] = parse_float(file.get("l1_ratio"), default=0.5, min_value=0.0, max_value=1.0)

    return LogisticRegression(**kwargs)
