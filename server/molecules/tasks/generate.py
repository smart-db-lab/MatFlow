# ───────────── server/tasks.py (new file) ─────────────
from __future__ import annotations
from celery import shared_task

from molecules.utils.generate import generate_smiles


@shared_task(bind=True)
def smiles_generation_task(self, payload: dict) -> dict:
    """
    Kick-off heavy SMILES generation in the background.
    `payload` is exactly what came from the POST body.
    """
    try:
        results = generate_smiles(**payload)
        return {"results": results}          # shown when state == SUCCESS
    except Exception as exc:
        # store the traceback/message inside Celery so the polling API can expose it
        error_msg = str(exc)
        self.update_state(
            state="FAILURE", 
            meta={
                "error": error_msg,
                "exc_type": type(exc).__name__,
                "status": "FAILURE"
            }
        )
        # Return error info instead of raising to prevent serialization issues
        return {
            "error": error_msg,
            "exc_type": type(exc).__name__,
            "status": "FAILURE"
        }
