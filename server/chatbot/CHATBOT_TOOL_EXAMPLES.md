# Chatbot Tool Examples

Complete examples for all available tools in the chatbot. Use these as templates when talking to the chatbot via `/api/chatbot/chat/`.

## Core Dataset Tools

### set_dataset
Load a dataset by name or from inline data.

**Chat Message:**
```
Load the diamonds dataset
```

**Tool Call:**
```json
{
  "tool": "set_dataset",
  "arguments": {
    "dataset": "diamonds"
  }
}
```

**Alternative (inline data):**
```json
{
  "tool": "set_dataset",
  "arguments": {
    "data": [
      {"name": "Alice", "age": 30, "salary": 50000},
      {"name": "Bob", "age": 25, "salary": 45000}
    ]
  }
}
```

---

### show_head
Show first N rows of the currently loaded dataset.

**Chat Message:**
```
Show me the first 10 rows of the dataset
```

**Tool Call:**
```json
{
  "tool": "show_head",
  "arguments": {
    "n": 10
  }
}
```

**With dataset name:**
```json
{
  "tool": "show_head",
  "arguments": {
    "dataset": "iris",
    "n": 5
  }
}
```

---

### show_columns
List all columns in the current dataset.

**Chat Message:**
```
What columns are in the dataset?
```

**Tool Call:**
```json
{
  "tool": "show_columns",
  "arguments": {}
}
```

---

### correlation
Compute correlation between numeric columns.

**Chat Message:**
```
Show correlation matrix
```

**Tool Call:**
```json
{
  "tool": "correlation",
  "arguments": {}
}
```

---

### split
Split dataset into train and test sets.

**Chat Message:**
```
Split the dataset into train and test with target species and 0.2 test size
```

**Tool Call:**
```json
{
  "tool": "split",
  "arguments": {
    "target_var": "species",
    "test_size": 0.2
  }
}
```

---

### train
Train a classification or regression model on the split data.

**Chat Message:**
```
Train a classifier on the split data
```

**Tool Call:**
```json
{
  "tool": "train",
  "arguments": {
    "type": "classifier"
  }
}
```

**Regression:**
```json
{
  "tool": "train",
  "arguments": {
    "type": "regressor"
  }
}
```

---

### model_evaluation
Evaluate the trained model on test data.

**Chat Message:**
```
Evaluate the model
```

**Tool Call:**
```json
{
  "tool": "model_evaluation",
  "arguments": {}
}
```

---

### reset_session
Clear all session data (datasets, models, splits).

**Chat Message:**
```
Reset session
```

**Tool Call:**
```json
{
  "tool": "reset_session",
  "arguments": {}
}
```

---

## Dataset Manager Tools (dm_*)

### dm_get_structure
Browse the nested folder structure under dataset/ or read a specific file.

**Chat Message:**
```
Show me the dataset structure
```

**Tool Call:**
```json
{
  "tool": "dm_get_structure",
  "arguments": {}
}
```

**Read a file:**
```json
{
  "tool": "dm_get_structure",
  "arguments": {
    "folder": "diamonds",
    "file": "diamonds.csv"
  }
}
```

---

### dm_create_folder
Create a new folder under dataset/.

**Chat Message:**
```
Create a folder called my_data
```

**Tool Call:**
```json
{
  "tool": "dm_create_folder",
  "arguments": {
    "folderName": "my_data",
    "parent": ""
  }
}
```

**Nested folder:**
```json
{
  "tool": "dm_create_folder",
  "arguments": {
    "folderName": "v2",
    "parent": "my_data"
  }
}
```

---

### dm_rename_item
Rename a file or folder.

**Chat Message:**
```
Rename my_data to my_data_v1
```

**Tool Call:**
```json
{
  "tool": "dm_rename_item",
  "arguments": {
    "currentName": "my_data",
    "newName": "my_data_v1",
    "parentFolder": ""
  }
}
```

---

### dm_delete_item
Delete a file or folder recursively.

**Chat Message:**
```
Delete the my_data folder
```

