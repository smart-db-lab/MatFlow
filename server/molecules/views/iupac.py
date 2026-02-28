from time import sleep
from celery.result import AsyncResult
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from molecules.utils.iupac import lookup_iupac
from ..tasks.iupac import process_smiles_batch

class SmilesIupacConvertView(APIView):
    permission_classes = [AllowAny]
    """
    POST /api/smiles-iupac/convert/
    Body → {
      "mode": "single"|"batch",
      # single:
      "smiles": "CCO",
      # batch:
      "dataset": [ {...}, {...}, ... ],
      "smiles_column": "SMILES",
      "config": {
        "batch_size": 50,
        "delay_between_requests": 0.2
      }
    }
    """

    def post(self, request):
        data = request.data
        mode = data.get("mode")
        config = data.get("config", {})
        delay = config.get("delay_between_requests", 0)

        if mode == "single":
            smiles = data.get("smiles")
            if not smiles:
                return Response(
                    {"detail": "Field 'smiles' is required for single mode."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # optional delay
            if delay:
                sleep(delay)
            return Response({
                "smiles": smiles,
                "iupac": lookup_iupac(smiles)
            })

        elif mode == "batch":
            dataset = data.get("dataset")
            smiles_column = data.get("smiles_column")
            if not isinstance(dataset, list) or not dataset:
                return Response(
                    {"detail": "Field 'dataset' must be a non-empty list for batch mode."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not smiles_column:
                return Response(
                    {"detail": "Field 'smiles_column' is required for batch mode."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            batch_size = config.get("batch_size", len(dataset))
            # enqueue Celery task
            task = process_smiles_batch.apply_async(
                args=[dataset, smiles_column, batch_size, delay],
                expires=60
            )
            return Response(
                {"task_id": task.id},
                status=status.HTTP_202_ACCEPTED
            )

        else:
            return Response(
                {"detail": "Invalid mode. Must be 'single' or 'batch'."},
                status=status.HTTP_400_BAD_REQUEST
            )


class SmilesIupacStatusView(APIView):
    permission_classes = [AllowAny]
    """
    GET /api/smiles-iupac/status/{task_id}/
    """

    def get(self, request, task_id):
        result = AsyncResult(task_id)
        resp = {"status": result.status}

        if result.status == "PENDING":
            # no extra info yet
            pass

        elif result.status == "PROGRESS":
            # meta contains current/total/current_smiles
            meta = result.info or {}
            resp.update({
                "current": meta.get("current"),
                "total": meta.get("total"),
                "current_smiles": meta.get("current_smiles"),
            })

        elif result.status == "SUCCESS":
            # the return value of the task
            info = result.result or {}
            resp.update({
                "current": info.get("total"),
                "total": info.get("total"),
                "results": info.get("results"),
            })

        elif result.status == "FAILURE":
            resp.update({"error": str(result.result)})

        return Response(resp)
