# Feature Selection API Integration Guide for Frontend Developer

This README provides detailed instructions to help frontend developers integrate the Feature Selection API into a React application. The API is built using Django REST Framework and performs feature selection on datasets. This guide covers:

- **API Overview**
- **Endpoint Details**
- **Request Parameters**
- **Response Structure**
- **Handling Responses in React**
- **Rendering Plotly Charts**
- **Downloading Modified Dataset**
- **Error Handling**
- **Sample Integration Code**
- **Additional Notes**

---

## **API Overview**

The Feature Selection API allows you to perform feature selection on a dataset by sending a JSON payload containing the dataset and relevant parameters. The API processes the data, performs feature selection using specified estimators, and returns the results along with visualization data.

## **Endpoint Details**

- **URL**: `http://localhost:8000/api/pfs/`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Note**: Adjust the URL if the API is hosted on a different address or port.

## **Request Parameters**

The API expects a JSON object with the following fields:

### **Required Parameters**

- **dataset**: An array of data points (list of dictionaries), where each data point is a JSON object containing feature names and values.
- **target_var**: A string specifying the name of the target variable in your dataset.
- **problem_type**: A string indicating the type of problem; must be either `"classification"` or `"regression"`.
- **estimator_name**: The name of the estimator to use for feature selection. Possible values:
  - For classification:
    - `"ExtraTreesClassifier"`
    - `"RandomForestClassifier"`
    - `"GradientBoostingClassifier"`
    - `"XGBClassifier"`
  - For regression:
    - `"ExtraTreesRegressor"`
    - `"RandomForestRegressor"`
    - `"GradientBoostingRegressor"`
    - `"XGBRegressor"`

### **Optional Parameters**

- **kfold**: An integer specifying the number of folds to use in cross-validation. Default is `2`.
- **display_opt**: A string specifying display options. Possible values:
  - `"All"`: Consider all features.
  - `"Custom"`: Use specified features (must provide `features_to_display`).
  - `"None"`: Do not display any features.
- **features_to_display**: An array of strings specifying the feature names to include in the feature selection process. Required if `display_opt` is `"Custom"`.

### **Example Request Body**

```json
{
  "dataset": [
    {"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2, "species": "Iris-setosa"},
    {"sepal_length": 4.9, "sepal_width": 3.0, "petal_length": 1.4, "petal_width": 0.2, "species": "Iris-setosa"},
    // ... Add more data points
  ],
  "target_var": "species",
  "problem_type": "classification",
  "estimator_name": "RandomForestClassifier",
  "kfold": 5,
  "display_opt": "All"
}
```

---

## **Response Structure**

The API responds with a JSON object containing the following keys:

- **selected_features**: An array of strings listing the features selected by the algorithm.
- **dropped_features**: An array of strings listing the features that were dropped.
- **selected_feature_scores**: An array of objects containing scores for the selected features.
- **dropped_feature_scores**: An array of objects containing scores for the dropped features.
- **plot_data**: A JSON string representing the Plotly figure, which can be rendered on the frontend.
- **modified_dataset_csv**: A base64-encoded string of the CSV data of the dataset with only the selected features.

### **Example Response**

```json
{
  "selected_features": ["petal_length", "petal_width"],
  "dropped_features": ["sepal_length", "sepal_width"],
  "selected_feature_scores": [
    {"Features": "petal_length", "Accuracy": 0.96, "Precision": 0.95, "Recall": 0.96, "F1": 0.95},
    {"Features": "petal_width", "Accuracy": 0.95, "Precision": 0.94, "Recall": 0.95, "F1": 0.94}
  ],
  "dropped_feature_scores": [
    {"Features": "sepal_length", "Accuracy": 0.78, "Precision": 0.77, "Recall": 0.78, "F1": 0.77},
    {"Features": "sepal_width", "Accuracy": 0.80, "Precision": 0.79, "Recall": 0.80, "F1": 0.79}
  ],
  "plot_data": "{...}",  // JSON string of the Plotly figure
  "modified_dataset_csv": "base64_encoded_string_here"
}
```

---

## **Handling Responses in React**

### **Fetching Data from the API**

Use `fetch`, `axios`, or any HTTP client to send a POST request to the API.

```javascript
import axios from 'axios';

const apiUrl = 'http://localhost:8000/api/pfs/';

const requestData = {
  dataset: [/* Your dataset here */],
  target_var: 'species',
  problem_type: 'classification',
  estimator_name: 'RandomForestClassifier',
  kfold: 5,
  display_opt: 'All'
};

axios.post(apiUrl, requestData)
  .then(response => {
    // Handle the response data
    const data = response.data;
    // Process data.selected_features, data.plot_data, etc.
  })
  .catch(error => {
    // Handle errors
    console.error('Error fetching data:', error);
  });
```

