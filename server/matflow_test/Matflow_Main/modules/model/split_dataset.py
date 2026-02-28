import pandas as pd
from django.http import JsonResponse
from sklearn.model_selection import train_test_split
from Matflow.debug_utilities import debug, info, error, debug_function

# Constants for default values
DEFAULT_TEST_SIZE = 0.2
DEFAULT_RANDOM_STATE = 42
DEFAULT_SHUFFLE = True

@debug_function
def split_dataset(file):
    """
    Split a dataset into training and testing sets with proper default handling.
    """
    try:
        info(f"Split dataset function called with keys: {file.keys()}")
        
        # Extract data
        data = pd.DataFrame(file.get("file"))
        debug(f"Input data shape: {data.shape}, columns: {data.columns.tolist()}")
        
        # Extract other parameters with proper defaults
        target_var = file.get("target_variable")
        stratify = file.get("stratify")
        
        # Handle null values with defaults
        test_size = file.get("test_size")
        if test_size is None:
            debug(f"test_size is None, using default value: {DEFAULT_TEST_SIZE}")
            test_size = DEFAULT_TEST_SIZE
        else:
            test_size = float(test_size)
            
        random_state = file.get("random_state")
        if random_state is None:
            debug(f"random_state is None, using default value: {DEFAULT_RANDOM_STATE}")
            random_state = DEFAULT_RANDOM_STATE
        else:
            random_state = int(random_state)
            
        # Fix for the current issue - ensure shuffle is always a boolean
        shuffle = file.get("shuffle")
        if shuffle is None:
            debug(f"shuffle is None, using default value: {DEFAULT_SHUFFLE}")
            shuffle = DEFAULT_SHUFFLE
        else:
            # Convert to boolean in case it's a string
            shuffle = bool(shuffle)
        
        debug(f"Target variable: {target_var}")
        debug(f"Stratify: {stratify}")
        debug(f"Test size: {test_size}")
        debug(f"Random state: {random_state}")
        debug(f"Shuffle: {shuffle}")
        
        # Check if target variable exists in data
        if target_var not in data.columns:
            error_msg = f"Target variable '{target_var}' not found in data columns: {data.columns.tolist()}"
            error(error_msg)
            return JsonResponse({"error": error_msg}, status=400)
        
        # Log target variable info
        debug(f"Target variable '{target_var}' data type: {data[target_var].dtype}")
        debug(f"Target variable unique values: {data[target_var].nunique()}")
        
        # Handle stratify parameter
        if stratify is None or stratify == "-" or stratify.strip()=="":
            debug("Stratify is disabled")
            stratify_data = None
        else:
            debug(f"Using stratify with column: {stratify}")
            if stratify not in data.columns:
                error(f"Stratify column '{stratify}' not found in data")
                return JsonResponse({"error": f"Stratify column '{stratify}' not found in data"}, status=400)
            stratify_data = data[stratify]
        
        # Perform train-test split
        debug("Performing train_test_split...")
        try:
            X_train, X_test = train_test_split(
                data,
                test_size=test_size,
                random_state=random_state,
                stratify=stratify_data,
                shuffle=shuffle
            )
            debug(f"Train-test split successful. X_train shape: {X_train.shape}, X_test shape: {X_test.shape}")
        except Exception as e:
            error(f"Error during train_test_split: {str(e)}")
            return JsonResponse({"error": f"Error during train_test_split: {str(e)}"}, status=500)
        
        # Convert the split data to dictionaries
        debug("Converting dataframes to dictionaries...")
        X_train_dict = X_train.to_dict(orient="records")
        X_test_dict = X_test.to_dict(orient="records")
        
        debug(f"X_train_dict has {len(X_train_dict)} records")
        debug(f"X_test_dict has {len(X_test_dict)} records")
        
        info("Split dataset completed successfully")
        return JsonResponse({
            "train": X_train_dict,
            "test": X_test_dict
        }, safe=False)
        
    except Exception as e:
        error(f"Unexpected error in split_dataset: {str(e)}")
        import traceback
        error(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)