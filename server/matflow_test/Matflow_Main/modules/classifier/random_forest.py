import time

import pandas as pd

from django.http import JsonResponse
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import RandomizedSearchCV


def hyperparameter_optimization(X_train, y_train,file):
    n_iter = int(file.get("Number of iterations for hyperparameter search"))
    cv = int(file.get("Number of cross-validation folds"))
    random_state = int(file.get("Random state for hyperparameter search"))
    param_dist = {
        "criterion": ["gini", "entropy", "log_loss"],
        "n_estimators": [100, 200, 300, 400, 500],
        "max_depth": [5, 10, 15, None],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
        "max_features": ["sqrt", "log2", None],
        "random_state": [0]
    }
    model = RandomForestClassifier()
    clf = RandomizedSearchCV(model, param_distributions=param_dist, n_iter=n_iter, cv=cv,
                             random_state=random_state)
    clf.fit(X_train, y_train)
    cv_results = clf.cv_results_
    param_names = list(cv_results['params'][0].keys())

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


def random_forest(X_train, y_train,file):
    # max_depth =file.get['max_depth']
    n_estimators = int(file.get("n_estimators"))

    criterion =file.get("criterion")

    min_samples_split =int( file.get("min_samples_split"))

    min_samples_leaf =int(file.get("min_samples_leaf"))

    auto_max_depth = file.get("Auto")

    # if auto_max_depth:
    #     max_depth = None
    #     max_depth_input =file.get( "Max Depth")
    # else:
    #     max_depth_input = file.get("Max Depth")
    random_state = int(file.get("random_state"))
    max_depth = None #if auto_max_depth else max_depth

    model = RandomForestClassifier(n_estimators=n_estimators, criterion=criterion,
                                       max_depth=max_depth, min_samples_split=min_samples_split,
                                       min_samples_leaf=min_samples_leaf, random_state=random_state)

    return model
