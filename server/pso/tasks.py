import logging

import pandas as pd
from celery import shared_task

from .utils import MLOptimizer, validate_request_data

logger = logging.getLogger(__name__)


def prepare_default_dataset():
    """Prepare default dataset if none is provided"""
    # Load dataset using relative path
    import os
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dataset', 'Graphs', 'small_dataset_5rows.csv')
    df = pd.read_csv(dataset_path)

    # Remove non-numeric columns for PSO optimization
    df.drop(columns=['Smiles'], inplace=True, errors='ignore')
    # Remove RingCount if it exists (it doesn't in small dataset)
    df.drop(columns=['RingCount'], inplace=True, errors='ignore')
    # Remove id column if it exists
    df.drop(columns=['id'], inplace=True, errors='ignore')

    target_col = 'Epsilon'
    features = [c for c in df.columns if c != target_col]

    logger.info(f"Dataset loaded with {len(df)} rows and {len(features)} features")
    logger.info(f"Target column: {target_col}")
    logger.info(f"Features: {features[:10]}...")  # Show first 10 features

    lb = df[features].min().tolist()   # element-wise minima
    ub = df[features].max().tolist()   # element-wise maxima

    return {
        "data": df.to_dict(orient="records"),
        "features": features,
        "target": target_col,
        "pso_config": {
            "lb": lb, 
            "ub": ub,
            "swarmsize": 50,
            "omega": 0.5,
            "phip": 1.5,
            "phig": 1.5,
            "maxiter": 4,
            "n_solutions": 3,
            "nprocessors": 2,
            "max_rounds": 5,
        },
        "target_value": [11],  # Default target value
        "scale_before_fit": True,
    }


@shared_task
def run_optimization_task(request_data):
    """
    API endpoint for ML model optimization with PSO
    """
    try:
        # If no data is provided, use default dataset
        if not request_data or 'data' not in request_data:
            logger.info("No data provided, using default dataset")
            request_data = prepare_default_dataset()
        
        # Validate request data
        validation_result = validate_request_data(request_data)
        if not validation_result['valid']:
            logger.error(f"Validation failed: {validation_result['message']}")
            return {'error': validation_result['message']}

        # Extract data from request
        data = request_data.get('data')
        features = request_data.get('features')
        target = request_data.get('target')
        pso_config = request_data.get('pso_config', {})
        target_values = request_data.get('target_value', [])
        scale_before_fit = request_data.get('scale_before_fit', True)

        logger.info(f"Starting optimization for targets: {target_values}")
        logger.info(f"Using {len(features)} features with {len(data)} data points")

        # Initialize optimizer
        optimizer = MLOptimizer(
            data=data,
            features=features,
            target=target,
            pso_config=pso_config,
            scale_before_fit=scale_before_fit
        )

        result = optimizer.optimize_for_targets(target_values)
        logger.info("Optimization completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Optimization failed: {str(e)}")
        return {'error': str(e)}