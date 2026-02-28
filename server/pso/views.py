# api/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from celery.result import AsyncResult
import pandas as pd
import numpy as np
import json
import math

from .tasks import run_optimization_task


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


@api_view(['POST'])
@permission_classes([AllowAny])
def optimize(request):
    """
    This endpoint enqueues the long-running PSO optimization in a Celery task,
    and returns a task_id immediately.
    """
    try:
        request_data = request.data
        # Queue the Celery task
        task = run_optimization_task.delay(request_data)
        # Return the task ID so the client can poll the status
        return Response({"task_id": task.id}, status=202)

    except KeyError as e:
        return Response({"error": f"Missing key in request data: {str(e)}"}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_optimization_status(request, task_id):
    """
    Checks the status of the Celery task by ID.
    If finished, returns the result (the dictionary from the task).
    """
    async_result = AsyncResult(task_id)
    if async_result.state == 'PENDING':
        return Response({"status": "PENDING"}, status=200)
    elif async_result.state == 'PROGRESS':
        return Response({"status": "IN PROGRESS"}, status=200)
    elif async_result.state == 'SUCCESS':
        # Task completed, get the results
        payload = async_result.get()
        all_results = payload.get("results", [])
        comb_graphs = payload.get("combined_graphs")
        
        # Clean the data to remove NaN/inf values that can't be JSON serialized
        all_results = clean_float_values(all_results)
        comb_graphs = clean_float_values(comb_graphs)
        
        response = {
            "status": "SUCCESS",
            "results": all_results,
            "combined_graphs": comb_graphs,  # <- expose to React
            "error": payload.get("error")
        }


        best_solutions_list = []
        if all_results:  # ensure it's not None or empty
            for result_item in all_results:
                row = {
                    'target_value': result_item['target_value'],
                    'best_model': result_item['best_model'],
                    'best_runtime': result_item['best_runtime'],
                    'best_fopt': result_item['best_fopt'],
                    'prediction': result_item['best_solution']['prediction'],
                    'error': result_item['best_solution']['error'],
                }
                row.update(result_item['best_solution']['features'])
                best_solutions_list.append(row)

            best_solutions_df = pd.DataFrame(best_solutions_list)
            best_solutions_records = best_solutions_df.to_dict(orient='records')
            
            # Clean the best solutions data as well
            best_solutions_records = clean_float_values(best_solutions_records)

            # If you want best_solutions whenever there's at least one result:
            if len(all_results) > 1:
                response["best_solutions"] = best_solutions_records

        return Response(response, status=200)

    elif async_result.state == 'FAILURE':
        return Response({"status": "FAILURE", "error": str(async_result.result)}, status=400)
    else:
        # Other states: STARTED, RETRY, etc.
        return Response({"status": async_result.state}, status=200)
