from collections import deque
from typing import Dict, List

from models import TransitionGraph
from automata_utils import sort_transitions, subset_to_label


def convert_nfa_to_dfa(
    nfa: TransitionGraph,
) -> tuple[TransitionGraph, Dict[str, List[str]], List[Dict[str, object]]]:
    alphabet = sorted({sym for _, sym, _ in nfa.transitions})

    start_set = frozenset([nfa.start])
    queue = deque([start_set])
    seen = {start_set}
    dfa_build_steps: List[Dict[str, object]] = []

    subset_transitions: Dict[tuple[frozenset[str], str], frozenset[str]] = {}

    while queue:
        current = queue.popleft()
        current_label = subset_to_label(current)

        for symbol in alphabet:
            destination = set()
            for state in current:
                for src, sym, dst in nfa.transitions:
                    if src == state and sym == symbol:
                        destination.add(dst)

            if not destination:
                dfa_build_steps.append(
                    {
                        "from_subset": sorted(list(current), key=lambda s: int(s[1:])),
                        "from_label": current_label,
                        "symbol": symbol,
                        "to_subset": [],
                        "to_label": "∅",
                        "is_new": False,
                    }
                )
                continue

            frozen_destination = frozenset(destination)
            subset_transitions[(current, symbol)] = frozen_destination
            is_new = frozen_destination not in seen

            dfa_build_steps.append(
                {
                    "from_subset": sorted(list(current), key=lambda s: int(s[1:])),
                    "from_label": current_label,
                    "symbol": symbol,
                    "to_subset": sorted(list(frozen_destination), key=lambda s: int(s[1:])),
                    "to_label": subset_to_label(frozen_destination),
                    "is_new": is_new,
                }
            )

            if is_new:
                seen.add(frozen_destination)
                queue.append(frozen_destination)

    ordered_subsets = sorted(seen, key=lambda subset: (len(subset), sorted(subset)))

    subset_labels: Dict[frozenset[str], str] = {
        subset: f"D{i}" for i, subset in enumerate(ordered_subsets)
    }

    dfa_transitions: List[tuple[str, str, str]] = []
    for (src_subset, symbol), dst_subset in subset_transitions.items():
        dfa_transitions.append((subset_labels[src_subset], symbol, subset_labels[dst_subset]))

    dfa_final = []
    for subset, label in subset_labels.items():
        if any(state in nfa.final for state in subset):
            dfa_final.append(label)

    state_sets: Dict[str, List[str]] = {
        label: sorted(list(subset), key=lambda s: int(s[1:]))
        for subset, label in subset_labels.items()
    }

    dfa_graph = TransitionGraph(
        states=[subset_labels[s] for s in ordered_subsets],
        start=subset_labels[start_set],
        final=sorted(dfa_final),
        transitions=sort_transitions(dfa_transitions),
    )

    dfa_graph = remove_unreachable_dfa(dfa_graph)

    return dfa_graph, state_sets, dfa_build_steps

def remove_unreachable_dfa(graph: TransitionGraph) -> TransitionGraph:
    reachable = set()
    stack = [graph.start]

    while stack:
        state = stack.pop()
        if state in reachable:
            continue
        reachable.add(state)

        for src, sym, dst in graph.transitions:
            if src == state and dst not in reachable:
                stack.append(dst)

    new_transitions = [
        (src, sym, dst)
        for src, sym, dst in graph.transitions
        if src in reachable and dst in reachable
    ]

    new_final = [s for s in graph.final if s in reachable]

    return TransitionGraph(
        states=sorted(list(reachable)),
        start=graph.start,
        final=new_final,
        transitions=new_transitions,
    )
