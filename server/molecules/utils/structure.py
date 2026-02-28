"""
Pure helpers for turning a SMILES string into PNG bytes.
No Django imports here — keeps things test-friendly.
"""
from __future__ import annotations

import io
import requests
from typing import Optional

# ── Try local RDKit first (faster + offline) ───────────────────────────────────
try:
    from rdkit import Chem
    from rdkit.Chem import Draw

    _HAS_RDKIT = True
except ImportError:          # RDKit not installed
    _HAS_RDKIT = False

# ── PubChem PNG fallback template ──────────────────────────────────────────────
_PUBCHEM_PNG = (
    "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/{smiles}/PNG"
)


def smiles_to_png(smiles: str, size: tuple[int, int] = (300, 300)) -> Optional[bytes]:
    """
    Returns PNG bytes representing the 2-D molecule.
    • If RDKit is available, use it.
    • Otherwise fall back to PubChem's PNG service.
    • Returns None on failure.
    """
    # RDKit route
    if _HAS_RDKIT:
        try:
            mol = Chem.MolFromSmiles(smiles, sanitize=True)
            if mol is not None:
                img = Draw.MolToImage(mol, size=size)
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                return buf.getvalue()
        except Exception as exc:
            # RDKit failed — will fall back to PubChem
            print(f"[RDKit] structure render failed for {smiles!r}: {exc}")

    # PubChem route
    try:
        resp = requests.get(_PUBCHEM_PNG.format(smiles=smiles), timeout=10)
        if resp.ok and resp.content:
            return resp.content
    except requests.RequestException as exc:
        print(f"[PubChem PNG] request failed for {smiles!r}: {exc}")

    # Everything failed
    return None
