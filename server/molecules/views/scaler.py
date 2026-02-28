from __future__ import annotations
import json, ast, math
from typing import Any, Dict, List

import numpy as np, pandas as pd
from rest_framework import status, parsers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from molecules.utils.scaler import ScalerEvaluator


def clean_float_values(obj):
    """
    Recursively clean float values that are not JSON compliant (NaN, inf, -inf)
    """
    if isinstance(obj, dict):
        return {key: clean_float_values(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [clean_float_values(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None  # or 0, or some default value
        return obj
    elif isinstance(obj, np.floating):
        val = float(obj)
        if math.isnan(val) or math.isinf(val):
            return None
        return val
    elif isinstance(obj, (np.integer, np.int_)):
        return int(obj)
    else:
        return obj


class ScalerEvaluationView(APIView):
    permission_classes = [AllowAny]
    """
    POST /api/scale-evaluate/           (Content-Type: application/json)

    {
      "dataset"        : [ {...}, {...}, ... ],        # required
      "target_column"  : "price",                      # required
      "feature_columns": ["f1","f2"] | "f1,f2" | ...   # optional
      "test_size"      : 0.25,                         # optional
      "random_state"   : 123,                          # optional
      "weights"        : {"r2":0.6,"mse":0.3,"skew":0.1} # optional

      "return_plot"    : true,   # include PNG dashboard
      "return_scaled"  : false,  # include scaled dataset CSV (b64)
      "return_csv"     : false   # include evaluation + ranking CSVs (b64)
    }
    """

    parser_classes = [parsers.JSONParser]  # 🚫 no multipart

    # ---------------- helpers -----------------
    @staticmethod
    def _bool(v: Any) -> bool:
        return str(v).lower() in {"1", "true", "yes", "y", "on"}

    @staticmethod
    def _parse_features(raw, df_cols, target) -> List[str] | str:
        """Return list or error-string."""
        if not raw:
            return [c for c in df_cols if c != target]

        if isinstance(raw, (list, tuple)):
            feats = list(raw)
        elif isinstance(raw, str):
            txt = raw.strip()
            # JSON list
            try:
                feats = json.loads(txt)
                if not isinstance(feats, list):
                    feats = [feats]
            except json.JSONDecodeError:
                # Python repr
                try:
                    feats = ast.literal_eval(txt)
                    if not isinstance(feats, list):
                        feats = [feats]
                except (SyntaxError, ValueError):
                    # comma string
                    feats = [tok.strip(" []'\"") for tok in txt.split(",") if tok.strip()]
        else:
            return "feature_columns format not recognised"

        missing = [c for c in feats if c not in df_cols]
        return feats if not missing else f"Columns not found: {', '.join(missing)}"

    # ---------------- POST --------------------
    def post(self, request, *_args, **_kw):
        body: Dict[str, Any] = request.data

        # dataset ----------------------------------------------------
        records = body.get("dataset")
        if not isinstance(records, list) or not records:
            return Response({"detail": "`dataset` must be a non-empty array."}, 400)
        df = pd.DataFrame.from_records(records)

        # target -----------------------------------------------------
        target = body.get("target_column")
        if target not in df.columns:
            return Response({"detail": "`target_column` not found."}, 400)

        # features ---------------------------------------------------
        feat_or_err = self._parse_features(body.get("feature_columns"), df.columns, target)
        if isinstance(feat_or_err, str):  # error
            return Response({"detail": feat_or_err}, 400)
        feats: List[str] = feat_or_err

        X = df[feats].select_dtypes(include=[np.number])
        if X.empty:
            return Response({"detail": "No numeric feature columns."}, 400)
        y = df[target]

        # parameters -------------------------------------------------
        test_size = float(body.get("test_size", 0.2))
        random_state = int(body.get("random_state", 42))

        w_map = body.get("weights", {"r2": .5, "mse": .3, "skew": .2})
        try:
            w_r2, w_mse, w_skew = float(w_map["r2"]), float(w_map["mse"]), float(w_map["skew"])
            total = w_r2 + w_mse + w_skew
            w_r2, w_mse, w_skew = w_r2 / total, w_mse / total, w_skew / total
        except Exception:
            return Response({"detail": "Bad `weights` mapping."}, 400)

        want_plot = self._bool(body.get("return_plot"))
        want_scaled = self._bool(body.get("return_scaled"))
        want_csv = self._bool(body.get("return_csv"))

        # evaluation -------------------------------------------------
        ev = ScalerEvaluator()
        grid_df = ev.evaluate(X, y, test_size=test_size, random_state=random_state)
        rank_df = ev.rank(grid_df, w_r2=w_r2, w_mse=w_mse, w_skew=w_skew)

        best = rank_df.iloc[0]["Scaler"]
        scaled_df, best_scaler = ev.transform_with_best(X, best)

        # Stitch back untouched columns
        untouched_cols = [c for c in df.columns if c not in X.columns]
        if untouched_cols:
            scaled_df = pd.concat([scaled_df, df[untouched_cols]], axis=1)

        # response ---------------------------------------------------
        resp = {
            "results": grid_df.to_dict("records"),
            "ranking": rank_df.to_dict("records"),
            "best_scaler": {"name": best, "pickle": ev.pickle_b64(best_scaler)},
            "scaled_preview": scaled_df.head(5).to_dict("records"),
        }
        if want_plot:
            resp.setdefault("plots", {})["overview_png"] = ev.overview_png(grid_df, rank_df)
            # Add individual chart images
            resp["plots"]["r2_chart_png"] = ev.r2_chart_png(grid_df)
            resp["plots"]["mse_chart_png"] = ev.mse_chart_png(grid_df)
            resp["plots"]["skew_chart_png"] = ev.skew_chart_png(grid_df)
            resp["plots"]["weighted_rank_chart_png"] = ev.weighted_rank_chart_png(rank_df)
        if want_scaled:
            resp["scaled_dataset_base64"] = ev.csv_b64(scaled_df)
        if want_csv:
            resp["evaluation_csv_base64"] = ev.csv_b64(grid_df)
            resp["ranking_csv_base64"] = ev.csv_b64(rank_df)

        # Clean the response data to handle NaN/inf values
        resp = clean_float_values(resp)

        return Response(resp, 200)