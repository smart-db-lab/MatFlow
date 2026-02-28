import pandas as pd

from django.http import JsonResponse

from sklearn.neighbors import KNeighborsClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV


def hyperparameter_optimization(X_train, y_train,file):
    n_iter = int(file.get("Number of iterations for hyperparameter search"))
    cv = int(file.get("Number of cross-validation folds"))
    random_state = int(file.get("Random state for hyperparameter search"))
    param_dist = {
        "n_neighbors": [3, 5, 10, 15, 20, 25],
        "weights": ["uniform", "distance"],
        "metric": ["minkowski", "euclidean", "manhattan"]
    }
    model = KNeighborsClassifier()
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
    obj={
        "result": results_df,
        "param": best_param
    }
    return JsonResponse(obj)


def knn(X_train, y_train,file):
    # best_param = hyperparameter_optimization(X_train, y_train,file)
    #("Model Settings")
    n_neighbors = int(file.get("n_neighbors"))
    weights = file.get("weights")
    metric =file.get( "metric")

    model = KNeighborsClassifier(n_neighbors=n_neighbors, weights=weights, metric=metric)
    return model
