import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .ollama_client import ollama_chat
from .gemini_client import gemini_chat
from .llm_tools import TOOLS

SYSTEM_PROMPT = """
You are a data science assistant.

Available tools:
- set_dataset
- show_head
- show_columns
- correlation
- split
- train
- model_evaluation
- reset_session
 - dm_get_structure
 - dm_create_folder
 - dm_rename_item
 - dm_delete_item
 - dm_create_file
 - dm_read_file
 - dm_load_any_dataset
 - mt_display_group
 - mt_display_correlation
 - mt_display_correlation_featurePair
 - mt_display_correlation_heatmap
 - mt_feature_selection
 - mt_imputation_data1
 - mt_imputation_data2
 - mt_imputation_result
 - mt_merge_dataset
 - mt_encoding
 - mt_scaling
 - mt_drop_column
 - mt_drop_row
 - mt_append
 - mt_cluster
 - mt_split
 - mt_build_model
 - mt_hyper_opti
 - mt_model_evaluation_api
 - mt_model_prediction
 - mt_time_series
 - mt_time_series_analysis
 - mt_reverse_ml
 - mt_deploy_data
 - mt_deploy_result
 - mt_pso_optimize
 - mt_display_correlation_featurePair
 - mt_feature_creation
 - mt_change_dtype
 - mt_alter_field
 - mt_download_model

If a tool is required, respond ONLY with valid JSON :
{
  "tool": "<tool_name>",
  "arguments": { 
        "dataset": "diamonds",
        "n": 10
  }
}
If no tool is required, respond with a text answer only.
"""


class ChatbotView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        msg = request.data.get("message")
        if not msg:
            return Response({"error": "message required"}, status=400)

        prompt = SYSTEM_PROMPT + "\nUSER:\n" + msg
        content = ollama_chat(prompt).strip()

        # clean code block
        if content.startswith("```"):
            content = content.strip("`").replace("json", "").strip()

        try:
            parsed = json.loads(content)
            if "tool" in parsed:
                tool = parsed["tool"]
                args = parsed.get("arguments", {})
                # Normalize synonyms so tools always get canonical keys
                if isinstance(args, dict):
                    # dataset name
                    if "dataset" not in args:
                        for alt in ("dataset_name", "name"):
                            if alt in args:
                                args["dataset"] = args.get(alt)
                                break
                    for alt in ("dataset_name", "name"):
                        if alt in args:
                            args.pop(alt, None)

                    # row count
                    if "n" not in args and ("n_rows" in args or "rows" in args):
                        args["n"] = args.get("n_rows", args.get("rows"))
                    for alt in ("n_rows", "rows"):
                        if alt in args:
                            args.pop(alt, None)

                    # target variable
                    if "target_var" not in args and "target" in args:
                        args["target_var"] = args.get("target")
                    if "target" in args:
                        args.pop("target", None)
                if tool not in TOOLS:
                    return Response({"error": "Unknown tool"})
                # print("Invoking tool:", tool, "with args:", args)
                result = TOOLS[tool](request, args)
                print("Tool result:", result)
                return Response({"type": "tool_result", "tool": tool, "result": result})
        except Exception as e:
            print("Error invoking tool:", e)
            return Response({"error": "Invalid JSON response from LLM", "detail": str(e)}, status=500)
