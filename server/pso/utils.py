# utils.py
import base64
import io
import time

import matplotlib
import numpy as np
import pandas as pd
import seaborn as sns
from matplotlib.lines import Line2D

matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.decomposition import PCA
from pyswarm import pso
import warnings
from xgboost import XGBRegressor
from catboost import CatBoostRegressor

warnings.filterwarnings('ignore')


def get_available_models():
    """Get list of available ML models"""
    models = ["Random Forest", "Decision Tree", "XGBoost", "CatBoost"]
    return models


def get_model(model_name):
    """Get model instance based on name"""
    if model_name == "Random Forest":
        return RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    elif model_name == "Decision Tree":
        return DecisionTreeRegressor(max_depth=10, random_state=42)
    elif model_name == "XGBoost":
        return XGBRegressor(n_estimators=100, max_depth=10, random_state=42, verbosity=0)
    elif model_name == "CatBoost":
        return CatBoostRegressor(iterations=100, depth=10, random_seed=42, verbose=0)
    else:
        raise ValueError(f"Model {model_name} not available")


def validate_request_data(data):
    """Validate incoming request data"""
    required_fields = ['data', 'features', 'target', 'target_value']

    for field in required_fields:
        if field not in data:
            return {'valid': False, 'message': f'Missing required field: {field}'}

    if not isinstance(data['data'], list) or len(data['data']) == 0:
        return {'valid': False, 'message': 'Data must be a non-empty list'}

    if not isinstance(data['features'], list) or len(data['features']) == 0:
        return {'valid': False, 'message': 'Features must be a non-empty list'}

    if not isinstance(data['target_value'], list) or len(data['target_value']) == 0:
        return {'valid': False, 'message': 'Target values must be a non-empty list'}

    # Validate that all data rows have required features and target
    for i, row in enumerate(data['data']):
        for feature in data['features']:
            if feature not in row:
                return {'valid': False, 'message': f'Feature {feature} missing in data row {i}'}
        if data['target'] not in row:
            return {'valid': False, 'message': f'Target {data["target"]} missing in data row {i}'}

    return {'valid': True, 'message': 'Valid data'}


def objective_function(x, target_value, regressor, features):
    """Objective function for PSO optimization"""
    x_df = pd.DataFrame([x], columns=features)
    prediction = regressor.predict(x_df)[0]
    error = abs(prediction - target_value)
    return error


def plot_to_base64(fig):
    """Convert matplotlib figure to base64 string"""

    buffer = io.BytesIO()
    # fname = f"{uuid.uuid4()}.png"
    # fig.savefig(fname, format='png', dpi=100, bbox_inches='tight')
    fig.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    buffer.close()
    plt.show()
    plt.close(fig)
    return image_base64



