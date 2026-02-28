# ───────────── server/views.py (additions) ─────────────
from celery.result import AsyncResult
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from ..tasks.generate import smiles_generation_task
from molecules.utils.generate import generate_smiles


class SmilesGenerationView(APIView):
    permission_classes = [AllowAny]
    """
    POST /api/smiles-generation/generate/
    If you prefer async, send `?async=true` and you’ll get back a task_id.
    """
    def post(self, request, *args, **kwargs):
        payload = request.data
        async_flag = request.query_params.get("async") == "true"

        if async_flag:
            task = smiles_generation_task.delay(payload)
            return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)

        # Fallback: run synchronously (small datasets, tests)
        try:
            results = generate_smiles(**payload)
            return Response({"results": results}, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class SmilesGenerationStatusView(APIView):
    permission_classes = [AllowAny]
    """
    GET /api/smiles-generation/status/<task_id>/
    Response:
    {
      "status": "PENDING|STARTED|SUCCESS|FAILURE",
      "results": { ... } | null,
      "error": "..." | null
    }
    """
    
    def get(self, request, task_id, *args, **kwargs):
        try:
            async_res = AsyncResult(task_id)
            payload = {
                "status": async_res.status,   # Celery states
                "results": None,
                "error": None,
            }

            if async_res.successful():
                result = async_res.result or {}
                if result.get("status") == "FAILURE":
                    # Task returned error info instead of raising
                    payload["status"] = "FAILURE"
                    payload["error"] = result.get("error", "Task failed")
                else:
                    payload["results"] = result.get("results", {})
            elif async_res.failed():
                # If we raised inside the task, Celery keeps the exception object in .result
                meta = getattr(async_res, "result", None)
                if isinstance(meta, dict):
                    payload["error"] = meta.get("error", "Task failed")
                else:
                    # Handle exception serialization gracefully
                    payload["error"] = str(meta) if meta else "Task failed with unknown error"

            return Response(payload, status=status.HTTP_200_OK)
        
        except Exception as e:
            # Handle any errors in checking task status
            return Response({
                "status": "FAILURE",
                "results": None,
                "error": f"Failed to get task status: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
