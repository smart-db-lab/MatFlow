from time import sleep
from celery.result import AsyncResult
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import HttpResponse, FileResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
import os
import tempfile
import zipfile
from pathlib import Path

from ..tasks.structure import process_smiles_structure_batch
from ..utils.structure import smiles_to_png


def _normalize_image_size(raw_size, default=300):
    try:
        size = int(raw_size)
    except (TypeError, ValueError):
        size = default
    if size <= 0:
        size = default
    return size


class SmilesStructureZipDownloadView(APIView):
    permission_classes = [AllowAny]
    """
    GET /api/smiles-structure/download-zip/{task_id}/
    Creates and returns a ZIP archive containing all generated molecular structure images
    """
    def get(self, request, task_id):
        # Check if task exists and completed
        res = AsyncResult(task_id)
        if res.status != "SUCCESS":
            return Response(
                {"detail": f"Task not found or still in progress. Status: {res.status}"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Get the directory where images are stored
        task_folder = os.path.join("structures", task_id)
        media_root = default_storage.location
        source_dir = os.path.join(media_root, task_folder)
        
        # Check if directory exists
        if not os.path.exists(source_dir):
            return Response(
                {"detail": f"No images found for task ID: {task_id}"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create a temporary file for the zip
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_file:
            zip_path = temp_file.name
        
        # Create the ZIP archive
        try:
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, _, files in os.walk(source_dir):
                    for file in files:
                        # Skip any PDF files (we only want images)
                        if file.lower().endswith('.pdf'):
                            continue
                        
                        file_path = os.path.join(root, file)
                        # Add file to the ZIP with a path relative to the source directory
                        arcname = os.path.relpath(file_path, source_dir)
                        zipf.write(file_path, arcname=arcname)
        
            # Return the ZIP file as a response
            response = FileResponse(
                open(zip_path, 'rb'),
                content_type='application/zip',
                as_attachment=True,
                filename=f'molecular-structures-{task_id}.zip'
            )
            
            # Clean up after response is sent
            response._file_to_close = open(zip_path, 'rb')  # Will be closed when response is finished
            return response
            
        except Exception as e:
            # Clean up if there's an error
            if os.path.exists(zip_path):
                os.unlink(zip_path)
            return Response(
                {"detail": f"Error creating ZIP archive: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SmilesStructureGenerateView(APIView):
    permission_classes = [AllowAny]
    """
    POST /api/smiles-structure/generate/
    Handles both single and batch image generation.
    """
    def post(self, request):
        data   = request.data
        mode   = data.get("mode")
        config = data.get("config", {})

        img_size    = _normalize_image_size(config.get("image_size", 300))
        img_format  = config.get("image_format", "png").lower()

        if mode == "single":
            smiles = data.get("smiles")
            if not smiles:
                return Response(
                    {"detail": "Field 'smiles' is required for single mode."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            img = smiles_to_png(smiles, (img_size, img_size))
            if not img:
                return Response(
                    {"detail": "Could not render structure."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return HttpResponse(
                img,
                content_type=f"image/{img_format}",
                headers={"Content-Disposition": f'inline; filename="{smiles}.{img_format}"'}
            )

        elif mode == "batch":
            dataset       = data.get("dataset")
            smiles_column = data.get("smiles_column")
            max_imgs      = config.get("max_images", len(dataset))
            if not isinstance(dataset, list) or not dataset:
                return Response(
                    {"detail": "'dataset' must be a non-empty list."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not smiles_column:
                return Response(
                    {"detail": "'smiles_column' is required for batch mode."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # kick off Celery task
            task = process_smiles_structure_batch.apply_async(
                args=[dataset, smiles_column, img_size, img_format, max_imgs]
            )
            return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)

        else:
            return Response(
                {"detail": "Invalid mode; must be 'single' or 'batch'."},
                status=status.HTTP_400_BAD_REQUEST
            )

class SmilesStructureStatusView(APIView):
    permission_classes = [AllowAny]
    """
    GET /api/smiles-structure/status/{task_id}/
    Poll Celery for batch progress and results.
    """
    def get(self, request, task_id):
        res = AsyncResult(task_id)
        resp = {"status": res.status}

        if res.status == "PENDING":
            pass
        elif res.status == "PROGRESS":
            meta = res.info or {}
            resp.update({
                "current":       meta.get("current"),
                "total":         meta.get("total"),
                "current_smiles": meta.get("current_smiles"),
            })
        elif res.status == "SUCCESS":
            info = res.result or {}
            resp.update({
                "current":       info["summary"]["total"],
                "total":         info["summary"]["total"],
                "results":       info["download_links"],
                "preview_images": info["preview_images"],
            })
        elif res.status == "FAILURE":
            resp["error"] = str(res.result)

        return Response(resp)
