from typing import Any, Dict, List, Optional
import sys
import os
import importlib.util

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rdkit import Chem

# Load sascorer module directly from file
sascorer_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    'scscore', 'utils', 'SA_Score', 'sascorer.py'
)
spec = importlib.util.spec_from_file_location("sascorer", sascorer_path)
sascorer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sascorer)

# Load SCScorer standalone numpy model
SC_SCORER_AVAILABLE = False
sc_scorer = None
try:
    scscore_root = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        'scscore'
    )
    standalone_path = os.path.join(scscore_root, 'standalone_model_numpy.py')
    if os.path.exists(standalone_path):
        spec_sc = importlib.util.spec_from_file_location("standalone_model_numpy", standalone_path)
        standalone_module = importlib.util.module_from_spec(spec_sc)
        spec_sc.loader.exec_module(standalone_module)
        SCScorer = standalone_module.SCScorer
        sc_scorer = SCScorer()
        weight_path = os.path.join(
            scscore_root, 'models', 'full_reaxys_model_1024bool',
            'model.ckpt-10654.as_numpy.json.gz'
        )
        sc_scorer.restore(weight_path=weight_path)
        SC_SCORER_AVAILABLE = True
except Exception as e:
    print(f"Warning: SCScorer not available: {e}")
    SC_SCORER_AVAILABLE = False
    sc_scorer = None


class SmilesSAScoreView(APIView):
    permission_classes = [AllowAny]
    """
    POST JSON:
    {
      "dataset": [ {"id": 1, "smiles": "CCO"}, {"id": 2, "smiles": "O=C(O)C"} ],
      "smiles_column": "smiles",
      "score_key": "sa_score",   # or "scs_score"
      "round_to": 3,
      "drop_invalid": false
    }
    """

    @method_decorator(csrf_exempt)
    def post(self, request, *args, **kwargs):
        data = request.data or {}
        dataset: Optional[List[Dict[str, Any]]] = data.get("dataset")
        smiles_column: Optional[str] = data.get("smiles_column")

        score_key: str = data.get("score_key", "sa_score")
        round_to: Optional[int] = data.get("round_to", 3)
        drop_invalid: bool = bool(data.get("drop_invalid", False))

        # --- basic validation ---
        if not isinstance(dataset, list):
            return Response(
                {"detail": "`dataset` must be a list of objects."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not smiles_column or not isinstance(smiles_column, str):
            return Response(
                {"detail": "`smiles_column` must be a non-empty string."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if score_key not in ["sa_score", "scs_score"]:
            return Response(
                {"detail": "`score_key` must be either 'sa_score' or 'scs_score'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if scs_score is requested but not available
        if score_key == "scs_score" and not SC_SCORER_AVAILABLE:
            return Response(
                {"detail": "SCScorer model is not available. Please use 'sa_score' instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results: List[Dict[str, Any]] = []
        n_total = len(dataset)
        n_ok = 0
        n_invalid = 0

        for row in dataset:
            if not isinstance(row, dict):
                n_invalid += 1
                if not drop_invalid:
                    results.append({
                        "_raw": row,
                        score_key: None,
                        "error": "Row is not an object/dict."
                    })
                continue

            smi = row.get(smiles_column, None)
            if not isinstance(smi, str) or not smi.strip():
                n_invalid += 1
                if not drop_invalid:
                    out = dict(row)
                    out[score_key] = None
                    out["error"] = f"Missing or empty `{smiles_column}`."
                    results.append(out)
                continue

            try:
                mol = Chem.MolFromSmiles(smi)
                if mol is None:
                    raise ValueError("RDKit failed to parse SMILES")

                # Compute based on score_key
                if score_key == "sa_score":
                    score_val = float(sascorer.calculateScore(mol))
                else:  # scs_score
                    _, score_val = sc_scorer.get_score_from_smi(smi)
                    try:
                        score_val = float(score_val)
                    except Exception:
                        pass

                if isinstance(round_to, int):
                    score_val = round(score_val, round_to)

                out = dict(row)
                out[score_key] = score_val
                results.append(out)
                n_ok += 1

            except Exception as e:
                n_invalid += 1
                if not drop_invalid:
                    out = dict(row)
                    out[score_key] = None
                    out["error"] = f"Invalid SMILES: {e}"
                    results.append(out)

        summary = {
            "total": n_total,
            "processed": n_ok,
            "invalid": n_invalid,
            "kept_invalid": (not drop_invalid),
        }

        return Response(
            {"summary": summary, "results": results},
            status=status.HTTP_200_OK
        )