---

## **Rendering Plotly Charts**

The `plot_data` returned by the API is a JSON string of the Plotly figure. You can render this chart in your React application using the `react-plotly.js` library.

### **Installing react-plotly.js**

```bash
npm install react-plotly.js plotly.js
```

### **Rendering the Plot**

```javascript
import React from 'react';
import Plot from 'react-plotly.js';

function FeatureSelectionPlot({ plotDataJson }) {
  const plotData = JSON.parse(plotDataJson);

  return (
    <Plot
      data={plotData.data}
      layout={plotData.layout}
      config={plotData.config}
    />
  );
}

export default FeatureSelectionPlot;
```

**Usage:**

```javascript
// Inside your component after fetching data
<FeatureSelectionPlot plotDataJson={response.data.plot_data} />
```

---

## **Downloading Modified Dataset**

The `modified_dataset_csv` is a base64-encoded string of the CSV data containing only the selected features. You can decode this string and offer it as a downloadable file to the user.

### **Decoding Base64 String**

```javascript
const csvDataBase64 = response.data.modified_dataset_csv;
const csvData = atob(csvDataBase64);  // Decodes the base64 string
```

### **Creating a Download Link**

```javascript
function downloadCSV(csvData, filename = 'modified_dataset.csv') {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

**Usage:**

```javascript
<button onClick={() => downloadCSV(csvData)}>Download Modified Dataset</button>
```

---

## **Error Handling**

The API includes error handling and will return an error message in the following format if something goes wrong:

```json
{
  "error": "Error message detailing what went wrong."
}
```

### **Handling Errors in React**

```javascript
axios.post(apiUrl, requestData)
  .then(response => {
    // Check if the response contains an error
    if (response.data.error) {
      console.error('API Error:', response.data.error);
      // Display error message to the user
    } else {
      // Process the successful response
    }
  })
  .catch(error => {
    // Network or server error
    console.error('Network Error:', error);
    // Display error message to the user
  });
```

---

## **Sample Integration Code**

Below is a simplified example of how you might integrate the API into a React component.

```javascript
import React, { useState } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

function FeatureSelectionComponent() {
  const [plotData, setPlotData] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [csvData, setCsvData] = useState('');

  const fetchFeatureSelection = () => {
    const apiUrl = 'http://localhost:8000/api/pfs/';
    const requestData = {
      dataset: [/* Your dataset here */],
      target_var: 'species',
      problem_type: 'classification',
      estimator_name: 'RandomForestClassifier',
      kfold: 5,
      display_opt: 'All'
    };

    axios.post(apiUrl, requestData)
      .then(response => {
        if (response.data.error) {
          console.error('API Error:', response.data.error);
        } else {
          setPlotData(JSON.parse(response.data.plot_data));
          setSelectedFeatures(response.data.selected_features);
          setCsvData(atob(response.data.modified_dataset_csv));
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  const downloadCSV = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modified_dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <button onClick={fetchFeatureSelection}>Run Feature Selection</button>

      {plotData && (
        <Plot
          data={plotData.data}
          layout={plotData.layout}
          config={plotData.config}
        />
      )}

      {selectedFeatures.length > 0 && (
        <div>
          <h3>Selected Features:</h3>
          <ul>
            {selectedFeatures.map(feature => <li key={feature}>{feature}</li>)}
          </ul>
        </div>
      )}

      {csvData && (
        <button onClick={downloadCSV}>Download Modified Dataset</button>
      )}
    </div>
  );
}

export default FeatureSelectionComponent;
```

---

## **Additional Notes**

- **Dataset Formatting**: Ensure that the dataset is properly formatted as an array of objects, with each object representing a data point. Feature names and target variable names should match exactly between the dataset and the parameters.

- **CORS Configuration**: If the API is hosted on a different domain or port than your React application, ensure that Cross-Origin Resource Sharing (CORS) is properly configured on the server to allow requests from your frontend.

- **Large Datasets**: Be cautious when sending very large datasets in JSON format, as this can affect performance. Consider implementing pagination or data compression if necessary.

- **Authentication**: If the API requires authentication (e.g., tokens, API keys), ensure that you include the necessary headers or credentials in your requests.

- **Error Messages**: Provide user-friendly error messages and consider implementing retries or fallbacks in case of network issues.

- **Environment Variables**: Store API URLs and other configuration settings in environment variables or configuration files to make your application more maintainable.

---

## **Conclusion**

By following this guide, you should be able to integrate the Feature Selection API into your React application effectively. This integration will enable you to perform feature selection on datasets, visualize the results, and provide users with the ability to download modified datasets.

If you encounter any issues or have questions, please reach out to the backend development team for assistance.

---

**Happy Coding!**