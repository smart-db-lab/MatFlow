from django.http import JsonResponse
from sklearn.svm import SVR
from sklearn.model_selection import RandomizedSearchCV
from ..utils import (
    parse_int,
    parse_float,
    parse_choice,
    params_to_table,
    error_payload,
)


def hyperparameter_optimization(X_train, y_train,file):
    try:
        cv = parse_int(file.get("Number of cross-validation folds"), 3, min_value=2)
        n_iter = parse_int(file.get("Number of iterations for hyperparameter search"), 10, min_value=1)
        random_state = parse_int(file.get("Random state for hyperparameter search"), 42)
        param_dist = {
            "kernel": ["linear", "rbf", "poly", "sigmoid"],
            "C": [0.1, 1.0, 10.0],
            "epsilon": [0.1, 0.01, 0.001],
        }
        model = SVR()
        clf = RandomizedSearchCV(
            model,
            param_distributions=param_dist,
            n_iter=n_iter,
            n_jobs=-1,
            cv=cv,
            random_state=random_state,
        )
        clf.fit(X_train, y_train)
        best_params = clf.best_params_
        obj = {
            "result": params_to_table(best_params),
            "param": best_params,
        }
        return JsonResponse(obj)
    except Exception as exc:
        return JsonResponse(
            error_payload("Failed to optimize Support Vector Regressor hyperparameters.", str(exc)),
            status=400,
        )

def support_vector_regressor(X_train, y_train,file):
    kernel = parse_choice(file.get("kernel", "rbf"), ["linear", "rbf", "poly", "sigmoid"], "rbf")
    C = parse_float(file.get("C"), 1.0, min_value=0.0)
    epsilon = parse_float(file.get("epsilon"), 0.1, min_value=0.0)
    model = SVR(
            kernel=kernel,
            C=C,
            epsilon=epsilon
    )
    return model
