from typing import Dict, List

from models import TransitionGraph


def sort_transitions(transitions: List[tuple[str, str, str]]) -> List[tuple[str, str, str]]:
    return sorted(transitions, key=lambda t: (t[0], t[1], t[2]))


def subset_to_label(subset: frozenset[str]) -> str:
    ordered = sorted(list(subset), key=lambda s: int(s[1:]))
    return "{" + ", ".join(ordered) + "}"


def as_payload(graph: TransitionGraph) -> Dict[str, object]:
    return {
        "states": graph.states,
        "start": graph.start,
        "final": graph.final,
        "transitions": graph.transitions,
    }


def automata_tuple(graph: TransitionGraph, alphabet: List[str]) -> Dict[str, object]:
    return {
        "Q": graph.states,
        "Sigma": alphabet,
        "delta": graph.transitions,
        "q0": graph.start,
        "F": graph.final,
    }