**Tool Call:**
```json
{
  "tool": "dm_delete_item",
  "arguments": {
    "folder": "my_data"
  }
}
```

**Delete a file:**
```json
{
  "tool": "dm_delete_item",
  "arguments": {
    "folder": "diamonds",
    "file": "diamonds.csv"
  }
}
```

---

### dm_create_file
Create a new CSV or XLSX file from data.

**Chat Message:**
```
Create a file called results.csv in my_data folder with this data
```

**Tool Call:**
```json
{
  "tool": "dm_create_file",
  "arguments": {
    "filename": "results.csv",
    "foldername": "my_data",
    "data": [
      {"id": 1, "value": 100},
      {"id": 2, "value": 200}
    ]
  }
}
```

---

### dm_read_file
Read a CSV/XLSX/XLS file and return its contents.

**Chat Message:**
```
Read the file diamonds.csv from diamonds folder
```

**Tool Call:**
```json
{
  "tool": "dm_read_file",
  "arguments": {
    "folder": "diamonds",
    "file": "diamonds.csv"
  }
}
```

---

### dm_load_any_dataset
Search and load datasets from any source (Kaggle, HuggingFace, OpenML, or URL).

**Chat Message:**
```
Load the titanic dataset
```

**Tool Call:**
```json
{
  "tool": "dm_load_any_dataset",
  "arguments": {
    "dataset": "titanic"
  }
}
```

---

## MatflowTest Bridge Tools (mt_*)

### mt_display_group
Group by a column and aggregate using a function.

**Chat Message:**
```
Group by gender and count records
```

**Tool Call:**
```json
{
  "tool": "mt_display_group",
  "arguments": {
    "file": [
      {"gender": "M", "age": 30},
      {"gender": "F", "age": 25},
      {"gender": "M", "age": 35}
    ],
    "group_var": "gender",
    "agg_func": "count"
  }
}
```

---

### mt_display_correlation
Display correlation matrix or heatmap.

**Chat Message:**
```
Show correlation between all numeric columns
```

**Tool Call:**
```json
{
  "tool": "mt_display_correlation",
  "arguments": {
    "file": [
      {"a": 1, "b": 2, "c": 3},
      {"a": 4, "b": 5, "c": 6}
    ]
  }
}
```

---

### mt_feature_selection
Select features by method (e.g., mutual_info, correlation, variance).

**Chat Message:**
```
Select features for target price using mutual information
```

**Tool Call:**
```json
{
  "tool": "mt_feature_selection",
  "arguments": {
    "dataset": [
      {"feature1": 1, "feature2": 2, "price": 100},
      {"feature1": 3, "feature2": 4, "price": 200}
    ],
    "target_var": "price",
    "method": "mutual_info"
  }
}
```

---

### mt_imputation_data1
Get information about null values and low-cardinality columns.

**Chat Message:**
```
What columns have missing values?
```

**Tool Call:**
```json
{
  "tool": "mt_imputation_data1",
  "arguments": {
    "file": [
      {"a": 1, "b": null},
      {"a": 2, "b": 3}
    ]
  }
}
```

---

### mt_imputation_data2
Get imputation options for a specific column.

**Chat Message:**
```
How should I impute column age?
```

**Tool Call:**
```json
{
  "tool": "mt_imputation_data2",
  "arguments": {
    "file": [
      {"age": 25},
      {"age": null},
      {"age": 30}
    ],
    "Select_columns": "age"
  }
}
```

---

### mt_imputation_result
Apply imputation strategy to a column.

**Chat Message:**
```
Impute age with mean strategy
```

**Tool Call:**
```json
{
  "tool": "mt_imputation_result",
  "arguments": {
    "file": [
      {"age": 25},
      {"age": null},
      {"age": 30}
    ],
    "Select_columns": "age",
    "strategy": "mean",
    "fill_group": null,
    "constant": 0
  }
}
```

---

### mt_merge_dataset
Merge two datasets.

**Chat Message:**
```
Merge dataset A and dataset B on id
```

