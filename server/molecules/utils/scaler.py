"""
Scaler-evaluation helpers.  No Django / Streamlit imports.
"""
from __future__ import annotations
import io, base64, pickle, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np, pandas as pd
from typing import Dict, Any, List, Tuple
from scipy.stats import skew
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler, MaxAbsScaler,
    QuantileTransformer, PowerTransformer,
)
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor

try:                      from xgboost import XGBRegressor
except ImportError:       XGBRegressor = None
try:                      from catboost import CatBoostRegressor
except ImportError:       CatBoostRegressor = None


# ──────────────────────────── helpers ────────────────────────────
def _b64_pickle(obj):  # pickle ▶ b64 str
    buf = io.BytesIO(); pickle.dump(obj, buf); buf.seek(0)
    return base64.b64encode(buf.read()).decode()

def _b64_csv(df: pd.DataFrame):
    return base64.b64encode(df.to_csv(index=False).encode()).decode()

def _b64_fig(fig):
    buf = io.BytesIO(); fig.savefig(buf, format="png", bbox_inches="tight", dpi=160)
    buf.seek(0); return base64.b64encode(buf.read()).decode()


# ────────────────────────── core evaluator ───────────────────────
class ScalerEvaluator:
    # scalers & short tags -------------
    _SCALERS: Dict[str, Any] = {
        "No Scaling": None,
        "StandardScaler": StandardScaler(),
        "MinMaxScaler": MinMaxScaler(),
        "RobustScaler": RobustScaler(),
        "MaxAbsScaler": MaxAbsScaler(),
        'QuantileTransformer (output_distribution="normal")':
            QuantileTransformer(output_distribution="normal"),
        "PowerTransformer (Yeo-Johnson)": PowerTransformer(method="yeo-johnson"),
    }
    _SHORT = {
        "No Scaling": "NoScale", "StandardScaler": "Standard", "MinMaxScaler": "MinMax",
        "RobustScaler": "Robust", "MaxAbsScaler": "MaxAbs",
        'QuantileTransformer (output_distribution="normal")': "QT",
        "PowerTransformer (Yeo-Johnson)": "PT_YJ",
    }

    # available models ------------------
    @staticmethod
    def _models():
        models = {
            "RF": RandomForestRegressor(n_estimators=100, random_state=42),
            "DT": DecisionTreeRegressor(random_state=42),
        }
        if XGBRegressor:  models["XGB"] = XGBRegressor(n_estimators=100, random_state=42, verbosity=0)
        if CatBoostRegressor: models["CB"] = CatBoostRegressor(verbose=0, random_state=42)
        return models

    # ---------- full grid evaluation ----------
    def evaluate(self, X, y, *, test_size=.2, random_state=42) -> pd.DataFrame:
        Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=test_size, random_state=random_state)
        rows: List[Dict[str, Any]] = []
        for sc_name, scaler in self._SCALERS.items():
            Xtr_s, Xte_s = (Xtr.copy(), Xte.copy())
            if scaler: 
                try:
                    scaler.fit(Xtr)
                    Xtr_s, Xte_s = scaler.transform(Xtr), scaler.transform(Xte)
                except Exception as e:
                    print(f"Scaler {sc_name} failed: {e}")
                    continue
            
            try:
                avg_skew = float(np.nanmean(np.abs(skew(Xtr_s, axis=0, nan_policy="omit"))))
                if np.isnan(avg_skew) or np.isinf(avg_skew):
                    avg_skew = 0.0
            except Exception:
                avg_skew = 0.0
                
            for mdl_name, mdl in self._models().items():
                try:
                    mdl.fit(Xtr_s, ytr)
                    pred = mdl.predict(Xte_s)
                    
                    r2 = float(r2_score(yte, pred))
                    mse = float(mean_squared_error(yte, pred))
                    
                    # Handle NaN/inf values
                    if np.isnan(r2) or np.isinf(r2):
                        r2 = 0.0
                    if np.isnan(mse) or np.isinf(mse):
                        mse = float('inf')
                    
                    rows.append({
                        "Scaler": self._SHORT[sc_name], "Model": mdl_name,
                        "R2": r2,
                        "MSE": mse,
                        "Skew": avg_skew,
                    })
                except Exception as e:
                    print(f"Model {mdl_name} with scaler {sc_name} failed: {e}")
                    continue
        return pd.DataFrame(rows)

    # ---------- ranking ----------
    def rank(self, grid_df, *, w_r2=.5, w_mse=.3, w_skew=.2):
        if grid_df.empty:
            return pd.DataFrame()
            
        mean_df = grid_df.groupby("Scaler")[["R2", "MSE", "Skew"]].mean().reset_index()
        
        # Fill any NaN values with defaults
        mean_df["R2"] = mean_df["R2"].fillna(0.0)
        mean_df["MSE"] = mean_df["MSE"].fillna(float('inf'))
        mean_df["Skew"] = mean_df["Skew"].fillna(0.0)
        
        mean_df["R2_rank"]   = mean_df["R2"].rank(ascending=False, method="min")
        mean_df["MSE_rank"]  = mean_df["MSE"].rank(ascending=True,  method="min")
        mean_df["Skew_rank"] = mean_df["Skew"].rank(ascending=True,  method="min")
        mean_df["Overall"]   = w_r2*mean_df["R2_rank"] + w_mse*mean_df["MSE_rank"] + w_skew*mean_df["Skew_rank"]
        return mean_df.sort_values("Overall").reset_index(drop=True)

    # ---------- best scaler & transform ----------
    def transform_with_best(self, X, best_short):
        full = {v:k for k,v in self._SHORT.items()}[best_short]
        scaler = self._SCALERS[full]; Xs = scaler.fit_transform(X) if scaler else X.copy().values
        return pd.DataFrame(Xs, columns=X.columns), scaler

    # ---------- overview chart ----------
    def overview_png(self, grid_df, rank_df):
        sns.set(style="whitegrid")
        fig, axes = plt.subplots(2,2,figsize=(14,10),dpi=160); axes=axes.flatten()
        for i,(col,ylab) in {0:("R2","R² ↑"),1:("MSE","MSE ↓"),2:("Skew","Skew ↓")}.items():
            grid_df.pivot(index="Scaler", columns="Model", values=col).plot(ax=axes[i], marker="o")
            axes[i].set_ylabel(ylab); axes[i].set_xlabel("Scaler"); axes[i].tick_params(axis="x",rotation=45)
        sns.barplot(y="Scaler", x="Overall", data=rank_df.sort_values("Overall"),
                    ax=axes[3], palette="viridis", edgecolor="black")
        axes[3].set_xlabel("Weighted rank ↓"); axes[3].set_ylabel("")
        fig.tight_layout(); return _b64_fig(fig)

    # ---------- individual chart methods ----------
    def r2_chart_png(self, grid_df):
        """Create R² performance chart by scaler"""
        sns.set(style="whitegrid")
        fig, ax = plt.subplots(figsize=(10, 6), dpi=160)
        grid_df.pivot(index="Scaler", columns="Model", values="R2").plot(ax=ax, marker="o")
        ax.set_ylabel("R² ↑")
        ax.set_xlabel("Scaler")
        ax.tick_params(axis="x", rotation=45)
        ax.set_title("R² Performance by Scaler and Model")
        fig.tight_layout()
        return _b64_fig(fig)

    def mse_chart_png(self, grid_df):
        """Create MSE performance chart by scaler"""
        sns.set(style="whitegrid")
        fig, ax = plt.subplots(figsize=(10, 6), dpi=160)
        grid_df.pivot(index="Scaler", columns="Model", values="MSE").plot(ax=ax, marker="o")
        ax.set_ylabel("MSE ↓")
        ax.set_xlabel("Scaler")
        ax.tick_params(axis="x", rotation=45)
        ax.set_title("MSE Performance by Scaler and Model")
        fig.tight_layout()
        return _b64_fig(fig)

    def skew_chart_png(self, grid_df):
        """Create skew performance chart by scaler"""
        sns.set(style="whitegrid")
        fig, ax = plt.subplots(figsize=(10, 6), dpi=160)
        grid_df.pivot(index="Scaler", columns="Model", values="Skew").plot(ax=ax, marker="o")
        ax.set_ylabel("Skew ↓")
        ax.set_xlabel("Scaler")
        ax.tick_params(axis="x", rotation=45)
        ax.set_title("Skew Performance by Scaler and Model")
        fig.tight_layout()
        return _b64_fig(fig)

    def weighted_rank_chart_png(self, rank_df):
        """Create weighted rank chart"""
        sns.set(style="whitegrid")
        fig, ax = plt.subplots(figsize=(10, 6), dpi=160)
        sns.barplot(y="Scaler", x="Overall", data=rank_df.sort_values("Overall"),
                    ax=ax, palette="viridis", edgecolor="black")
        ax.set_xlabel("Weighted Rank ↓")
        ax.set_ylabel("Scaler")
        ax.set_title("Overall Weighted Rank by Scaler")
        fig.tight_layout()
        return _b64_fig(fig)

    # ---------- serialization helpers ----------
    csv_b64   = staticmethod(_b64_csv)
    pickle_b64 = staticmethod(_b64_pickle)
