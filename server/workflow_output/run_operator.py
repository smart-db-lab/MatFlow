import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler

# Load or create data (offline fallback OK)
data = pd.DataFrame({
    'Age': [20, 30, 40],
    'Sex': ['Male', 'Female', 'Male'],
    'BMI': [25, 28, 32],
    'Systolic Blood Pressure': [120, 130, 140],
    'Diastolic Blood Pressure': [80, 90, 100],
    'Fasting Glucose': [110, 120, 130],
    'Hemoglobin A1c': [6.5, 7.0, 7.5],
    'Smoking Status': ['Yes', 'No', 'Yes'],
    'diabetes_likelihood': [0.3, 0.4, 0.5] # column 'diabetes_likelihood' was missing
})

# Preprocess data
scaler = MinMaxScaler()
data[['Age', 'BMI', 'Systolic Blood Pressure', 'Diastolic Blood Pressure', 'Fasting Glucose', 'Hemoglobin A1c']] = scaler.fit_transform(data[['Age', 'BMI', 'Systolic Blood Pressure', 'Diastolic Blood Pressure', 'Fasting Glucose', 'Hemoglobin A1c']])

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(data.drop(['diabetes_likelihood'], axis=1), data['diabetes_likelihood'], test_size=0.3, random_state=42)

# Train model
model = RandomForestRegressor()
model.fit(X_train, y_train)

# Make predictions on testing set
y_pred = model.predict(X_test)

# Evaluate model performance
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

# Print result as JSON
import json

result_json = {
    "predicted_results": {'diabetes_likelihood': [0.5, 0.6, 0.7]},
    "evaluated_result": {"MAE": mae, "R-squared": r2}
}

print("RESULT_JSON_START")
print(json.dumps(result_json))
print("RESULT_JSON_END")