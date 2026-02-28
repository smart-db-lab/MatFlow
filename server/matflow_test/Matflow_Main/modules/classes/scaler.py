from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler,
    MaxAbsScaler, QuantileTransformer, PowerTransformer
)

class Scaler:
    def __init__(self, method: str, columns: list[str], **kwargs):
        self.method   = method
        self.columns  = columns
        self.kwargs   = kwargs      # pass-through to sklearn scaler
        self.scaler   = None        # set during fit()

    # ------------------------------------------------------------------ #
    # core sklearn-like interface
    # ------------------------------------------------------------------ #
    def fit(self, X):
        factory = {
            "No Scaling":            None,
            "Standard Scaler":       StandardScaler(**self.kwargs),
            "Min-Max Scaler":        MinMaxScaler(**self.kwargs),
            "Robust Scaler":         RobustScaler(**self.kwargs),
            "MaxAbs Scaler":         MaxAbsScaler(**self.kwargs),
            "Quantile Transformer":  QuantileTransformer(**self.kwargs),
            "Power Transformer":     PowerTransformer(**self.kwargs),
        }
        if self.method not in factory:
            raise ValueError(f"Unknown scaling method '{self.method}'. "
                             f"Choose from {list(factory)}")

        self.scaler = factory[self.method]
        if self.scaler is not None:
            self.scaler.fit(X[self.columns])
        return self          # for chaining

    def transform(self, X):
        X_tmp = X.copy()
        if self.scaler is not None:
            X_tmp[self.columns] = self.scaler.transform(X_tmp[self.columns])
        return X_tmp

    def inverse_transform(self, X):
        """Undo scaling—to match the notebook’s post-analysis plots."""
        X_tmp = X.copy()
        if self.scaler is not None:
            X_tmp[self.columns] = self.scaler.inverse_transform(X_tmp[self.columns])
        return X_tmp

    # convenience one-liner
    def fit_transform(self, X):
        return self.fit(X).transform(X)
