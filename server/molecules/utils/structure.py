"""
Pure helpers for turning a SMILES string into PNG bytes.
No Django imports here — keeps things test-friendly.
"""
from __future__ import annotations

import io
import requests
from typing import Optional
from PIL import Image, ImageDraw, ImageFont

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


def _label_from_smiles(smiles: str, max_len: int = 60) -> str:
    if not isinstance(smiles, str):
        return ""
    cleaned = " ".join(smiles.split())
    if len(cleaned) <= max_len:
        return cleaned
    return f"{cleaned[: max_len - 3]}..."


def _load_bold_font(target_size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    # Try common bold fonts; fall back safely if unavailable.
    candidates = [
        "arialbd.ttf",
        "Arial Bold.ttf",
        "DejaVuSans-Bold.ttf",
    ]
    for font_name in candidates:
        try:
            return ImageFont.truetype(font_name, target_size)
        except Exception:
            continue
    return ImageFont.load_default()


def _add_smiles_label(png_bytes: bytes, smiles: str) -> bytes:
    label = _label_from_smiles(smiles)
    if not label:
        return png_bytes

    try:
        img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
        draw = ImageDraw.Draw(img, "RGBA")
        font_size = max(14, min(24, img.width // 14))
        font = _load_bold_font(font_size)

        # Add a small readable strip at the bottom while keeping image size unchanged.
        text_bbox = draw.textbbox((0, 0), label, font=font)
        text_width = max(1, text_bbox[2] - text_bbox[0])
        text_height = max(14, text_bbox[3] - text_bbox[1])
        strip_h = text_height + 14
        y0 = max(0, img.height - strip_h)

        draw.rectangle([(0, y0), (img.width, img.height)], fill=(255, 255, 255, 225))
        text_x = max(6, (img.width - text_width) // 2)
        text_y = y0 + max(4, (strip_h - text_height) // 2 - 1)
        draw.text((text_x, text_y), label, fill=(25, 25, 25, 255), font=font)

        out = io.BytesIO()
        img.convert("RGB").save(out, format="PNG")
        return out.getvalue()
    except Exception as exc:
        print(f"[Label] smiles label draw failed for {smiles!r}: {exc}")
        return png_bytes


def smiles_to_png(smiles: str, size: tuple[int, int] | int = (300, 300)) -> Optional[bytes]:
    """
    Returns PNG bytes representing the 2-D molecule.
    • If RDKit is available, use it.
    • Otherwise fall back to PubChem's PNG service.
    • Returns None on failure.
    """
    # Normalize incoming size to a valid (width, height) tuple.
    if isinstance(size, (tuple, list)) and len(size) >= 2:
        try:
            width = int(size[0])
            height = int(size[1])
        except (TypeError, ValueError):
            width, height = 300, 300
    else:
        try:
            width = height = int(size)  # supports int-like values from API
        except (TypeError, ValueError):
            width, height = 300, 300

    if width <= 0 or height <= 0:
        width, height = 300, 300

    # RDKit route
    if _HAS_RDKIT:
        try:
            mol = Chem.MolFromSmiles(smiles, sanitize=True)
            if mol is not None:
                draw_options = Draw.MolDrawOptions()
                # Slightly increase padding so structure is a bit smaller and cleaner.
                draw_options.padding = 0.08
                img = Draw.MolToImage(
                    mol,
                    size=(width, height),
                    fitImage=True,
                    options=draw_options
                )
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                return _add_smiles_label(buf.getvalue(), smiles)
        except Exception as exc:
            # RDKit failed — will fall back to PubChem
            print(f"[RDKit] structure render failed for {smiles!r}: {exc}")

    # PubChem route
    try:
        resp = requests.get(_PUBCHEM_PNG.format(smiles=smiles), timeout=10)
        if resp.ok and resp.content:
            return _add_smiles_label(resp.content, smiles)
    except requests.RequestException as exc:
        print(f"[PubChem PNG] request failed for {smiles!r}: {exc}")

    # Everything failed
    return None