class MLOptimizer:
    def __init__(self, data, features, target, pso_config, scale_before_fit=True):
        self.data = pd.DataFrame(data)
        self.features = features
        self.target = target
        self.pso_config = self._set_default_pso_config(pso_config)
        self.scale_before_fit = scale_before_fit
        self.scaler = StandardScaler() if scale_before_fit else None
        self.models = {}
        self.model_performances = {}
        self.optimized_solutions = []

        # Prepare data
        self.X = self.data[self.features]
        self.y = self.data[self.target]

        # Train-test split - adjust for small datasets
        if len(self.data) < 10:
            # For very small datasets, use smaller test size or skip splitting
            test_size = max(0.1, 1/len(self.data))  # At least 1 sample in test
            self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
                self.X, self.y, test_size=test_size, random_state=42
            )
        else:
            self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
                self.X, self.y, test_size=0.2, random_state=42
            )

        # Scale features if requested
        if self.scale_before_fit:
            self.X_train_scaled = self.scaler.fit_transform(self.X_train)
            self.X_test_scaled = self.scaler.transform(self.X_test)
        else:
            self.X_train_scaled = self.X_train.values
            self.X_test_scaled = self.X_test.values

        # Train models
        self._train_models()

    def _set_default_pso_config(self, pso_config):
        """Set default PSO configuration with robust bounds calculation"""
        defaults = {
            'swarmsize': 30,
            'omega': 0.5,
            'phip': 0.5,
            'phig': 0.5,
            'maxiter': 50,
            'n_solutions': 10,
            'nprocessors': 1,
            'max_rounds': 5
        }

        # Use provided bounds or calculate from data
        if 'lb' not in pso_config or 'ub' not in pso_config:
            lb = self.X[self.features].min().tolist()
            ub = self.X[self.features].max().tolist()

            # More robust bounds calculation
            for i in range(len(lb)):
                if ub[i] <= lb[i]:
                    # Handle case where min == max (constant feature)
                    if lb[i] == 0:
                        # If value is 0, use symmetric bounds
                        lb[i] = -1.0
                        ub[i] = 1.0
                    elif lb[i] > 0:
                        # For positive values, create bounds around the value
                        margin = max(1.0, abs(lb[i]) * 0.5)  # 50% margin
                        lb[i] = lb[i] - margin
                        ub[i] = lb[i] + 2 * margin  # lb[i] was modified, so add 2*margin
                    else:
                        # For negative values
                        margin = max(1.0, abs(lb[i]) * 0.5)  # 50% margin
                        ub[i] = lb[i] + margin
                        lb[i] = lb[i] - margin
                else:
                    # Even when ub > lb, add some padding for better exploration
                    range_val = ub[i] - lb[i]
                    padding = max(0.1, range_val * 0.1)  # 10% padding
                    lb[i] = lb[i] - padding
                    ub[i] = ub[i] + padding

            # Final validation to ensure all bounds are valid
            for i in range(len(lb)):
                if ub[i] <= lb[i]:
                    print(f"Warning: Invalid bounds for feature {self.features[i]}: lb={lb[i]}, ub={ub[i]}")
                    # Fallback: create reasonable bounds
                    center = (lb[i] + ub[i]) / 2 if not np.isnan(lb[i] + ub[i]) else 0
                    lb[i] = center - 1.0
                    ub[i] = center + 1.0
                    print(f"Fixed bounds for feature {self.features[i]}: lb={lb[i]}, ub={ub[i]}")

            pso_config['lb'] = lb
            pso_config['ub'] = ub

        # Update defaults with provided config
        defaults.update(pso_config)

        # Debug print for verification
        print(f"PSO Bounds - LB: {defaults['lb']}")
        print(f"PSO Bounds - UB: {defaults['ub']}")

        return defaults

    def _train_models(self):
        """Train all available models"""
        available_models = get_available_models()

        for model_name in available_models:
            try:
                model = get_model(model_name)

                # Train model
                if self.scale_before_fit:
                    model.fit(self.X_train_scaled, self.y_train)
                else:
                    model.fit(self.X_train, self.y_train)

                # Evaluate model
                if self.scale_before_fit:
                    y_pred = model.predict(self.X_test_scaled)
                else:
                    y_pred = model.predict(self.X_test)

                r2 = r2_score(self.y_test, y_pred)
                mse = mean_squared_error(self.y_test, y_pred)
                
                # Handle potential NaN/inf values
                if np.isnan(r2) or np.isinf(r2):
                    r2 = 0.0
                if np.isnan(mse) or np.isinf(mse):
                    mse = float('inf')

                self.models[model_name] = model
                self.model_performances[model_name] = {
                    'r2': float(r2),
                    'mse': float(mse),
                    'y_pred': [float(p) if not (np.isnan(p) or np.isinf(p)) else 0.0 for p in y_pred]
                }

                print(f"Trained {model_name}: R²={r2:.4f}, MSE={mse:.4f}")

            except Exception as e:
                print(f"Failed to train {model_name}: {str(e)}")
                continue

    def _optimize_single_target(self, target_value, n_solutions=5):
        results = {}

        for model_name, model in self.models.items():
            solutions = []

            for solution_num in range(n_solutions):
                try:
                    start_time = time.time()

                    xopt, fopt = pso(
                        objective_function,
                        self.pso_config['lb'],
                        self.pso_config['ub'],
                        args=(target_value, model, self.features),
                        swarmsize=self.pso_config['swarmsize'],
                        omega=self.pso_config['omega'],
                        phip=self.pso_config['phip'],
                        phig=self.pso_config['phig'],
                        maxiter=self.pso_config['maxiter'],
                        debug=False
                    )

                    runtime = time.time() - start_time

                    if self.scale_before_fit:
                        xopt_scaled = self.scaler.transform([xopt])
                        prediction = model.predict(xopt_scaled)[0]
                    else:
                        x_df = pd.DataFrame([xopt], columns=self.features)
                        prediction = model.predict(x_df)[0]

                    error = abs(prediction - target_value)
                    accuracy_like = max(0, 1 - error / abs(target_value) if abs(target_value) > 1e-10 else 0)

                    # Clean up any problematic float values
                    def clean_float(val):
                        if np.isnan(val) or np.isinf(val):
                            return 0.0
                        return float(val)

                    solutions.append({
                        'solution': {feature: clean_float(xopt[i]) for i, feature in enumerate(self.features)},
                        'prediction': clean_float(prediction),
                        'error': clean_float(error),
                        'runtime': clean_float(runtime),
                        'fopt': clean_float(fopt),
                        'mse': clean_float(self.model_performances[model_name]['mse']),
                        'r2': clean_float(self.model_performances[model_name]['r2']),
                        'accuracy_like': clean_float(accuracy_like),
                        'y_pred_on_test': self.model_performances[model_name]['y_pred']
                    })

                except Exception as e:
                    print(f"Optimization failed for {model_name} (run {solution_num}): {str(e)}")
                    continue

            results[model_name] = solutions

        return results

    def _generate_graphs(self, results):
        """Generate visualization graphs"""
        graphs = {}

        try:

            # 2. PSO Convergence
            graphs['pso_convergence'] = self._plot_pso_convergence(results)

            # 3. PCA Analysis
            graphs['pca_analysis'] = self._plot_pca_analysis(results)

            # 4. R² Heatmap
            graphs['r2_heatmap'] = self._plot_r2_heatmap(results)

            # 5. Error Distribution
            graphs['error_distribution'] = self._plot_error_distribution(results)

            # 6. Predicted vs Target Strip Plot
            graphs['predicted_vs_target_strip'] = self._plot_predicted_vs_target_strip(results)

            # 7. Predicted vs Target Scatter Plot
            graphs['predicted_vs_target_scatter'] = self._plot_predicted_vs_target_scatter(results)

            # 1. Model Comparison Chart
            graphs['model_comparison'] = self._plot_model_comparison(results)

        except Exception as e:
            print(f"Graph generation failed: {str(e)}")

        return graphs

    # ───────────────────────────────────────────────────────────
    # 1️⃣  MODEL-COMPARISON  (bar chart of mean R² / MSE / ACC)
    # ───────────────────────────────────────────────────────────
    def _plot_model_comparison(self, results):
        """Aggregate per-model metrics across all PSO runs and plot."""
        try:
            plot_data = []

            for res in results:
                for model_name, runs in res['comparison_table'].items():
                    # ── aggregate (mean) across runs ──────────────────────────
                    r2 = np.mean([r['r2'] for r in runs])
                    mse = np.mean([r['mse'] for r in runs])
                    acc = np.mean([r['accuracy_like'] for r in runs])
                    plot_data.append({
                        'Model': model_name,
                        'R2 Score': r2,
                        'MSE': mse,
                        'Accuracy (pseudo)': acc
                    })

            results_df = pd.DataFrame(plot_data)
            metrics_df = results_df.groupby("Model")[["R2 Score", "MSE", "Accuracy (pseudo)"]].mean().reset_index()

            colors = ['#4c72b0', '#55a868', '#c44e52', '#8172b3'][:len(metrics_df)]
            bar_width = 0.2
            x_spacing = 0.3
            models = metrics_df["Model"].tolist()
            x_pos = [i * x_spacing for i in range(len(models))]

            fig, axes = plt.subplots(1, 3, figsize=(12, 3))
            metrics = [("R2 Score", "R² Score"),
                       ("MSE", "MSE"),
                       ("Accuracy (pseudo)", "Accuracy")]

            for i, (key, ylabel) in enumerate(metrics):
                vals = metrics_df[key]
                axes[i].bar(x_pos, vals, width=bar_width, color=colors, edgecolor='white', linewidth=.5)
                axes[i].set_xticks(x_pos)
                axes[i].set_xticklabels(models, rotation=45, ha='right')
                axes[i].set_ylabel(ylabel)
                for pos, val in zip(x_pos, vals):
                    axes[i].text(pos, val * 1.02, f"{val:.2f}", ha='center', va='bottom', fontsize=8)

            plt.suptitle("Model Performance Metrics (mean across PSO runs)", y=1.08)
            plt.tight_layout()
            return plot_to_base64(fig)

        except Exception as e:
            print(f"Model comparison plot failed: {e}")
            return None

    def _plot_pso_convergence(self, results):
        """Plot PSO convergence curves from multiple explicit runs"""
        try:
            convergence_data = []

            for result in results:
                target_value = result['target_value']

                for model_name, model_solutions in result['comparison_table'].items():
                    for iteration, solution in enumerate(model_solutions):
                        convergence_data.append({
                            'Target Value': target_value,
                            'Model': model_name,
                            'Iteration': iteration,
                            '% Error': solution['error'] * 100  # Convert to percentage
                        })

            convergence_df = pd.DataFrame(convergence_data)
            convergence_df = convergence_df.groupby(['Model', 'Iteration'])['% Error'].min().reset_index()

            plt.figure(figsize=(10, 6))
            for model in convergence_df['Model'].unique():
                subset = convergence_df[convergence_df['Model'] == model]
                plt.plot(subset['Iteration'], subset['% Error'], marker='o', label=model)

            plt.title("PSO Convergence Curve (Best % Error per Iteration)")
            plt.xlabel("Iteration")
            plt.ylabel("Best % Error")
            plt.legend()
            plt.grid(True)
            plt.tight_layout()
            fig = plt.gcf()
            return plot_to_base64(fig)

        except Exception as e:
            print(f"PSO convergence plot failed: {str(e)}")
            return None

    # ───────────────────────────────────────────────────────────
    # 2️⃣  PCA-SCATTER  (every PSO run shown)
    # ───────────────────────────────────────────────────────────
    def _plot_pca_analysis(self, results):
        """PCA scatter: colour=model, size=%error (all runs)."""
        try:
            rows = []
            for res in results:
                tgt = res["target_value"]
                for mdl, runs in res["comparison_table"].items():
                    for sol in runs:  # ← all runs
                        rows.append({
                            "Model": mdl,
                            "Target": tgt,
                            "Predicted": sol["prediction"],
                            "%Error": sol["error"],
                            **sol["solution"]  # feature columns
                        })

            if not rows:
                print("PCA plot skipped: empty.")
                return None

            df = pd.DataFrame(rows)
            metric_cols = {"Model", "Target", "Predicted", "%Error"}
            feat_cols = [c for c in df.columns if c not in metric_cols]
            if not feat_cols:
                print("PCA plot skipped: no numeric features.")
                return None

            # Determine number of PCA components based on available features
            n_features = len(feat_cols)
            n_samples = len(df)
            
            print(f"PCA Analysis: {n_samples} samples, {n_features} features")
            
            # PCA components cannot exceed min(n_samples, n_features)
            max_components = min(n_samples, n_features)
            n_components = min(2, max_components)
            
            if n_components < 1:
                print("PCA plot skipped: insufficient data for PCA analysis.")
                return None
            
            print(f"Using {n_components} PCA components")
            
            pca = PCA(n_components=n_components)
            pca_result = pca.fit_transform(df[feat_cols])
            
            if n_components == 1:
                # For 1D PCA, create a second dimension with zeros for visualization
                df["PCA1"] = pca_result[:, 0]
                df["PCA2"] = np.zeros(len(df))  # Add zeros for second dimension
                print("PCA analysis completed with 1D projection (adding zeros for PCA2)")
            else:
                df["PCA1"] = pca_result[:, 0]
                df["PCA2"] = pca_result[:, 1]
                print("PCA analysis completed with 2D projection")

            bins = [0, 5, 10, 20, 50, 100, np.inf]
            labels = ["0–5%", "5–10%", "10–20%", "20–50%", "50–100%", "≥100%"]
            size_map = dict(zip(labels, [50, 100, 150, 200, 250, 300]))
            df["ErrBin"] = pd.cut(df["%Error"] * 100, bins=bins, labels=labels)
            df["ErrSize"] = df["ErrBin"].map(size_map)

            plt.figure(figsize=(10, 6))
            sns.scatterplot(data=df, x="PCA1", y="PCA2",
                            hue="Model", size="ErrSize",
                            palette="tab10", sizes=(50, 300), alpha=.7, legend=False)

            # colour legend
            handles = [Line2D([0], [0], marker='o', linestyle='', markerfacecolor=c,
                              markeredgecolor='w', markersize=10, label=m)
                       for m, c in zip(df["Model"].unique(),
                                       sns.color_palette("tab10", n_colors=len(df["Model"].unique())))]
            l1 = plt.legend(handles=handles, title="Model", loc='upper right')
            plt.gca().add_artist(l1)

            # size legend
            for lab, sz in size_map.items():
                plt.scatter([], [], s=sz, c='gray', alpha=.6, label=lab)
            plt.legend(title="% Error", loc='lower right')

            plt.title("Optimised Solutions in PCA Space")
            plt.tight_layout()
            return plot_to_base64(plt.gcf())

        except Exception as e:
            print(f"PCA analysis plot failed: {e}")
            return None

    # ───────────────────────────────────────────────────────────
    # 3️⃣  R²  HEATMAP  (one value per model – first run is fine)
    # ───────────────────────────────────────────────────────────
    def _plot_r2_heatmap(self, results):
        """Heat-map of R² (one per model)."""
        try:
            heatmap_rows = []
            for res in results:
                tgt = res['target_value']
                for model_name, runs in res['comparison_table'].items():
                    heatmap_rows.append({
                        "Model": model_name,
                        "Target Value": tgt,
                        "R2": runs[0]['r2']  # identical across runs
                    })
            df = pd.DataFrame(heatmap_rows)
            pivot = df.pivot(index="Model", columns="Target Value", values="R2")

            plt.figure(figsize=(8, 5))
            sns.heatmap(pivot, annot=True, cmap="Blues", fmt=".2f",
                        vmin=df["R2"].min(), vmax=df["R2"].max(),
                        cbar_kws={'label': 'R²'})
            plt.title("Model R² vs Target Value")
            plt.tight_layout()
            return plot_to_base64(plt.gcf())

        except Exception as e:
            print(f"R² heatmap plot failed: {e}")
            return None

    # ───────────────────────────────────────────────────────────
    # 4️⃣  ERROR  BOX-PLOT  (all runs)
    # ───────────────────────────────────────────────────────────
    def _plot_error_distribution(self, results):
        """Box-plot of % error per model/target (all runs)."""
        try:
            rows = []
            for res in results:
                tgt = str(res['target_value'])
                for model_name, runs in res['comparison_table'].items():
                    for sol in runs:
                        rows.append({
                            "Model": model_name,
                            "Target Value": tgt,
                            "% Error": sol['error'] * 100
                        })

            if not rows:
                return None
            df = pd.DataFrame(rows)

            plt.figure(figsize=(12, 6))
            sns.boxplot(data=df, x="Model", y="% Error", hue="Target Value",
                        palette="viridis", showfliers=True)
            plt.axhline(0, ls='--', c='gray', alpha=.5)
            plt.title("% Error Distribution")
            plt.tight_layout()
            return plot_to_base64(plt.gcf())

        except Exception as e:
            print(f"Error-boxplot failed: {e}")
            return None

    # ───────────────────────────────────────────────────────────
    # 5️⃣  STRIP  (Predicted vs Target)  – one point *per run*
    # ───────────────────────────────────────────────────────────
    def _plot_predicted_vs_target_strip(self, results):
        try:
            rows = []
            for res in results:
                tgt = res['target_value']
                for model_name, runs in res['comparison_table'].items():
                    for sol in runs:
                        rows.append({
                            "Model": model_name,
                            "Target Value": tgt,
                            "Predicted": sol['prediction'],
                            "R2": sol['r2'],
                            "MSE": sol['mse'],
                            "ACC": sol['accuracy_like']
                        })
            df = pd.DataFrame(rows)

            # legend labels with mean metrics
            mean_metrics = df.groupby("Model")[["R2", "MSE", "ACC"]].mean()
            lbl_map = {m: f"{m} (R²={r['R2']:.2f}, MSE={r['MSE']:.2f}, ACC={r['ACC']:.2f})"
                       for m, r in mean_metrics.iterrows()}
            df["ModelLbl"] = df["Model"].map(lbl_map)

            plt.figure(figsize=(12, 6))
            sns.stripplot(data=df, x="Target Value", y="Predicted",
                          hue="ModelLbl", dodge=True, jitter=.2, alpha=.7)
            xs = sorted(df["Target Value"].unique())
            # plt.plot(xs, xs, 'k--', alpha=.3)
            plt.title("Predicted vs Target (all PSO runs)")
            plt.tight_layout()
            return plot_to_base64(plt.gcf())
        except Exception as e:
            print(f"Strip plot failed: {e}")
            return None

    # ───────────────────────────────────────────────────────────
    # 6️⃣  SCATTER  (Predicted vs Target)  – best run per model
    # ───────────────────────────────────────────────────────────
    def _plot_predicted_vs_target_scatter(self, results):
        try:
            rows = []
            for res in results:
                tgt = res['target_value']
                for model_name, runs in res['comparison_table'].items():
                    best = min(runs, key=lambda d: d['error'])  # one point per model
                    rows.append({
                        "Model": model_name,
                        "Target Value": tgt,
                        "Predicted": best['prediction'],
                        "R2": best['r2']
                    })
            df = pd.DataFrame(rows)
            mean_r2 = df.groupby("Model")["R2"].mean()
            lbl_map = {m: f"{m} (R²={r:.2f})" for m, r in mean_r2.items()}
            df["ModelLbl"] = df["Model"].map(lbl_map)

            plt.figure(figsize=(12, 6))
            sns.scatterplot(data=df, x="Target Value", y="Predicted",
                            hue="ModelLbl", style="ModelLbl", s=100, alpha=.8)

            mn = min(df["Target Value"].min(), df["Predicted"].min())
            mx = max(df["Target Value"].max(), df["Predicted"].max())
            # plt.plot([mn, mx], [mn, mx], 'k--', alpha=.3)
            plt.grid(True, alpha=.2)
            plt.title("Predicted vs Target (best PSO run per model)")
            plt.tight_layout()
            return plot_to_base64(plt.gcf())
        except Exception as e:
            print(f"Scatter plot failed: {e}")
            return None

    def optimize_for_targets(self, target_values):
        """Optimize for multiple target values with multiple runs per model"""
        results = []

        for target_value in target_values:
            # Run multiple PSO optimizations per model
            model_results = self._optimize_single_target(target_value, self.pso_config.get('n_solutions', 5))

            if not model_results:
                continue

            # Find the best solution (lowest error) across all models and runs
            best_model = None
            best_solution = None
            min_error = float('inf')

            for model_name, solutions in model_results.items():
                for sol in solutions:
                    if sol['error'] < min_error:
                        min_error = sol['error']
                        best_model = model_name
                        best_solution = sol

            # Store results in the same format for compatibility
            result = {
                'target_value': float(target_value),
                'best_model': best_model,
                'best_runtime': best_solution['runtime'],
                'best_fopt': best_solution['fopt'],
                'best_solution': {
                    'features': best_solution['solution'],
                    'prediction': best_solution['prediction'],
                    'target_value': float(target_value),
                    'error': best_solution['error'],
                    'runtime': best_solution['runtime'],
                    'mse': best_solution['mse'],
                    'r2': best_solution['r2'],
                    'accuracy_like': best_solution['accuracy_like'],
                    'y_pred_on_test': best_solution['y_pred_on_test']
                },
                'comparison_table': model_results,  # Each model maps to a list of solutions
            }

            results.append(result)

        # Generate all relevant graphs
        graphs = self._generate_graphs(results)

        return {  "results": results,"combined_graphs": graphs}
