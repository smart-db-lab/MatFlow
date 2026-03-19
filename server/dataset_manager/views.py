import os
import shutil
import pandas as pd
from django.conf import settings
from django.http import JsonResponse, HttpResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import json
from Matflow.debug_utilities import *

# Base datasets directory; each project gets its own subfolder under this root.
BASE_DATASET_DIR = getattr(settings, "MATFLOW_DATASET_ROOT", None) or os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "dataset",
)

# Backwards-compatible alias used by other modules (e.g. chatbot.llm_tools).
# Keep pointing to the same base directory so existing imports continue to work.
DATASET_DIR = BASE_DATASET_DIR
SUPPORTED_EXTENSIONS = {
    '.csv': 'CSV',
    '.xlsx': 'Excel',
    '.xls': 'Excel'
}

def get_project_dataset_dir(request, project_id_override=None):
    """
    Resolve the dataset directory for a given project.
    Requires project_id from query, form, or project_id_override (e.g. from JSON body).
    """
    project_id = project_id_override or request.GET.get("project_id") or request.POST.get("project_id")
    if not project_id:
        return None, JsonResponse({"error": "project_id is required"}, status=400)

    safe_id = str(project_id).strip()
    if ".." in safe_id or "/" in safe_id or "\\" in safe_id:
        return None, JsonResponse({"error": "Invalid project_id"}, status=400)

    dataset_dir = os.path.join(BASE_DATASET_DIR, safe_id)
    os.makedirs(dataset_dir, exist_ok=True)
    return dataset_dir, None


