import pandas as pd

from django.http import JsonResponse
from sklearn.model_selection import RandomizedSearchCV
from sklearn.neural_network import MLPClassifier

def hyperparameter_optimization(X_train, y_train,file):
	n_iter = int(file.get(("Number of iterations for hyperparameter search")))
	cv = int(file.get(("Number of cross-validation folds")))
	random_state = int(file.get(("Random state for hyperparameter search")))

	param_dist = {
		'hidden_layer_sizes': [3,10, 50, 100],
		'activation': ['identity', 'logistic', 'tanh', 'relu'],
		'solver': ['lbfgs', 'sgd', 'adam'],
		'alpha': [0.0001, 0.001, 0.01, 0.1, 1],
		'learning_rate_init': [0.001, 0.01, 0.1, 1],
		'max_iter': [100, 200, 500, 1000],
		'tol': [0.0001, 0.001, 0.01]
	}
	model = MLPClassifier()
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
	results_df = results_df.to_dict(orient="records")

	best_param = clf.best_params_
	obj = {
		"result": results_df,
		"param": best_param
	}
	return JsonResponse(obj)

def perceptron(X_train, y_train,file):

	#("Model Settings")
	hidden_size = int(file.get("hidden_layer_sizes"))

	alpha = float(file.get("alpha"))
	activation = file.get("activation")
	learning_rate = float(file.get("learning_rate_init"))
	max_iter =int( file.get("max_iter"))
	tol =float(file.get("tol"))

	hidden_layer_sizes = []
	for i in range(int(hidden_size)):
		neuron_size = hidden_size
		hidden_layer_sizes.append(neuron_size)

	# Display table of hidden layer sizes
	table_data = {"Layer": [f"Layer {i + 1}" for i in range(len(hidden_layer_sizes))],
				  "Neuron Size": hidden_layer_sizes}
	# table_data=st.experimental_data_editor(table_data)

	model = MLPClassifier(hidden_layer_sizes=table_data["Neuron Size"], activation=activation, alpha=alpha,
							  learning_rate_init=learning_rate, max_iter=max_iter, tol=tol)


	return model