import pandas as pd
from django.http import JsonResponse
from sklearn.model_selection import RandomizedSearchCV
from sklearn.svm import SVC


def hyperparameter_optimization(X_train, y_train,file):
    n_iter = int(file.get("Number of iterations for hyperparameter search"))
    cv = int(file.get("Number of cross-validation folds"))
    random_state = int(file.get("Random state for hyperparameter search"))

    param_dist = {
        "C": [0.1, 1.0, 10.0, 100.0],
        "kernel": ["linear", "poly", "rbf", "sigmoid"],
        "gamma": ["scale", "auto"],
        "degree": [2, 3, 4, 5]
    }
    model = SVC()

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
    results_df=results_df.to_dict(orient="records")
    best_param = clf.best_params_
    obj = {
        "result": results_df,
        "param": best_param
    }
    return JsonResponse(obj)


def svm(X_train, y_train,file):
  #("Model Settings")
    C =int(file.get("C"))
    kernel =file.get("kernel")
    tol = float(file.get("tol"))
    gamma = file.get("gamma")
    degree =int(file.get("degree"))
    model = SVC(C=C, kernel=kernel, degree=degree, gamma=gamma, tol=tol)

    return model
