import pandas as pd

from django.http import JsonResponse
from rest_framework import status
from sklearn.model_selection import RandomizedSearchCV
from sklearn.neural_network import MLPClassifier

from ..utils import error_payload, parse_choice, parse_float, parse_int


def _error_response(message, details=None, status_code=status.HTTP_400_BAD_REQUEST):
	return JsonResponse(error_payload(message, details), status=status_code)


def _validate_training_data(X_train, y_train):
	if X_train is None or y_train is None:
		raise ValueError("Training dataset is missing.")
	if len(X_train) == 0 or len(y_train) == 0:
		raise ValueError("Training dataset is empty.")


def _parse_hidden_layer_sizes(value):
	if isinstance(value, (list, tuple)):
		parsed = tuple(int(v) for v in value if int(v) > 0)
		if not parsed:
			raise ValueError("hidden_layer_sizes must contain positive integers.")
		return parsed

	if isinstance(value, str) and "," in value:
		parts = [p.strip() for p in value.split(",") if p.strip()]
		parsed = tuple(int(p) for p in parts)
		if any(v <= 0 for v in parsed):
			raise ValueError("hidden_layer_sizes must contain positive integers.")
		return parsed

	hidden_size = parse_int(value, default=3, min_value=1)
	return (hidden_size,)

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
			"hidden_layer_sizes": [(3,), (10,), (50,), (100,)],
			"activation": ["identity", "logistic", "tanh", "relu"],
			"solver": ["lbfgs", "sgd", "adam"],
			"alpha": [0.0001, 0.001, 0.01, 0.1, 1],
			"learning_rate_init": [0.001, 0.01, 0.1, 1],
			"max_iter": [100, 200, 500, 1000],
			"tol": [0.0001, 0.001, 0.01],
		}
		model = MLPClassifier()
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
		return _error_response("Invalid MLP optimization input.", str(exc))
	except Exception as exc:
		return _error_response(
			"Failed to run MLP hyperparameter optimization.",
			str(exc),
			status.HTTP_500_INTERNAL_SERVER_ERROR,
		)

def perceptron(X_train, y_train,file):
	_validate_training_data(X_train, y_train)

	hidden_layer_sizes = _parse_hidden_layer_sizes(file.get("hidden_layer_sizes"))
	alpha = parse_float(file.get("alpha"), default=0.0001, min_value=0.0)
	activation = parse_choice(
		file.get("activation"), ["identity", "logistic", "tanh", "relu"], "relu"
	)
	learning_rate = parse_float(
		file.get("learning_rate_init"), default=0.001, min_value=1e-12
	)
	max_iter = parse_int(file.get("max_iter"), default=1000, min_value=1)
	tol = parse_float(file.get("tol"), default=0.001, min_value=1e-12)
	solver = parse_choice(file.get("solver"), ["lbfgs", "sgd", "adam"], "adam")
	random_state = parse_int(file.get("random_state"), default=42)

	return MLPClassifier(
		hidden_layer_sizes=hidden_layer_sizes,
		activation=activation,
		alpha=alpha,
		learning_rate_init=learning_rate,
		max_iter=max_iter,
		tol=tol,
		solver=solver,
		random_state=random_state,
	)