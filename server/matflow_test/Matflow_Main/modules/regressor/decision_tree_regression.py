import time

import pandas as pd

from django.http import JsonResponse
from sklearn.model_selection import RandomizedSearchCV
from sklearn.tree import DecisionTreeRegressor
def hyperparameter_optimization(X_train, y_train,file):
    n_iter = int(file.get("Number of iterations for hyperparameter search"))
    cv = int(file.get("Number of cross-validation folds"))
    random_state = int(file.get("Random state for hyperparameter search"))

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
    rows = []
    for param in best_params:
        rows.append([param, best_params[param]])
    table = pd.DataFrame(rows, columns=['Parameter', 'Value'])
    table=table.to_dict(orient="records")
    obj = {
        "result": table,  # table
        "param": best_params  # parameter
    }
    return JsonResponse(obj)

def decision_tree_regressor(X_train, y_train,file):
    criterion = file.get("criterion")
    min_samples_split =int(file.get("min_samples_split"))
    min_samples_leaf = int(file.get( "min_samples_leaf"))
    # auto_max_depth = file.get("none")
    # if auto_max_depth:
    #     max_depth = col1.text_input(
    #         "Max Depth",
    #         None,
    #         key="dtr_max_depth_none",
    #         disabled=True
    #     )
    # else:
    max_depth = file.get("max_depth")
    random_state = file.get("random_state")
    max_depth = None if max_depth==None else max_depth
    model = DecisionTreeRegressor(criterion=criterion, max_depth=max_depth, min_samples_split=min_samples_split,
                                      min_samples_leaf=min_samples_leaf, random_state=random_state)


    return model