**Tool Call:**
```json
{
  "tool": "mt_merge_dataset",
  "arguments": {
    "file1": [{"id": 1, "value": 10}],
    "file2": [{"id": 1, "extra": 20}],
    "merge_col": "id"
  }
}
```

---

### mt_encoding
Encode categorical variables using label or one-hot encoding.

**Chat Message:**
```
Encode the color column using label encoding
```

**Tool Call:**
```json
{
  "tool": "mt_encoding",
  "arguments": {
    "file": [
      {"color": "red", "value": 1},
      {"color": "blue", "value": 2}
    ],
    "Select_columns": ["color"],
    "encoder_type": "label"
  }
}
```

---

### mt_scaling
Scale numeric features using standardization or normalization.

**Chat Message:**
```
Scale columns age and salary using standard scaler
```

**Tool Call:**
```json
{
  "tool": "mt_scaling",
  "arguments": {
    "file": [
      {"age": 25, "salary": 50000},
      {"age": 30, "salary": 60000}
    ],
    "Select_columns": ["age", "salary"],
    "scaler_type": "standard"
  }
}
```

---

### mt_drop_column
Drop columns from the dataset.

**Chat Message:**
```
Drop the id and temp columns
```

**Tool Call:**
```json
{
  "tool": "mt_drop_column",
  "arguments": {
    "file": [
      {"id": 1, "name": "A", "temp": 1}
    ],
    "columns": ["id", "temp"]
  }
}
```

---

### mt_drop_row
Drop rows that match a filter condition.

**Chat Message:**
```
Drop rows where age is less than 18
```

**Tool Call:**
```json
{
  "tool": "mt_drop_row",
  "arguments": {
    "file": [
      {"age": 15, "name": "A"},
      {"age": 25, "name": "B"}
    ],
    "filter_var": "age",
    "filter_cond": "<",
    "filter_value": 18
  }
}
```

---

### mt_append
Append rows or columns to the dataset.

**Chat Message:**
```
Append a new row to the dataset
```

**Tool Call:**
```json
{
  "tool": "mt_append",
  "arguments": {
    "file": [
      {"id": 1, "value": 100}
    ],
    "new_data": [
      {"id": 2, "value": 200}
    ],
    "axis": 0
  }
}
```

---

### mt_cluster
Apply clustering to the dataset.

**Chat Message:**
```
Cluster the dataset using K-means with 3 clusters
```

**Tool Call:**
```json
{
  "tool": "mt_cluster",
  "arguments": {
    "file": [
      {"x": 1, "y": 2},
      {"x": 2, "y": 3}
    ],
    "method": "kmeans",
    "n_clusters": 3
  }
}
```

---

### mt_split
Split dataset into train and test.

**Chat Message:**
```
Split with target price and 0.2 test ratio
```

**Tool Call:**
```json
{
  "tool": "mt_split",
  "arguments": {
    "train": [
      {"feature": 1, "price": 100},
      {"feature": 2, "price": 200}
    ],
    "target_var": "price",
    "test_size": 0.2
  }
}
```

---

### mt_build_model
Build a classification or regression model.

**Chat Message:**
```
Build a random forest classifier on this data
```

**Tool Call:**
```json
{
  "tool": "mt_build_model",
  "arguments": {
    "type": "classifier",
    "train": [
      {"feature": 1, "label": "A"},
      {"feature": 2, "label": "B"}
    ],
    "target_var": "label",
    "classifier": "Random Forest Classification"
  }
}
```

---

### mt_hyper_opti
Optimize hyperparameters using grid search or random search.

**Chat Message:**
```
Optimize hyperparameters for SVM classifier
```

**Tool Call:**
```json
{
  "tool": "mt_hyper_opti",
  "arguments": {
    "train": [
      {"x": 1, "y": 0},
      {"x": 2, "y": 1}
    ],
    "test": [
      {"x": 3, "y": 0}
    ],
    "target_var": "y",
    "type": "classifier",
    "classifier": "Support Vector Machine"
  }
}
```

---

### mt_model_evaluation_api
Evaluate model performance on test data.

**Chat Message:**
```
Evaluate the model accuracy and F1 score
```

