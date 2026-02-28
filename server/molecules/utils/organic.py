# ------------------------------------------------------------------------
#  Organic / Inorganic / Both classifier
# ------------------------------------------------------------------------
from rdkit import Chem
import pandas as pd

# A very coarse list of common metal atomic numbers; tweak if needed
_METAL_Z = {
    3, 4, 11, 12, 13, 19, 20, 22, 24, 25, 26, 27, 28,
    29, 30, 31, 37, 38, 39, 40, 41, 42, 44, 45, 46, 47,
    48, 49, 50, 55, 56, 57, 72, 73, 74, 75, 76, 77, 78,
    79, 80, 81, 82, 83, 87, 88, 89, 90,
}

def classify_smiles(smiles: str) -> str:
    """
    Very quick heuristic:
      • 'organic'  = at least one carbon, *no* metal atoms
      • 'both'     = carbon(s) *and* ≥1 metal atom
      • 'inorganic'= no carbon atoms at all
    Returns 'invalid' if RDKit fails to parse.
    """
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return "invalid"

    has_c     = any(at.GetAtomicNum() == 6 for at in mol.GetAtoms())
    has_metal = any(at.GetAtomicNum() in _METAL_Z for at in mol.GetAtoms())

    if not has_c:
        return "inorganic"
    if has_metal:
        return "both"
    return "organic"

def add_or_verify_category(
    df: pd.DataFrame,
    smiles_col: str = "SMILES",
    category_col: str = "category",
    overwrite: bool = False,
) -> pd.DataFrame:
    """
    Adds a 'category' column (organic / inorganic / both) or, if it
    already exists, flags mismatches between the stored value and the
    computed one.

    Returns a *new* dataframe with two extra cols:
       • category      – trusted value
       • cat_mismatch  – True if old ≠ new
    """
    df = df.copy()
    computed = df[smiles_col].apply(classify_smiles)

    if category_col not in df.columns or overwrite:
        df[category_col] = computed
        df["cat_mismatch"] = False
        return df

    # column already there → compare
    df["cat_mismatch"] = df[category_col].ne(computed)
    return df
