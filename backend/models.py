from dataclasses import dataclass
from typing import List, Tuple

from pydantic import BaseModel


class RegexInput(BaseModel):
    regex: str


@dataclass
class TransitionGraph:
    states: List[str]
    start: str
    final: List[str]
    transitions: List[Tuple[str, str, str]]