**Tool Call:**
```json
{
  "tool": "mt_model_evaluation_api",
  "arguments": {
    "model": "base64_encoded_model",
    "test": [
      {"feature": 1, "label": "A"}
    ],
    "target_var": "label"
  }
}
```

---

### mt_model_prediction
Make predictions using a trained model.

**Chat Message:**
```
Predict the label for feature value 5
```

**Tool Call:**
```json
{
  "tool": "mt_model_prediction",
  "arguments": {
    "model": "base64_encoded_model",
    "type": "classifier",
    "input": [
      {"feature": 5}
    ]
  }
}
```

---

### mt_time_series
Analyze time series data.

**Chat Message:**
```
Analyze this time series data
```

**Tool Call:**
```json
{
  "tool": "mt_time_series",
  "arguments": {
    "file": [
      {"date": "2024-01-01", "value": 100},
      {"date": "2024-01-02", "value": 105}
    ],
    "date_column": "date"
  }
}
```

---

### mt_time_series_analysis
Advanced time series analysis (trends, seasonality, forecasting).

**Chat Message:**
```
Analyze trends and seasonality
```

**Tool Call:**
```json
{
  "tool": "mt_time_series_analysis",
  "arguments": {
    "file": [
      {"date": "2024-01-01", "value": 100},
      {"date": "2024-01-02", "value": 105}
    ],
    "date_column": "date",
    "value_column": "value"
  }
}
```

---

### mt_reverse_ml
Reverse ML to find optimal input values for target output.

**Chat Message:**
```
Find input values that produce price 500000
```

**Tool Call:**
```json
{
  "tool": "mt_reverse_ml",
  "arguments": {
    "train": [
      {"square_feet": 2000, "price": 400000},
      {"square_feet": 2500, "price": 500000}
    ],
    "target_var": "price",
    "target_value": 500000
  }
}
```

---

### mt_deploy_data
Prepare data and correlations for deployment.

**Chat Message:**
```
Deploy analysis for this training data targeting price
```

**Tool Call:**
```json
{
  "tool": "mt_deploy_data",
  "arguments": {
    "train": [
      {"feature1": 1, "feature2": 2, "price": 100},
      {"feature1": 3, "feature2": 4, "price": 200}
    ],
    "target_var": "price"
  }
}
```

---

### mt_deploy_result
Get deployment results with thresholds and correlations.

**Chat Message:**
```
Get deployment results with selected features
```

**Tool Call:**
```json
{
  "tool": "mt_deploy_result",
  "arguments": {
    "train": [
      {"feature1": 1, "feature2": 2, "price": 100},
      {"feature1": 3, "feature2": 4, "price": 200}
    ],
    "target_var": "price",
    "result": {
      "feature1": 1.5,
      "feature2": 2.5
    },
    "model_deploy": "base64_encoded_model"
  }
}
```

---

### mt_pso_optimize
Optimize using Particle Swarm Optimization.

**Chat Message:**
```
Optimize model parameters using PSO
```

**Tool Call:**
```json
{
  "tool": "mt_pso_optimize",
  "arguments": {
    "X_train_scaled": [[1, 2], [3, 4]],
    "y_train": [0, 1],
    "X_test_scaled": [[2, 3]],
    "y_test": [0],
    "model_type": "classifier",
    "lb": 0.1,
    "ub": 1.0,
    "swarmsize": 50,
    "maxiter": 100
  }
}
```

---

### mt_display_correlation_featurePair
Display correlation between two specific features.

**Chat Message:**
```
Show correlation between age and salary
```

**Tool Call:**
```json
{
  "tool": "mt_display_correlation_featurePair",
  "arguments": {
    "file": "data.csv",
    "feature1": "age",
    "feature2": "salary"
  }
}
```

---

### mt_display_correlation_heatmap
Display correlation heatmap for dataset.

**Chat Message:**
```
Show me a correlation heatmap
```

**Tool Call:**
```json
{
  "tool": "mt_display_correlation_heatmap",
  "arguments": {
    "file": "data.csv"
  }
}
```

---

### mt_feature_creation
Create new features from existing ones.

