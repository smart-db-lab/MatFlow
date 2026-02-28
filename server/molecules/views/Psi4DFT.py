from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from molecules.utils.Psi4DFT import enrich_dataset


class Psi4DFTView(APIView):
    permission_classes = [AllowAny]
    """
    POST /api/dft/
    Body JSON:
    {
      "dataset": [ { "Generated_SMILES": "CCO", "SynthScore_0to1": 0.92 }, ... ],
      "smiles_column": "Generated_SMILES",
      "top_k": 50
    }
    
    Note: Molecules are sorted by SynthScore_0to1 (descending) or sa_score (ascending) 
    if available, then top_k molecules are selected for DFT calculation.
    """

    def post(self, request):
        data = request.data

        dataset = data.get("dataset")
        smiles_col = data.get("smiles_column", "Generated_SMILES")
        top_k = data.get("top_k", 50)

        if not dataset or not isinstance(dataset, list):
            return Response(
                {"detail": "dataset must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            results, processed_count, errors = enrich_dataset(dataset, smiles_col, top_k)
            return Response(
                {
                    "processed_count": processed_count,
                    "errors": errors,
                    "results": results,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as ex:
            return Response({"detail": str(ex)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
