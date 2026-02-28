from sklearn.metrics import mean_squared_error, r2_score
from sklearn.linear_model import Ridge, Lasso
from sklearn.svm import SVR
import numpy as np

def objective_function(hyperparameters, model_type, X_train, y_train, X_test, y_test, debug=False):
    if model_type == 'Ridge':
        model = Ridge(alpha=hyperparameters[0])
    elif model_type == 'Lasso':
        model = Lasso(alpha=hyperparameters[0])
    elif model_type == 'SVR':
        model = SVR(C=hyperparameters[0])
    else:
        return None

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    mse = mean_squared_error(y_test, predictions)
    rmse = np.sqrt(mse)
    r_squared = r2_score(y_test, predictions)

    if debug:
        print(f"MSE: {mse}, RMSE: {rmse}, R²: {r_squared}")

    return mse  # Optimize based on MSE by default