**Chat Message:**
```
Create a new feature by combining age and salary
```

**Tool Call:**
```json
{
  "tool": "mt_feature_creation",
  "arguments": {
    "file": "data.csv",
    "new_feature": "age_salary_ratio",
    "expression": "age / salary"
  }
}
```

---

### mt_change_dtype
Change data type of columns.

**Chat Message:**
```
Convert age column to integer
```

**Tool Call:**
```json
{
  "tool": "mt_change_dtype",
  "arguments": {
    "file": "data.csv",
    "columns": ["age"],
    "dtype": "int64"
  }
}
```

---

### mt_alter_field
Rename columns in dataset.

**Chat Message:**
```
Rename the column 'name' to 'person_name'
```

**Tool Call:**
```json
{
  "tool": "mt_alter_field",
  "arguments": {
    "file": "data.csv",
    "current_name": "name",
    "new_name": "person_name"
  }
}
```

---

### mt_download_model
Download trained model file.

**Chat Message:**
```
Download the trained model
```

**Tool Call:**
```json
{
  "tool": "mt_download_model",
  "arguments": {
    "model_name": "my_model"
  }
}
```

---

## Quick Reference

| Tool | Purpose | Key Arguments |
|------|---------|--------------|
| set_dataset | Load/set dataset | dataset OR data |
| show_head | Preview rows | n |
| show_columns | List columns | - |
| correlation | Correlation matrix | - |
| split | Train/test split | target_var, test_size |
| train | Train model | type (classifier/regressor) |
| model_evaluation | Evaluate model | - |
| reset_session | Clear session | - |
| dm_get_structure | Browse files | folder, file (optional) |
| dm_create_folder | Create folder | folderName, parent |
| dm_rename_item | Rename item | currentName, newName, parentFolder |
| dm_delete_item | Delete item | folder, file (optional) |
| dm_create_file | Create file | filename, foldername, data |
| dm_read_file | Read file | folder, file |
| dm_load_any_dataset | Load external dataset | dataset |
| mt_display_group | Group & aggregate | file, group_var, agg_func |
| mt_display_correlation | Correlation heatmap | file |
| mt_feature_selection | Select features | dataset, target_var, method |
| mt_imputation_data1 | Check nulls | file |
| mt_imputation_data2 | Get options | file, Select_columns |
| mt_imputation_result | Apply imputation | file, Select_columns, strategy |
| mt_merge_dataset | Merge datasets | file1, file2, merge_col |
| mt_encoding | Encode categorical | file, Select_columns, encoder_type |
| mt_scaling | Scale features | file, Select_columns, scaler_type |
| mt_drop_column | Drop columns | file, columns |
| mt_drop_row | Drop rows | file, filter_var, filter_cond, filter_value |
| mt_append | Append rows/cols | file, new_data, axis |
| mt_cluster | Cluster data | file, method, n_clusters |
| mt_split | Train/test split | train, target_var, test_size |
| mt_build_model | Build model | type, train, target_var, classifier/regressor |
| mt_hyper_opti | Hyperparameter tune | train, test, target_var, type, classifier/regressor |
| mt_model_evaluation_api | Evaluate model | model, test, target_var |
| mt_model_prediction | Predict | model, type, input |
| mt_time_series | Time series analysis | file, date_column |
| mt_time_series_analysis | Advanced TS | file, date_column, value_column |
| mt_reverse_ml | Reverse engineer | train, target_var, target_value |
| mt_deploy_data | Deploy prep | train, target_var |
| mt_deploy_result | Deploy results | train, target_var, result, model_deploy |
| mt_pso_optimize | PSO optimization | X_train_scaled, y_train, X_test_scaled, y_test, model_type |
| mt_display_correlation_featurePair | Feature pair correlation | file, feature1, feature2 |
| mt_display_correlation_heatmap | Correlation heatmap | file |
| mt_feature_creation | Create features | file, new_feature, expression |
| mt_change_dtype | Change data types | file, columns, dtype |
| mt_alter_field | Rename columns | file, current_name, new_name |
| mt_download_model | Download model | model_name |
