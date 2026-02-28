import os
from celery import shared_task
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from molecules.utils.structure import smiles_to_png


@shared_task(bind=True)
def process_smiles_structure_batch(
    self,
    dataset: list[dict],
    smiles_column: str,
    image_size: int,
    image_format: str,
    max_images: int
):
    total = len(dataset)
    download_links = {}
    preview_images = []

    # ensure a per-task folder
    task_folder = os.path.join("structures", self.request.id)

    for idx, row in enumerate(dataset, start=1):
        smiles = row.get(smiles_column)
        img_bytes = smiles_to_png(smiles)
        if img_bytes:
            filename = f"{task_folder}/{idx}.{image_format}"
            default_storage.save(filename, ContentFile(img_bytes))
            url = default_storage.url(filename)
        else:
            url = None

        download_links[smiles] = url
        if len(preview_images) < max_images:
            preview_images.append(url)

        # update progress
        self.update_state(
            state="PROGRESS",
            meta={
                "current": idx,
                "total": total,
                "current_smiles": smiles
            }
        )

    return {
        "summary": {"total": total},
        "preview_images": preview_images,
        "download_links": download_links
    }
