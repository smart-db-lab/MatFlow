import pandas as pd
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from molecules.utils.organic import add_or_verify_category


@api_view(["POST"])
@permission_classes([AllowAny])
def organic_check_view(request):
    try:
        df_data = request.data.get("df")
        smiles_col = request.data.get("smiles_col")
        category_col = request.data.get("category_col", "category")
        overwrite = request.data.get("overwrite", False)

        if not df_data or not smiles_col:
            return JsonResponse({"error": "Missing required parameters."}, status=400)

        df = pd.DataFrame(df_data)

        # Perform classification
        df_checked = add_or_verify_category(df, smiles_col, category_col, overwrite)

        # Summary statistics
        category_counts = df_checked[category_col].value_counts().to_dict()
        mismatch_count = int(df_checked["cat_mismatch"].sum())
        mismatches = df_checked[df_checked["cat_mismatch"]].head().to_dict(orient="records")

        return JsonResponse({
            "df": df_checked.to_dict(orient="records"),
            "category_counts": category_counts,
            "mismatch_count": mismatch_count,
            "mismatch_preview": mismatches,
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
