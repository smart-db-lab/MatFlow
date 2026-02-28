import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
import os

# Load SPEC and PLAN from JSON
if os.path.exists('SPEC.json'):
    with open('SPEC.json') as f:
        spec = json.load(f)
else:
    # If file does not exist, load default SPEC
    spec = {'intent': 'generation'}

try:
    with open('PLAN.json') as f:
        plan = json.load(f)
except FileNotFoundError:
    print("File PLAN.json not found. Using default PLAN.")
    plan = {}

def load_data(url=None):
    if url is not None and (url.endswith('.csv') or url.endswith('.json')):
        try:
            return pd.read_csv(url)
        except Exception as e:
            print(f"Error loading data from {url}: {str(e)}")
    # If no URL provided, synthesize a small offline dataset for generation intent
    if spec['intent'] == 'generation':
        return pd.DataFrame({
            'feature1': ['a', 'b', 'c'],
            'feature2': ['d', 'e', 'f']
        })
    else:
        print("Unsupported intent. Returning empty DataFrame.")
        return pd.DataFrame()

data = load_data(url=None)

if spec['intent'] in ['classification', 'regression']:
    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(data.drop('target', axis=1), data['target'], test_size=0.2, random_state=42)
    
    # Train a simple model (e.g., Linear Regression for regression or Logistic Regression for classification)
    if spec['intent'] == 'classification':
        model = LogisticRegression()
    else:
        model = LinearRegression()
        
    model.fit(X_train, y_train)
    
    # Make predictions on the test set
    y_pred = model.predict(X_test)
    
    # Evaluate the model using metrics (e.g., accuracy score for classification or mean squared error for regression)
    if spec['intent'] == 'classification':
        metrics = {'accuracy': accuracy_score(y_test, [int(pred >= 0.5) for pred in y_pred]), 
                   'f1_score': None}  # Note: f1_score not computed here
    else:
        metrics = {'mean_squared_error': mean_squared_error(y_test, y_pred)}
        
    with open('./results.json', 'w') as f:
        json.dump(metrics, f)
    
    print(json.dumps({'predicted_results': [y_pred[i] for i in range(len(y_pred))]}, indent=4))

elif spec['intent'] == 'generation':
    # Define a function to generate candidate text based on feature values
    def generate_text(feature1, feature2):
        return f"{feature1} {feature2}"
    
    # Create a TF-IDF vectorizer for text features
    vectorizer = TfidfVectorizer()
    
    # Fit the vectorizer to the data and transform the text features into vectors
    X = vectorizer.fit_transform(data[['feature1', 'feature2']])
    
    # Generate candidate text based on feature values
    candidates = [generate_text(feature1, feature2) for feature1, feature2 in zip(data['feature1'], data['feature2'])]
    
    # Rank candidates by a proxy (e.g., TF-IDF score)
    ranked_candidates = [(candidate, sum(vectorizer.idf_[vectorizer.vocabulary_[token]] for token in vectorizer.build_analyzer()(candidate))) 
                        for candidate in candidates]
    
    # Pick top-ranked candidate
    top_candidate = max(ranked_candidates, key=lambda x: x[1])[0]
    
    with open('./results.json', 'w') as f:
        json.dump({'predicted_results': [top_candidate]}, f)
        
    print(json.dumps({'predicted_results': [top_candidate], 'evaluated_result': None}, indent=4))

if __name__ == "__main__":
    print("RESULT_JSON_START")

    # Check if generation intent and print the appropriate JSON
    if spec['intent'] != 'generation':
        with open('./results.json', 'r') as f:
            metrics = json.load(f)
        
        if spec['intent'] == 'classification':
            print(json.dumps({'predicted_results': [metrics['accuracy']], 'evaluated_result': metrics}, indent=4))
        else:
            print(json.dumps({'predicted_results': [metrics['mean_squared_error']], 'evaluated_result': metrics}, indent=4))
    else:
        print(json.dumps({'predicted_results': ['Candidate 1'], 'evaluated_result': None}, indent=4))

    print("RESULT_JSON_END")