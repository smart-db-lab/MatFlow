from typing import List, Dict, Union, Optional
import pandas as pd
import numpy as np


def _maybe_add_hyphen(variables: List[str], add_hyphen: bool = False) -> List[str]:
    """Add hyphen as first element to a list if requested.

    Args:
        variables: The list to potentially add a hyphen to
        add_hyphen: Whether to add a hyphen as first element

    Returns:
        The original list, possibly with a hyphen as first element
    """
    if add_hyphen:
        variables.insert(0, "-")
    return variables


def get_variables(data: pd.DataFrame, add_hyphen: bool = False) -> List[str]:
    """Get a list of all column names from a DataFrame.

    Args:
        data: The pandas DataFrame
        add_hyphen: Whether to add a hyphen as first element in the list

    Returns:
        List of column names, with optional hyphen as first element
    """
    variables = data.columns.to_list()
    return _maybe_add_hyphen(variables, add_hyphen)


def get_categorical(data: pd.DataFrame, add_hyphen: bool = False) -> List[str]:
    """Get a list of categorical column names from a DataFrame.

    Args:
        data: The pandas DataFrame
        add_hyphen: Whether to add a hyphen as first element in the list

    Returns:
        List of categorical column names, with optional hyphen as first element
    """
    cat_var = data.select_dtypes(include=['object']).columns.to_list()
    return _maybe_add_hyphen(cat_var, add_hyphen)


def get_numerical(data: pd.DataFrame, add_hyphen: bool = False) -> List[str]:
    """Get a list of numerical column names from a DataFrame.

    Args:
        data: The pandas DataFrame
        add_hyphen: Whether to add a hyphen as first element in the list

    Returns:
        List of numerical column names, with optional hyphen as first element
    """
    num_var = data.select_dtypes(exclude=['object']).columns.to_list()
    return _maybe_add_hyphen(num_var, add_hyphen)


def get_low_cardinality(data: pd.DataFrame, max_unique: int = 10, add_hyphen: bool = False) -> List[str]:
    """Get columns with low cardinality (few unique values).

    Args:
        data: The pandas DataFrame
        max_unique: Maximum number of unique values to be considered low cardinality
        add_hyphen: Whether to add a hyphen as first element in the list

    Returns:
        List of low cardinality column names, with optional hyphen as first element
    """
    variables = data.loc[:, (data.nunique() <= max_unique)].columns.to_list()
    return _maybe_add_hyphen(variables, add_hyphen)


def get_null(data: pd.DataFrame) -> List[str]:
    """Get columns that contain at least one null value.

    Args:
        data: The pandas DataFrame

    Returns:
        List of column names with at least one null value
    """
    return data.columns[data.isna().any()].to_list()


def get_dtypes(data: pd.DataFrame) -> Dict[str, str]:
    """Get the data types of all columns in a DataFrame.

    Args:
        data: The pandas DataFrame

    Returns:
        Dictionary mapping column names to their data types as strings
    """
    return data.dtypes.astype(str).to_dict()


def get_nunique(data: pd.DataFrame, column: Optional[str] = None) -> Union[List[int], int]:
    """Get the number of unique values in columns.

    Args:
        data: The pandas DataFrame
        column: Optional column name. If provided, returns count for that column only.

    Returns:
        List of unique value counts for all columns, or a single count if column is specified
    """
    if column:
        if column not in data.columns:
            raise ValueError(f"Column '{column}' not found in DataFrame")
        return data[column].nunique()
    return data.nunique().to_list()


def split_xy(data: pd.DataFrame, target_var: str) -> tuple:
    """Split data into features (X) and target (y).

    Args:
        data: The pandas DataFrame
        target_var: The name of the target variable

    Returns:
        Tuple of (X, y) where X is a DataFrame of features and y is a Series of the target
    """
    if target_var not in data.columns:
        raise ValueError(f"Target variable '{target_var}' not found in DataFrame")

    X = data.drop(target_var, axis=1)
    y = data[target_var]
    return X, y


def get_blank_columns(data: pd.DataFrame) -> List[str]:
    """Get columns that contain only null values.

    Args:
        data: The pandas DataFrame

    Returns:
        List of column names with all null values
    """
    return data.columns[data.isna().all()].to_list()