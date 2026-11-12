"""Deterministic safety signals for the local demonstration only."""
from __future__ import annotations

import re
import unicodedata


MENTAL_CRISIS_TERMS = (
    "muon chet", "khong muon song", "khong muon ton tai", "tu tu", "tu sat",
    "tu hai", "lam hai ban than", "lam ton thuong ban than", "ket thuc cuoc doi",
    "suicide", "kill myself", "self harm", "hurt myself", "want to die", "end my life",
)
PHYSICAL_RED_FLAGS = (
    "dau nguc du doi", "dau nguc that chat", "kho tho", "khong tho duoc",
    "liệt nua nguoi", "liet nua nguoi", "meo mieng", "co giat", "bat tinh",
    "ngat xiu", "chay mau khong cam", "dau nguc",
    "chest pain", "difficulty breathing", "shortness of breath", "stroke", "seizure", "unconscious",
)


def normalize(text: str) -> str:
    value = unicodedata.normalize("NFD", text.lower())
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", value).strip()


def detect_crisis(text: str) -> dict[str, object]:
    """Return urgent safety flags; no diagnosis, score, or model inference."""
    normalized = normalize(text)
    mental_hits = [term for term in MENTAL_CRISIS_TERMS if term in normalized]
    physical_hits = [term for term in PHYSICAL_RED_FLAGS if normalize(term) in normalized]

    # Safety-first prototype: explicit self-harm phrases trigger the safe path.
    # Negation is intentionally not used to suppress an urgent phrase in this demo.
    if mental_hits:
        return {"urgent": True, "kind": "mental_crisis", "signals": mental_hits}
    if physical_hits:
        return {"urgent": True, "kind": "physical_red_flag", "signals": physical_hits}
    return {"urgent": False, "kind": None, "signals": []}
