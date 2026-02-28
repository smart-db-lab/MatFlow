"""
Utility helpers for SMILES → IUPAC conversion.
Pure-Python: no Django imports!
"""
from typing import Optional

from pubchempy import get_compounds


def lookup_iupac(smiles: str) -> Optional[str]:
    """
    Resolve a SMILES string to its IUPAC name via PubChem.
    Returns None when no compound is found or an error occurs.
    """
    try:
        compounds = get_compounds(smiles, namespace="smiles")
        return compounds[0].iupac_name if compounds else None
    except Exception as exc:        # network failure, invalid SMILES, etc.
        # Replace with structured logging if desired
        print(f"[WARN] IUPAC lookup failed for {smiles!r}: {exc}")
        return None

