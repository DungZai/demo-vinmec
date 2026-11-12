"""Demo screening calculations; these prompts are not validated PHQ-9/GAD-7 forms."""
from __future__ import annotations


def score_demo(answers: list[int]) -> int:
    return sum(max(0, min(3, int(answer))) for answer in answers)