@csrf_exempt
def rename_item(request):
    """
    API endpoint to rename a file or folder.
    Expects 'currentName', 'newName', and 'parentFolder' in the request body.
    Workspace-scoped rename only (no legacy project-root fallback).
    """
    if request.method == 'POST':
        try:
            # Parse request body
            body = json.loads(request.body)
            current_name = body.get('currentName')
            new_name = body.get('newName')
            parent_folder = body.get('parentFolder', '')
            project_id = body.get('project_id')
            workspace_id = body.get('workspace_id')

            if not current_name or not str(current_name).strip():
                return JsonResponse({"error": "currentName is required."}, status=400)
            if not new_name or not str(new_name).strip():
                return JsonResponse({"error": "newName is required."}, status=400)

            current_name = str(current_name).strip()
            new_name = str(new_name).strip()

            workspace_obj, raw_sub_path, error_response = _resolve_workspace_for_request(
                project_id=project_id,
                folder=parent_folder,
                workspace_id=workspace_id,
            )
            # If parentFolder is empty, this can still be a valid workspace-root rename
            # (currentName == workspace name shown in the sidebar).
            if error_response and not str(parent_folder or "").strip() and not workspace_id:
                workspace_obj, raw_sub_path, error_response = _resolve_workspace_for_request(
                    project_id=project_id,
                    folder=current_name,
                    workspace_id=workspace_id,
                )
            if error_response:
                return error_response

            normalized_parent = _normalize_workspace_sub_path(raw_sub_path)
            parent_path = os.path.join(
                workspace_obj.base_dir,
                normalized_parent,
            ) if normalized_parent else workspace_obj.base_dir

            # Virtual workspace-root rename in sidebar: rename DB name only.
            if not normalized_parent and current_name == workspace_obj.name:
                workspace_obj.name = new_name
                workspace_obj.save(update_fields=["name", "updated_at"])
                return JsonResponse(
                    {"message": f"Workspace renamed to '{new_name}' successfully!"},
                    status=200,
                )

            current_item_sub_path = (
                f"{normalized_parent}/{current_name}" if normalized_parent else current_name
            )
            normalized_current_item_sub_path = _normalize_workspace_sub_path(
                current_item_sub_path
            )
            if _is_reserved_workspace_folder_path(normalized_current_item_sub_path):
                return JsonResponse(
                    {
                        "error": (
                            "System folders cannot be renamed: original_dataset, output, charts, "
                            "generated_datasets, models, train_test."
                        )
                    },
                    status=400,
                )

            current_path = os.path.join(parent_path, current_name)
            new_path = os.path.join(parent_path, new_name)
            if not os.path.exists(current_path):
                return JsonResponse({"error": "Item to rename not found."}, status=404)

            os.rename(current_path, new_path)
            return JsonResponse({"message": f"Renamed '{current_name}' to '{new_name}' successfully!"}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return HttpResponse(status=405)  # Method not allowed


def get_nested_directory_structure(root_path):
    """
    Recursively traverse the directory to create a nested JSON structure.
    """
    structure = {}
    for item in os.listdir(root_path):
        item_path = os.path.join(root_path, item)
        if os.path.isdir(item_path):
            structure[item] = get_nested_directory_structure(item_path)  # Recursive call for subfolders
        else:
            # For files, append the file names to the structure
            if 'files' not in structure:
                structure['files'] = []
            structure['files'].append(item)
    return structure


def _get_workspace_structure_for_project(project_id):
    """
    Build a nested directory structure from the new workspace system.

    Maps workspace name → disk contents of workspace.base_dir so each workspace
    appears as a top-level folder in the sidebar with sub-folders:
      original_dataset/   <- the uploaded file
      output/generated_datasets/
      output/train_test/
      output/charts/
      output/models/
    """
    from projects.models import Workspace
    workspaces_root = {}
    try:
        workspaces = Workspace.objects.filter(project_id=project_id).select_related('project')
    except Exception:
        return workspaces_root

    for ws in workspaces:
        if not os.path.exists(ws.base_dir):
            continue
        ws_structure = get_nested_directory_structure(ws.base_dir)
        workspaces_root[ws.name] = ws_structure

    return workspaces_root


def _resolve_workspace_file_path(project_id, folder, filename):
    """
    Resolve a file path that lives inside a workspace.

    The directory listing uses workspace.name as the top-level folder key, but
    the file actually lives under workspace.base_dir on disk.

    folder examples:
      "<ws_name>/original_dataset"
      "<ws_name>/output/generated_datasets"

    Returns the absolute file path if a matching workspace is found, else None.
    """
    return _resolve_workspace_file_path_for_context(
        project_id=project_id,
        folder=folder,
        filename=filename,
        workspace_id=None,
    )


READ_LOGICAL_FOLDER_MAP = {
    "original_dataset": "original_dataset",
    "train_test": "output/train_test",
    "output/train_test": "output/train_test",
    "generated_datasets": "output/generated_datasets",
    "output/generated_datasets": "output/generated_datasets",
    "charts": "output/charts",
    "output/charts": "output/charts",
    "models": "output/models",
    "output/models": "output/models",
}


def _logical_folder_from_relative_path(relative_path):
    normalized = _normalize_path(relative_path).lower()
    if normalized.startswith("original_dataset/") or normalized == "original_dataset":
        return "original_dataset"
    if normalized.startswith("output/train_test/") or normalized == "output/train_test":
        return "train_test"
    if normalized.startswith("output/generated_datasets/") or normalized == "output/generated_datasets":
        return "generated_datasets"
    if normalized.startswith("output/charts/") or normalized == "output/charts":
        return "charts"
    if normalized.startswith("output/models/") or normalized == "output/models":
        return "models"
    return "original_dataset"


def _resolve_workspace_file_path_for_context(project_id, folder, filename, workspace_id=None):
    """
    Resolve a workspace file path for reads.

    Supports both:
      1) explicit workspace_id + logical folder (preferred)
      2) workspace-prefixed folder path (legacy)

    Returns absolute file path if file exists, else None.
    """
    from projects.models import Workspace

    if not project_id or not filename:
        return None

    normalized_folder = _normalize_path(folder)
    target_ws = None
    sub_path = ""

    if workspace_id:
        try:
            target_ws = Workspace.objects.get(pk=workspace_id, project_id=project_id)
        except Workspace.DoesNotExist:
            return None

        # Allow folder to be logical ("train_test") or workspace-prefixed.
        if normalized_folder == target_ws.name:
            normalized_folder = ""
        elif normalized_folder.startswith(f"{target_ws.name}/"):
            normalized_folder = normalized_folder[len(target_ws.name) + 1 :]

        logical_or_alias = _normalize_workspace_sub_path(normalized_folder)
        sub_path = READ_LOGICAL_FOLDER_MAP.get(logical_or_alias, logical_or_alias)
        if not sub_path:
            sub_path = "original_dataset"
    else:
        # Legacy workspace-prefixed folder resolution.
        if not normalized_folder:
            return None
        parts = normalized_folder.split("/", 1)  # ["<ws_name>", "rest/of/path"]
        ws_name = parts[0]
        raw_sub_path = parts[1] if len(parts) > 1 else ""
        try:
            target_ws = Workspace.objects.get(project_id=project_id, name=ws_name)
        except Exception:
            return None
        logical_or_alias = _normalize_workspace_sub_path(raw_sub_path)
        sub_path = READ_LOGICAL_FOLDER_MAP.get(logical_or_alias, logical_or_alias)
        if not sub_path:
            sub_path = "original_dataset"

    candidate = os.path.abspath(os.path.join(target_ws.base_dir, sub_path, filename))
    ws_base = os.path.abspath(target_ws.base_dir)
    if os.path.commonpath([ws_base, candidate]) != ws_base:
        return None
    return candidate if os.path.isfile(candidate) else None


WORKSPACE_OUTPUT_ALIAS_MAP = {
    "charts": "output/charts",
    "output/charts": "output/charts",
    "output/chart": "output/charts",
    "train_test": "output/train_test",
    "output/train_test": "output/train_test",
    "generated_datasets": "output/generated_datasets",
    "output/generated_datasets": "output/generated_datasets",
    "models": "output/models",
    "output/models": "output/models",
    "output/csv": "output/generated_datasets",
    "output/actual_vs_predicted_datasets": "output/generated_datasets",
}


def _normalize_path(path_value):
    return str(path_value or "").replace("\\", "/").strip("/")


RESERVED_WORKSPACE_FOLDERS = {
    "original_dataset",
    "output",
    "output/charts",
    "output/generated_datasets",
    "output/models",
    "output/train_test",
}


def _is_reserved_workspace_folder_path(path_value):
    normalized = _normalize_path(path_value).lower()
    return normalized in RESERVED_WORKSPACE_FOLDERS


def _resolve_workspace_for_request(project_id, folder="", workspace_id=None):
    from projects.models import Workspace

    if not project_id:
        return None, "", JsonResponse(
            {"error": "project_id is required for workspace-scoped writes."},
            status=400,
        )

    normalized_folder = _normalize_path(folder)

    if workspace_id:
        try:
            ws = Workspace.objects.get(pk=workspace_id, project_id=project_id)
        except Workspace.DoesNotExist:
            return None, "", JsonResponse(
                {"error": "Invalid workspace_id for the given project."},
                status=400,
            )
        if normalized_folder == ws.name:
            return ws, "", None
        if normalized_folder.startswith(f"{ws.name}/"):
            return ws, normalized_folder[len(ws.name) + 1 :], None
        return ws, normalized_folder, None

    if not normalized_folder:
        return None, "", JsonResponse(
            {
                "error": (
                    "Workspace context missing. Provide workspace_id or a "
                    "workspace-prefixed folder path."
                )
            },
            status=400,
        )

    ws_name, *rest = normalized_folder.split("/", 1)
    sub_path = rest[0] if rest else ""
    workspaces = Workspace.objects.filter(project_id=project_id, name=ws_name)
    if not workspaces.exists():
        return None, "", JsonResponse(
            {"error": f"Workspace '{ws_name}' not found for project."},
            status=400,
        )
    if workspaces.count() > 1:
        return None, "", JsonResponse(
            {
                "error": (
                    f"Workspace name '{ws_name}' is ambiguous. "
                    "Use workspace_id instead."
                )
            },
            status=400,
        )
    return workspaces.first(), sub_path, None


def _normalize_workspace_sub_path(sub_path):
    normalized = _normalize_path(sub_path).lower()
    if not normalized:
        return ""
    if normalized in WORKSPACE_OUTPUT_ALIAS_MAP:
        return WORKSPACE_OUTPUT_ALIAS_MAP[normalized]
    return normalized


def _resolve_workspace_write_target(
    project_id,
    folder,
    filename=None,
    workspace_id=None,
    require_output_path=False,
):
    ws, raw_sub_path, error_response = _resolve_workspace_for_request(
        project_id=project_id,
        folder=folder,
        workspace_id=workspace_id,
    )
    if error_response:
        return None, error_response

    sub_path = _normalize_workspace_sub_path(raw_sub_path)
    if not sub_path:
        return None, JsonResponse(
            {"error": "Target folder is required for workspace writes."},
            status=400,
        )

    if require_output_path and not sub_path.startswith("output/"):
        return None, JsonResponse(
            {
                "error": (
                    "Artifact writes must target workspace output folders: "
                    "output/charts, output/train_test, output/generated_datasets, output/models."
                )
            },
            status=400,
        )

    target = os.path.join(ws.base_dir, sub_path, filename) if filename else os.path.join(
        ws.base_dir,
        sub_path,
    )
    target_abs = os.path.abspath(target)
    ws_abs = os.path.abspath(ws.base_dir)
    if os.path.commonpath([ws_abs, target_abs]) != ws_abs:
        return None, JsonResponse({"error": "Invalid workspace target path."}, status=400)

    return target_abs, None


def get_dataset_structure(request):
    """
    View that returns the nested folder and file structure within the dataset directory.
    Optional file content can be read by providing 'folder' and 'file' query parameters.
    """
    dataset_dir, error_response = get_project_dataset_dir(request)
    if error_response:
        return error_response

    # Get folder and file from the query parameters
    folder = request.GET.get('folder')
    if folder == '/':
        folder = ""
    file = request.GET.get('file')

    # If folder and file are provided, read the file content
    if folder or file:
        project_id = request.GET.get("project_id")
        workspace_id = request.GET.get("workspace_id")

        # First try resolving through the workspace system
        file_path = None
        if project_id:
            file_path = _resolve_workspace_file_path_for_context(
                project_id=project_id,
                folder=folder,
                filename=file,
                workspace_id=workspace_id,
            )

        # Fall back to the legacy dataset directory
        if not file_path:
            file_path = os.path.join(dataset_dir, folder or "", file)

        # Check if the file exists at the constructed path
        if os.path.isfile(file_path):
            try:
                # Read the file based on the extension
                file_extension = os.path.splitext(file_path)[1].lower()
                if file_extension == '.csv':
                    df = pd.read_csv(file_path)  # Read CSV file
                elif file_extension in ['.xlsx', '.xls']:
                    df = pd.read_excel(file_path)  # Read Excel file
                else:
                    return HttpResponse("Unsupported file type", status=400)

                # Return the content as a JSON response
                return JsonResponse(df.to_dict(orient='records'), safe=False)
            except Exception as e:
                # Return error message if there was an issue reading the file
                return HttpResponse(f"Error reading file: {e}", status=500)
        else:
            # Return 404 if the file is not found
            return HttpResponse("File not found", status=404)

    # If no specific file is requested, return the nested directory structure
    nested_structure = get_nested_directory_structure(dataset_dir)

    # Merge in the new workspace-based structure (if any)
    project_id = request.GET.get("project_id")
    if project_id:
        ws_structure = _get_workspace_structure_for_project(project_id)
        # Merge workspace folders directly at the root level (no extra "workspaces" key)
        nested_structure.update(ws_structure)

    # Return the directory structure as a JSON response
    return JsonResponse(nested_structure, safe=False)


@csrf_exempt
def create_folder(request):
    import json
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"error": "Invalid JSON body"}, status=400)
    project_id = data.get('project_id')
    workspace_id = data.get('workspace_id')

    folder_name = str(data.get('folderName') or '').strip()
    parent = str(data.get('parent') or '').strip('/\\')

    if not folder_name:
        return JsonResponse({"error": "Folder name is required"}, status=400)

    # Basic path safety validation.
    if '..' in folder_name or '/' in folder_name or '\\' in folder_name:
        return JsonResponse({"error": "Invalid folder name"}, status=400)
    if '..' in parent:
        return JsonResponse({"error": "Invalid parent folder"}, status=400)

    workspace_obj, raw_sub_path, error_response = _resolve_workspace_for_request(
        project_id=project_id,
        folder=parent,
        workspace_id=workspace_id,
    )
    if error_response:
        return error_response
    normalized_parent_sub_path = _normalize_workspace_sub_path(raw_sub_path)
    parent_path = os.path.join(
        workspace_obj.base_dir,
        normalized_parent_sub_path,
    ) if normalized_parent_sub_path else workspace_obj.base_dir

    os.makedirs(parent_path, exist_ok=True)

    # Create folder using Windows-style suffixing on conflicts:
    # test, test(1), test(2), ...
    suffix = 0
    created_name = folder_name
    while True:
        candidate = folder_name if suffix == 0 else f"{folder_name}({suffix})"
        candidate_path = os.path.join(parent_path, candidate)
        try:
            os.makedirs(candidate_path, exist_ok=False)
            created_name = candidate
            break
        except FileExistsError:
            suffix += 1

    return JsonResponse(
        {
            "message": "Folder created successfully!",
            "folder_name": created_name,
            "renamed": created_name != folder_name,
        },
        status=201,
    )


