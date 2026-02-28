import pandas as pd


class Models:
    def __init__(self):
        self.model = {}
        self.result={}
        self.target_var = []

    def get_model(self, model_name):
        return self.model[model_name]

    def get_result(self,model_name):
        return self.result[model_name]



    def add_model(self, model_name, model, train_name, test_name, target_var, result, model_type):
        self.model[model_name] = model

        self.target_var.append(target_var)

        classification_result = pd.DataFrame(columns=[
            "Model Name", "Train Data", "Test Data",
            "Train Accuracy", "Train Precision", "Train Recall", "Train F1-Score",
            "Test Accuracy", "Test Precision", "Test Recall", "Test F1-Score"
        ])

        regression_result = pd.DataFrame(columns=[
            "Model Name", "Train Data", "Test Data",
            "Train R-Squared", "Train Mean Absolute Error", "Train Mean Squared Error", "Train Root Mean Squared Error",
            "Test R-Squared", "Test Mean Absolute Error", "Test Mean Squared Error", "Test Root Mean Squared Error"
        ])

        if model_type == "classification":
            temp_result = classification_result
        elif model_type == "regression":
            temp_result = regression_result
        else:
            raise ValueError("Invalid model type. Must be either 'classification' or 'regression'.")

        model_info = [model_name, train_name, test_name]
        new_idx = len(temp_result)
        temp_result.loc[new_idx] = model_info + result

        self.result[model_name]=temp_result


    def get_prediction(self, model_name, X):
        return self.model[model_name].predict(X)

    def list_name(self):
        if bool(self.model):
            return list(self.model.keys())
        return []

    def delete_model(self, model_name):
        del self.model[model_name]
        drop_idx = self.classification_result.index[self.classification_result["Model Name"] == model_name]
        if len(drop_idx) > 0:
            self.classification_result = self.classification_result.drop(drop_idx[0]).reset_index(drop=True)
        else:
            drop_idx = self.regression_result.index[self.regression_result["Model Name"] == model_name]
            self.regression_result = self.regression_result.drop(drop_idx[0]).reset_index(drop=True)
