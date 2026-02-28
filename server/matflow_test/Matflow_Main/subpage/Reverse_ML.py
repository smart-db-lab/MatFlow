import numpy as np
import pandas as pd
from django.http import JsonResponse
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from sklearn.model_selection import train_test_split

def train_model(data, features, target_variables):
    # Split the data into features and targets
    X = data[features]
    y = data[target_variables]

    # Perform any necessary preprocessing on the features and targets
    # ...

    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Define the model architecture
    model = tf.keras.Sequential()
    model.add(tf.keras.layers.Dense(64, activation='relu', input_shape=(X_train_scaled.shape[1],)))
    model.add(tf.keras.layers.Dense(64, activation='relu'))
    model.add(tf.keras.layers.Dense(len(target_variables)))  # Output layer

    # Compile the model
    model.compile(loss='mean_squared_error', optimizer='adam')

    # Train the model
    model.fit(X_train_scaled, y_train, epochs=10, batch_size=32)

    # Evaluate the model on the testing set
    loss = model.evaluate(X_test_scaled, y_test)

    # Optionally, you can save the trained model for future use
    # model.save('trained_model.h5')

    return model


def preprocess_input(input_features):
    print(input_features)
    # Convert input features to the desired data type
    input_features = [int(feature) for feature in input_features.split(",")]
    input_features = np.array(input_features).reshape(1, -1)
    return input_features

def reverse_ml(file):
    print(file)
    data = pd.DataFrame(file.get("file"))
    all_columns = data.columns.to_list()
    target_variables = file.get('Select Feature')
    for target in target_variables:
        all_columns.remove(target)
    features = file.get('Select Target Variable')
    # if "model" not in st.session_state:
    #     st.session_state.model = None
    # if 'target_pre' not in st.session_state:
    #     st.session_state.target_pre = None
    # if 'features_pre' not in st.session_state:
    #     st.session_state.features_pre = None
    # if "table_pre" not in st.session_state:
    #     st.session_state.table_pre = None
        # if st.session_state.model is None or st.session_state.table_pre != table_name or st.session_state.target_pre != target_variables or st.session_state.features_pre != features:
        #     st.session_state.model = train_model(data, features, target_variables)
        #     st.session_state.target_pre = target_variables
        #     st.session_state.features_pre = features
        #     st.session_state.table_pre = table_name
    st_model = train_model(data, features, target_variables)
    # tmp= file.get("Enter Values")
    # print(f" fjaj {tmp}")
    input_features = file.get("Enter Values")

    # print(f"value = {input_features}  {tmp}")

    input_features = preprocess_input(input_features)
    prediction = st_model.predict([input_features])[0]
    prediction = prediction.reshape(1, -1)

    prediction_table = pd.DataFrame(
        {'Target Variable': target_variables, 'Predicted Value': prediction.flatten()})

    new_value =prediction_table .to_dict(orient="records")
    return JsonResponse(new_value, safe=False)
