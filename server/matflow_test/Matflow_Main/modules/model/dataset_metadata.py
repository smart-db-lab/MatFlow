import pandas as pd
from django.http import JsonResponse
from Matflow.debug_utilities import debug, info, error, debug_function

@debug_function
def get_dataset_metadata(file):
    """
    Get dataset metadata including column names, types, and sample rows.
    This is optimized to avoid loading the entire dataset when only metadata is needed.
    
    Returns:
        - columns: List of column names
        - column_types: Dictionary mapping column names to their detected types (numerical/categorical)
        - sample_rows: First 5 rows of the dataset for type inference
        - total_rows: Total number of rows in the dataset
        - shape: Dataset dimensions [rows, columns]
    """
    try:
        info("Getting dataset metadata...")
        
        # Extract data
        data = pd.DataFrame(file.get("file"))
        debug(f"Dataset shape: {data.shape}")
        
        # Get basic information
        columns = data.columns.tolist()
        total_rows, total_cols = data.shape
        
        # Sample first 5 rows for type inference
        sample_data = data.head(5)
        
        # Detect column types
        column_types = {}
        for col in columns:
            # Check if the column contains numeric data
            if pd.api.types.is_numeric_dtype(data[col]):
                column_types[col] = "numerical"
            else:
                column_types[col] = "categorical"
        
        # Get sample rows as dictionary
        sample_rows = sample_data.to_dict(orient="records")
        
        debug(f"Columns: {columns}")
        debug(f"Column types: {column_types}")
        debug(f"Sample rows count: {len(sample_rows)}")
        
        info("Dataset metadata extraction completed successfully")
        
        return JsonResponse({
            "columns": columns,
            "column_types": column_types,
            "sample_rows": sample_rows,
            "total_rows": total_rows,
            "total_cols": total_cols,
            "shape": [total_rows, total_cols]
        }, safe=False)
        
    except Exception as e:
        error(f"Error getting dataset metadata: {str(e)}")
        import traceback
        error(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)