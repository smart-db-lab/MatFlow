import time

import pandas as pd

from django.http import JsonResponse
from sklearn.model_selection import RandomizedSearchCV
from sklearn.tree import DecisionTreeClassifier

def hyperparameter_optimization(X_train, y_train,file):
    n_iter = int(file.get("Number of iterations for hyperparameter search"))
    cv = int(file.get("Number of cross-validation folds"))
    random_state = int(file.get("Random state for hyperparameter search"))
    param_dist = {
        "criterion": ["gini", "entropy"],
        "max_depth": [None, 1, 2, 3, 4, 5, 10, 20, 50, 100],
        "min_samples_split": [2, 5, 10, 20],
        "min_samples_leaf": [2, 4, 8, 10],
        "random_state": [random_state]
    }
    model = DecisionTreeClassifier()
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


def decision_tree(X_train, y_train,file):
    # best_param = hyperparameter_optimization(X_train, y_train,file)
    max_depth = None
    criterion = file.get( "criterion")
    min_samples_split = file.get("min_samples_split")
    min_samples_leaf = file.get("min_samples_leaf")

    # auto_max_depth = True
    # if auto_max_depth:
    #     max_depth = None
    # else:
    max_depth =file.get( "max_depth")

    random_state = file.get("random_state")

    max_depth = None if max_depth==None else max_depth
    model = DecisionTreeClassifier(criterion=criterion, max_depth=max_depth, min_samples_split=min_samples_split,
         min_samples_leaf=min_samples_leaf, random_state=random_state)


    return model
