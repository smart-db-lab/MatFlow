import pandas as pd
from django.http import JsonResponse

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import RandomizedSearchCV

def hyperparameter_optimization(X_train, y_train,file):
    n_iter = int(file.get("Number of iterations for hyperparameter search"))
    cv = int(file.get("Number of cross-validation folds"))
    random_state = int(file.get("Random state for hyperparameter search"))
    param_dist = {
        "penalty": ["l1", "l2", "elasticnet", "none"],
        "C": [0.01, 0.1, 1, 10, 100],
        "solver": ["lbfgs", "liblinear", "newton-cg", "sag", "saga"],
        "max_iter": [100, 200, 300, 400, 500],
        "tol": [1e-4, 1e-3, 1e-2],
        "random_state": [42]
    }
    model = LogisticRegression()

    clf = RandomizedSearchCV(model, param_distributions=param_dist, n_iter=n_iter, cv=cv,
                             random_state=random_state)
    clf.fit(X_train, y_train)

    cv_results = clf.cv_results_

    param_names = list(cv_results['params'][0].keys())

    # Create a list of dictionaries with the parameter values and accuracy score for each iteration
    results_list = []
    for i in range(len(cv_results['params'])):
        param_dict = {}
        for param in param_names:
            param_dict[param] = cv_results['params'][i][param]
        param_dict['accuracy'] = cv_results['mean_test_score'][i]
        results_list.append(param_dict)

    results_df = pd.DataFrame(results_list)
    results_df = results_df.sort_values(by=['accuracy'], ascending=False)
    results_df=results_df.to_json(orient="records")

    best_param = clf.best_params_
    obj = {
        "result": results_df,
        "param": best_param
    }
    return JsonResponse(obj)


def log_reg(X_train, y_train,file):
    penalty =file.get("penalty")
    solver = file.get("solver")
    C = float(file.get("C"))
    max_iter = int(file.get("max_iter"))
    tol =float(file.get("tol"))
    random_state =int(file.get("random_state"))
    model = LogisticRegression(penalty=penalty, C=C, tol=tol, solver=solver, max_iter=max_iter,
                                   random_state=random_state)

    return model