@csrf_exempt
def upload_file(request):
    """
    Securely upload a file to a specific folder, bypassing default_storage restrictions.
    """
    project_id = request.POST.get('project_id')
    workspace_id = request.POST.get('workspace_id')
    folder = request.POST.get('folder', '').strip('/')  # Remove leading/trailing slashes
    file = request.FILES.get('file')

    if file:
        try:
            file_path, error_response = _resolve_workspace_write_target(
                project_id=project_id,
                folder=folder,
                filename=file.name,
                workspace_id=workspace_id,
                require_output_path=False,
            )
            if error_response:
                return error_response
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            # Write the file to the target location
            with open(file_path, 'wb') as destination:
                for chunk in file.chunks():  # Handle large files efficiently
                    destination.write(chunk)

            return JsonResponse({"message": "File uploaded successfully!", "file_path": file_path}, status=201)
        except Exception as e:
            return JsonResponse({"error": f"Error uploading file: {str(e)}"}, status=500)

    return JsonResponse({"error": "No file uploaded"}, status=400)
@csrf_exempt
def delete_item(request):
    """
    View to handle deletion of files and folders.
    Accepts 'folder' and optional 'file' as query parameters.
    Workspace-scoped delete only (no legacy project-root fallback).
    """
    if request.method == 'DELETE':
        project_id = request.GET.get('project_id')
        workspace_id = request.GET.get('workspace_id')
        # Extract the folder and file parameters from the URL
        folder = request.GET.get('folder', '')
        file = request.GET.get('file')

        try:
            workspace_obj, raw_sub_path, error_response = _resolve_workspace_for_request(
                project_id=project_id,
                folder=folder,
                workspace_id=workspace_id,
            )
            if error_response:
                return error_response
            normalized_sub_path = _normalize_workspace_sub_path(raw_sub_path)

            if file:
                ws_path = os.path.join(
                    workspace_obj.base_dir,
                    normalized_sub_path,
                    file,
                ) if normalized_sub_path else os.path.join(
                    workspace_obj.base_dir,
                    file,
                )
                if os.path.isfile(ws_path):
                    os.remove(ws_path)
                    return JsonResponse({"message": "File deleted successfully!"}, status=200)
                return JsonResponse({"error": "File not found"}, status=404)
            else:
                if _is_reserved_workspace_folder_path(normalized_sub_path):
                    return JsonResponse(
                        {
                            "error": (
                                "System folders cannot be deleted: original_dataset, output, charts, "
                                "generated_datasets, models, train_test."
                            )
                        },
                        status=400,
                    )
                ws_path = os.path.join(
                    workspace_obj.base_dir,
                    normalized_sub_path,
                ) if normalized_sub_path else workspace_obj.base_dir
                is_ws_root = not normalized_sub_path
                if ws_path and os.path.isdir(ws_path):
                    shutil.rmtree(ws_path)
                    if is_ws_root:
                        workspace_obj.delete()
                    return JsonResponse({"message": "Folder and its contents deleted successfully!"}, status=200)
                return JsonResponse({"error": "Folder not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return HttpResponse(status=405)  # Method not allowed


@csrf_exempt
def move_item(request):
    """
    Move a file or folder inside the same workspace.
    Expects JSON body:
      - project_id (required)
      - sourcePath (required): workspace-prefixed path of file/folder to move
      - destinationFolder (required): workspace-prefixed destination folder
      - workspace_id (optional)
    """
    if request.method != "POST":
        return HttpResponse(status=405)

    try:
        try:
            body = json.loads(request.body)
        except (json.JSONDecodeError, TypeError):
            return JsonResponse({"error": "Invalid JSON body"}, status=400)

        project_id = body.get("project_id")
        workspace_id = body.get("workspace_id")
        source_path = _normalize_path(body.get("sourcePath"))
        destination_folder = _normalize_path(body.get("destinationFolder"))

        if not source_path:
            return JsonResponse({"error": "sourcePath is required."}, status=400)
        if not destination_folder:
            return JsonResponse(
                {"error": "destinationFolder is required."},
                status=400,
            )

        source_ws, source_raw_sub_path, source_error = _resolve_workspace_for_request(
            project_id=project_id,
            folder=source_path,
            workspace_id=workspace_id,
        )
        if source_error:
            return source_error

        destination_ws, destination_raw_sub_path, destination_error = _resolve_workspace_for_request(
            project_id=project_id,
            folder=destination_folder,
            workspace_id=workspace_id,
        )
        if destination_error:
            return destination_error

        if source_ws.id != destination_ws.id:
            return JsonResponse(
                {"error": "Cross-workspace move is not allowed."},
                status=400,
            )

        source_sub_path = _normalize_workspace_sub_path(source_raw_sub_path)
        destination_sub_path = _normalize_workspace_sub_path(destination_raw_sub_path)

        if not source_sub_path:
            return JsonResponse(
                {"error": "Workspace root cannot be moved."},
                status=400,
            )

        workspace_base = os.path.abspath(source_ws.base_dir)
        source_abs_path = os.path.abspath(
            os.path.join(source_ws.base_dir, source_sub_path),
        )
        destination_abs_dir = os.path.abspath(
            os.path.join(source_ws.base_dir, destination_sub_path),
        ) if destination_sub_path else workspace_base

        if (
            os.path.commonpath([workspace_base, source_abs_path]) != workspace_base
            or os.path.commonpath([workspace_base, destination_abs_dir]) != workspace_base
        ):
            return JsonResponse({"error": "Invalid move path."}, status=400)

        if not os.path.exists(source_abs_path):
            return JsonResponse({"error": "Source item not found."}, status=404)
        if not os.path.isdir(destination_abs_dir):
            return JsonResponse({"error": "Destination folder not found."}, status=404)

        item_name = os.path.basename(source_abs_path)
        target_abs_path = os.path.abspath(os.path.join(destination_abs_dir, item_name))
        if os.path.exists(target_abs_path):
            return JsonResponse(
                {"error": f"'{item_name}' already exists in destination."},
                status=400,
            )

        if source_abs_path == target_abs_path:
            return JsonResponse({"message": "Item already in destination."}, status=200)

        if os.path.isdir(source_abs_path):
            # Prevent moving a folder into itself (or its descendants).
            if os.path.commonpath([source_abs_path, destination_abs_dir]) == source_abs_path:
                return JsonResponse(
                    {"error": "Cannot move a folder into itself."},
                    status=400,
                )

        shutil.move(source_abs_path, target_abs_path)
        return JsonResponse(
            {"message": f"Moved '{item_name}' successfully."},
            status=200,
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def create_file(request):
    """
    API endpoint to create a new file with provided data and save it in the backend.
    Expects 'data', 'filename', 'foldername', and 'project_id' in the request body.
    Assumes 'data' is always an array of objects (list of dictionaries).
    Supports saving data only in CSV or Excel format.
    """
    if request.method == 'POST':
        try:
            try:
                body = json.loads(request.body)
            except (json.JSONDecodeError, TypeError):
                return JsonResponse({"error": "Invalid JSON body"}, status=400)
            project_id = body.get('project_id')
            workspace_id = body.get('workspace_id')

            data = body.get('data')
            filename = body.get('filename')
            foldername = body.get('foldername', '')  # Default to root dataset directory if foldername is empty
            print(filename, foldername)

            # Validate the input
            if not filename:
                return JsonResponse({"error": "Filename is required."}, status=400)

            # Determine the extension and validate data type accordingly
            file_extension = os.path.splitext(filename)[1]  # Get file extension from filename
            if file_extension.lower() not in ['.csv', '.xlsx']:  # Support only CSV and Excel
                return JsonResponse({"error": f"Unsupported file extension: {file_extension}. Use .csv or .xlsx only."}, status=400)

            # Convert the provided data (assumed to be list of dictionaries) to a DataFrame
            try:
                df = pd.DataFrame(data)
            except ValueError as e:
                return JsonResponse({"error": f"Data is not compatible with CSV/Excel format: {str(e)}"}, status=400)

            file_path, error_response = _resolve_workspace_write_target(
                project_id=project_id,
                folder=foldername,
                filename=filename,
                workspace_id=workspace_id,
                require_output_path=False,
            )
            if error_response:
                return error_response
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            # Save data according to the file type
            if file_extension.lower() == '.csv':
                df.to_csv(file_path, index=False)
            elif file_extension.lower() == '.xlsx':
                df.to_excel(file_path, index=False)

            return JsonResponse({"message": f"File '{filename}' created successfully in '{foldername}'!"}, status=201)
        except Exception as e:
            print(e)
            return JsonResponse({"error": str(e)}, status=500)

    return HttpResponse(status=405)  # Method not allowed


def _resolve_workspace_write_path(project_id, folder, filename, workspace_id=None):
    """
    Like _resolve_workspace_file_path but returns the target path even if the file
    does not yet exist on disk.  Used for write (overwrite / create) operations.
    Returns the absolute path if a matching workspace is found, else None.
    """
    file_path, _ = _resolve_workspace_write_target(
        project_id=project_id,
        folder=folder,
        filename=filename,
        workspace_id=workspace_id,
        require_output_path=False,
    )
    return file_path


@csrf_exempt
def update_file(request):
    """
    API endpoint to overwrite an existing file with new data.
    Resolves workspace paths first, falls back to legacy project dataset directory.
    Expects 'data', 'filename', 'foldername', and 'project_id' in the request body.
    """
    if request.method == 'POST':
        try:
            try:
                body = json.loads(request.body)
            except (json.JSONDecodeError, TypeError):
                return JsonResponse({"error": "Invalid JSON body"}, status=400)

            project_id = body.get('project_id')
            workspace_id = body.get('workspace_id')
            data = body.get('data')
            filename = body.get('filename')
            foldername = body.get('foldername', '')

            if not filename:
                return JsonResponse({"error": "Filename is required."}, status=400)

            file_extension = os.path.splitext(filename)[1]
            if file_extension.lower() not in ['.csv', '.xlsx']:
                return JsonResponse(
                    {"error": f"Unsupported file extension: {file_extension}. Use .csv or .xlsx only."},
                    status=400
                )

            try:
                df = pd.DataFrame(data)
            except ValueError as e:
                return JsonResponse({"error": f"Data is not compatible with CSV/Excel format: {str(e)}"}, status=400)

            file_path, error_response = _resolve_workspace_write_target(
                project_id=project_id,
                folder=foldername,
                filename=filename,
                workspace_id=workspace_id,
                require_output_path=False,
            )
            if error_response:
                return error_response
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            if file_extension.lower() == '.csv':
                df.to_csv(file_path, index=False)
            elif file_extension.lower() == '.xlsx':
                df.to_excel(file_path, index=False)

            return JsonResponse({"message": f"File '{filename}' updated successfully!"}, status=200)

        except Exception as e:
            print(e)
            return JsonResponse({"error": str(e)}, status=500)

    return HttpResponse(status=405)  # Method not allowed


def validate_request_parameters(request):
    """Validate the request parameters and return folder, file, and any error."""
    debug("Validating request parameters")

    folder = request.GET.get('folder', '')
    debug(f"Folder parameter: '{folder}'")

    file = request.GET.get('file')
    debug(f"File parameter: '{file}'")

    # Check if file parameter is provided
    if not file:
        error_msg = "File name is required."
        error(error_msg)
        return None, None, JsonResponse({"error": error_msg}, status=400)

    # Check for potential directory traversal attacks
    if '..' in folder or '..' in file:
        error_msg = "Invalid folder or file path."
        error(error_msg)
        return None, None, JsonResponse({"error": error_msg}, status=400)

    debug("Request parameters are valid")
    return folder, file, None


def _resolve_read_file_path(request, project_id, folder, file_name):
    """Resolve read target path with workspace-first deterministic behavior."""
    workspace_id = request.GET.get("workspace_id") or request.POST.get("workspace_id")

    if workspace_id:
        debug(
            f"[read_file] Deterministic workspace read: project_id={project_id}, "
            f"workspace_id={workspace_id}, folder='{folder}', file='{file_name}'",
        )
        ws_path = _resolve_workspace_file_path_for_context(
            project_id=project_id,
            folder=folder,
            filename=file_name,
            workspace_id=workspace_id,
        )
        if not ws_path:
            normalized_folder = _normalize_path(folder or "") or "original_dataset"
            return None, JsonResponse(
                {
                    "error": (
                        f"File '{file_name}' not found in workspace '{workspace_id}' "
                        f"folder '{normalized_folder}'."
                    )
                },
                status=404,
            )
        debug(f"[read_file] Resolved workspace path: {ws_path}")
        return ws_path, None

    # Legacy behavior (project dataset + workspace-prefixed folder)
    dataset_dir, error_response = get_project_dataset_dir(
        request,
        project_id_override=project_id,
    )
    if error_response:
        return None, error_response

    legacy_path = os.path.join(dataset_dir, folder or "", file_name)
    if os.path.isfile(legacy_path):
        debug(f"[read_file] Resolved legacy dataset path: {legacy_path}")
        return legacy_path, None

    ws_path = _resolve_workspace_file_path_for_context(
        project_id=project_id,
        folder=folder,
        filename=file_name,
        workspace_id=None,
    )
    if ws_path:
        debug(f"[read_file] Resolved legacy workspace-prefixed path: {ws_path}")
        return ws_path, None

    return None, JsonResponse(
        {"error": f"File '{file_name}' not found in folder '{folder}'."},
        status=404,
    )


def get_validated_file_path(folder, file):
    """Construct and validate the full file path."""
    debug(f"Constructing file path for folder: '{folder}', file: '{file}'")

    # NOTE: This helper is only used by read_file; file_path will be recomputed
    # there using the per-project dataset directory. This fallback remains for safety.
    file_path = os.path.join(BASE_DATASET_DIR, folder, file)
    debug(f"Full file path: '{file_path}'")

    # Check if the file exists
    if not os.path.isfile(file_path):
        error_msg = f"File '{file}' not found in folder '{folder}'."
        error(error_msg)
        return None, JsonResponse({"error": error_msg}, status=404)

    # Check if file is within the DATASET_DIR (security check)
    if not os.path.abspath(file_path).startswith(os.path.abspath(DATASET_DIR)):
        error_msg = "Access to file is forbidden."
        error(error_msg)
        return None, JsonResponse({"error": error_msg}, status=403)

    debug(f"File path is valid: '{file_path}'")
    return file_path, None


@csrf_exempt
@debug_function
def read_file(request):
    """
    View to read the content of a specific file.
    Accepts 'folder' and 'file' query parameters to identify the file.

    Optional pagination params:
      - page       (int, 1-based): if provided, returns only that page's rows
      - page_size  (int):          number of rows per page (default 200)
      - meta_only  (bool):         if "1", return only metadata (no data rows)

    When paginated, response is:
      { data: [...], total_rows: N, columns: [...], page: P, page_size: PS }
    When not paginated, returns full row array (backwards compatible).
    """
    info("read_file function called")
    debug_obj(request, "Request")

    # Get and validate parameters
    folder, file, validation_error = validate_request_parameters(request)
    if validation_error:
        return validation_error

    project_id = request.GET.get("project_id") or request.POST.get("project_id")
    if not project_id:
        return JsonResponse({"error": "project_id is required"}, status=400)

    file_path, resolve_error = _resolve_read_file_path(
        request,
        project_id,
        folder,
        file,
    )
    if resolve_error:
        return resolve_error

    # Check for pagination params
    page_param = request.GET.get('page')
    page_size_param = request.GET.get('page_size')
    meta_only = request.GET.get('meta_only') == '1'

    if page_param is not None or meta_only:
        try:
            page = max(1, int(page_param or 1))
            page_size = max(1, min(int(page_size_param or 200), 2000))
        except (ValueError, TypeError):
            return JsonResponse({"error": "Invalid page or page_size parameter."}, status=400)
        return read_and_process_file_paginated(file_path, page, page_size, meta_only)

    # No pagination — return full file (backwards compatible)
    response = read_and_process_file(file_path)

    info(f"File '{file}' in folder '{folder}' processed successfully")
    return response


def read_and_process_file_paginated(file_path, page, page_size, meta_only=False):
    """Return a single page of rows plus total_rows + columns metadata."""
    try:
        file_extension = os.path.splitext(file_path)[1].lower()
        if file_extension not in SUPPORTED_EXTENSIONS:
            return JsonResponse({"error": f"Unsupported file type '{file_extension}'."}, status=400)

        df = read_file_as_dataframe(file_path, file_extension)
        total_rows = len(df)
        columns = df.columns.tolist()

        if meta_only:
            dtype_map = {}
            for col, dtype in df.dtypes.items():
                if pd.api.types.is_bool_dtype(dtype):
                    dtype_map[col] = "boolean"
                elif pd.api.types.is_numeric_dtype(dtype):
                    dtype_map[col] = "number"
                else:
                    dtype_map[col] = "string"

            return JsonResponse({
                "total_rows": total_rows,
                "columns": columns,
                "dtypes": dtype_map,
                "page": 1,
                "page_size": page_size,
            })

        start = (page - 1) * page_size
        end = start + page_size
        page_df = df.iloc[start:end]

        # Replace NaN/inf with None for clean JSON
        page_df = page_df.where(pd.notnull(page_df), None)

        return JsonResponse({
            "data": page_df.to_dict(orient='records'),
            "total_rows": total_rows,
            "columns": columns,
            "page": page,
            "page_size": page_size,
        })
    except Exception as e:
        return JsonResponse({"error": f"Error reading file: {str(e)}"}, status=500)


def read_and_process_file(file_path):
    """Read and process the file based on its extension."""
    try:
        # Determine file type based on extension
        file_extension = os.path.splitext(file_path)[1].lower()
        debug(f"File extension: '{file_extension}'")

        # Check if file type is supported
        if file_extension not in SUPPORTED_EXTENSIONS:
            error_msg = f"Unsupported file type '{file_extension}'. Supported types are: {', '.join(SUPPORTED_EXTENSIONS.keys())}"
            error(error_msg)
            return JsonResponse({"error": error_msg}, status=400)

        # Read file based on extension
        debug(f"Reading file as {SUPPORTED_EXTENSIONS[file_extension]} format")
        df = read_file_as_dataframe(file_path, file_extension)

        # Log dataframe information
        debug(f"DataFrame shape: {df.shape}")
        debug(f"DataFrame columns: {df.columns.tolist()}")
        debug(f"DataFrame memory usage: {df.memory_usage(deep=True).sum() / (1024 * 1024):.2f} MB")

        # Replace NaN/inf with None for clean JSON serialization
        df = df.where(pd.notnull(df), None)

        # Convert to dictionary for JSON response
        debug("Converting DataFrame to dictionary")
        result = df.to_dict(orient='records')
        debug(f"Result has {len(result)} records")

        return JsonResponse(result, safe=False)

    except Exception as e:
        error_msg = f"Error reading file: {str(e)}"
        error(error_msg)
        debug_obj(e, "Exception")
        import traceback
        error(traceback.format_exc())
        return JsonResponse({"error": error_msg}, status=500)


def read_file_as_dataframe(file_path, extension):
    """Read a file as a pandas DataFrame based on its extension."""
    debug(f"Reading file '{file_path}' with extension '{extension}'")

    try:
        if extension == '.csv':
            # Additional CSV parameters can be added as needed
            debug("Attempting to read CSV file")
            return pd.read_csv(file_path)
        elif extension in ['.xlsx', '.xls']:
            debug("Attempting to read Excel file")
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {extension}")
    except pd.errors.EmptyDataError:
        debug("File is empty")
        return pd.DataFrame()  # Return an empty dataframe instead of failing
    except pd.errors.ParserError as e:
        debug(f"Parser error: {str(e)}")
        raise  # Re-raise the exception for the caller to handle
    except Exception as e:
        debug(f"Unexpected error reading file: {str(e)}")
        raise  # Re-raise the exception for the caller to handle



@csrf_exempt
def fetch_file_as_attachment(request):
    """
    API endpoint to fetch a file as an attachment.
    Accepts 'file_path' as a query parameter.
    """
    print("Endpoint accessed")  # Add debugging here

    project_id = request.GET.get("project_id") or request.POST.get("project_id")
    workspace_id = request.GET.get("workspace_id") or request.POST.get("workspace_id")
    folder = request.GET.get("folder") or request.POST.get("folder")
    file_name = request.GET.get("file") or request.POST.get("file")
    file_path = request.GET.get('file_path')  # Legacy full path

    full_file_path = None

    # Preferred: workspace-aware resolution via folder + file + project_id
    if project_id and folder and file_name:
        full_file_path = _resolve_workspace_file_path_for_context(
            project_id=project_id,
            folder=folder,
            filename=file_name,
            workspace_id=workspace_id,
        )
        if not full_file_path:
            # Fallback: non-workspace project file path (backward compatibility)
            dataset_dir, error_response = get_project_dataset_dir(
                request,
                project_id_override=project_id,
            )
            if error_response:
                return error_response
            candidate = os.path.join(dataset_dir, folder.strip('/'), file_name)
            if os.path.isfile(candidate):
                full_file_path = candidate

    # Legacy: /api/fetch-file/?file_path=...
    if not full_file_path and file_path:
        dataset_dir, error_response = get_project_dataset_dir(request)
        if error_response:
            return error_response
        candidate = os.path.join(dataset_dir, file_path.strip('/'))
        if os.path.isfile(candidate):
            full_file_path = candidate

    if not full_file_path or not os.path.isfile(full_file_path):
        return JsonResponse({"error": "Requested file not found."}, status=404)

    try:
        # Return the file as a response
        return FileResponse(open(full_file_path, 'rb'), as_attachment=True, filename=os.path.basename(full_file_path))
    except Exception as e:
        return JsonResponse({"error": f"Error fetching file: {str(e)}"}, status=500)


@csrf_exempt
def list_workspace_files(request):
    """
    Return canonical file metadata for a workspace.

    Response shape:
      {
        "files": [
          {
            "workspace_id": "...",
            "workspace_name": "...",
            "project_id": "...",
            "file": "train_x.csv",
            "relative_path": "output/train_test/train_x.csv",
            "logical_folder": "train_test"
          }
        ]
      }
    """
    from projects.models import Workspace

    project_id = request.GET.get("project_id") or request.POST.get("project_id")
    workspace_id = request.GET.get("workspace_id") or request.POST.get("workspace_id")
    if not project_id or not workspace_id:
        return JsonResponse(
            {"error": "project_id and workspace_id are required."},
            status=400,
        )

    try:
        ws = Workspace.objects.get(pk=workspace_id, project_id=project_id)
    except Workspace.DoesNotExist:
        return JsonResponse(
            {"error": "Invalid workspace_id for project."},
            status=400,
        )

    files = []
    for root, _, filenames in os.walk(ws.base_dir):
        for name in filenames:
            absolute_path = os.path.join(root, name)
            relative_path = os.path.relpath(absolute_path, ws.base_dir).replace("\\", "/")
            files.append(
                {
                    "workspace_id": str(ws.id),
                    "workspace_name": ws.name,
                    "project_id": str(ws.project_id),
                    "file": name,
                    "relative_path": relative_path,
                    "logical_folder": _logical_folder_from_relative_path(relative_path),
                }
            )

    return JsonResponse({"files": files}, status=200)





import pandas as pd
import os
import tempfile

def convert_to_csv_helper(input_file, output_file=None):
    """
    Helper function to convert a file to CSV format.
    """
    if output_file is None:
        base = os.path.splitext(input_file)[0]
        output_file = base + ".csv"

    ext = os.path.splitext(input_file)[1].lower()

    if ext in [".xls", ".xlsx"]:
        df = pd.read_excel(input_file)

    elif ext == ".parquet":
        df = pd.read_parquet(input_file)

    elif ext in [".txt", ".log"]:
        df = pd.read_csv(input_file, sep="\n", header=None)
        df.columns = ["text"]

    elif ext == ".csv":
        df = pd.read_csv(input_file)

    else:
        raise ValueError(f"Unsupported file type: {ext}")

    # Save to CSV
    df.to_csv(output_file, index=False)
    print(f"Converted successfully → {output_file}")
    
    return df

@csrf_exempt
def convert_to_csv(request):
    """
    Django view to handle file conversion to CSV.
    Accepts a file via POST request and returns the converted CSV data as JSON.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    try:
        # Get the uploaded file
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return JsonResponse({"error": "No file provided"}, status=400)
        
        # Create a temporary file to save the uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.name)[1]) as temp_input:
            # Write uploaded file to temporary location
            for chunk in uploaded_file.chunks():
                temp_input.write(chunk)
            temp_input_path = temp_input.name
        
        try:
            # Convert the file using the helper function
            df = convert_to_csv_helper(temp_input_path)
            
            # Convert DataFrame to list of dictionaries for JSON response
            result = df.to_dict(orient='records')
            
            # Clean up temporary file
            os.unlink(temp_input_path)
            
            return JsonResponse(result, safe=False)
            
        except Exception as e:
            # Clean up temporary file on error
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
            raise e
            
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Error converting file: {str(e)}"}, status=500)




import numpy as np
import pandas as pd
import os
from django.urls import reverse

def clean_df(df):
    # Replace invalid values
    df = df.replace([np.inf, -np.inf], np.nan)

    # Convert NaN → None
    df = df.where(pd.notnull(df), None)

    safe_df = {}

    for col in df.columns:
        safe_series = []

        for v in df[col]:
            # None stays None
            if v is None:
                safe_series.append(None)
                continue

            # Primitive JSON-safe types
            if isinstance(v, (int, float, str, bool)):
                # Fix large floats
                if isinstance(v, float) and (v > 1e308 or v < -1e308):
                    safe_series.append(str(v))
                else:
                    safe_series.append(v)
                continue

            # Convert lists, dicts, numpy arrays → JSON-safe string
            safe_series.append(str(v))

        safe_df[col] = safe_series

    return pd.DataFrame(safe_df)

def make_preview_json_safe(df, rows=50):
    """
    Return preview in perfect tabular list-of-dicts format.
    All values converted to strings safely.
    """
    preview = df.head(rows).copy()

    # Convert all values to string
    preview = preview.astype(str)

    # Replace problematic values
    preview = preview.replace({
        "nan": None,
        "NaN": None,
        "None": None,
        "inf": None,
        "-inf": None
    })

    # Row-wise list of dicts
    return preview.to_dict(orient="records")



from chatbot.universal_dataset_finder import universal_dataset_search , get_source_download_url
from chatbot.universal_dataset_loader import load_dataset_from_search
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response



# ------------------------ DATASET ROOT ------------------------

DATASET_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset")
os.makedirs(DATASET_ROOT, exist_ok=True)


def get_dataset_folder(name):
    """
    Make a safe folder name under dataset/.
    """
    safe = (
        name.lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "_")
        .replace("\\", "_")
    )

    folder = os.path.join(DATASET_ROOT, safe)
    os.makedirs(folder, exist_ok=True)

    return safe,folder

@api_view(['POST'])
@permission_classes([AllowAny])
def load_any_dataset(request):
    name = request.data.get("dataset")
    if not name:
        return Response({"error": "dataset field is required"}, status=400)

    # Search globally (ChatGPT-like)
    hit = universal_dataset_search(name)
    if not hit:
        return Response({"error": f"Dataset '{name}' not found anywhere."}, status=404)

    # Create dataset/<folder>
    safe_name, folder = get_dataset_folder(name)
    csv_path = os.path.join(folder, f"{safe_name}.csv")

    # If already cached → load from CSV
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
    else:
        try:
            df = load_dataset_from_search(hit)
            df.to_csv(csv_path, index=False, encoding="utf-8")
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    # Clean and preview
    df_clean = clean_df(df)
    preview = make_preview_json_safe(df_clean)

    # Local download link
    local_download = request.build_absolute_uri(
        reverse("fetch_file") + f"?file_path={safe_name}/{safe_name}.csv"
    )

    # Source (Kaggle / HF / OpenML / URL)
    source_download = get_source_download_url(hit)

    # Final response
    return Response({
        "dataset": safe_name,
        "source": hit["source"],
        "id": hit["id"],
        "columns": list(df_clean.columns),
        "rows": len(df_clean),
        "preview": preview,
        "local_download": local_download,
        "source_download": source_download,
        "folder_path": f"dataset/{safe_name}/"
    })
