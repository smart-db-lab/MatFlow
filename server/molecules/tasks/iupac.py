import time
from celery import shared_task

from molecules.utils.iupac import lookup_iupac


@shared_task(bind=True)
def process_smiles_batch(self, dataset, smiles_column, batch_size, delay):
    total = len(dataset)
    results = []

    for idx, row in enumerate(dataset, start=1):
        smiles = row.get(smiles_column)
        iupac = lookup_iupac(smiles)
        results.append({
            "smiles": smiles,
            "iupac": iupac
        })

        # update task state for polling
        self.update_state(
            state="PROGRESS",
            meta={
                "current": idx,
                "total": total,
                "current_smiles": smiles
            }
        )
        if delay:
            time.sleep(delay)

    return {
        "total": total,
        "results": results
    }
