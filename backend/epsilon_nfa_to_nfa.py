from collections import deque
from typing import Set

from constants import EPSILON
from models import TransitionGraph
from automata_utils import sort_transitions

def get_reachable_states(start, transitions):
    reachable = set()
    stack = [start]

    while stack:
        state = stack.pop()
        if state in reachable:
            continue
        reachable.add(state)

        for src, sym, dst in transitions:
            if src == state and dst not in reachable:
                stack.append(dst)

    return reachable


def epsilon_closure(states: Set[str], transitions: list[tuple[str, str, str]]) -> Set[str]:
    closure = set(states)
    queue = deque(states)

    while queue:
        state = queue.popleft()
        for src, sym, dst in transitions:
            if src == state and sym == EPSILON and dst not in closure:
                closure.add(dst)
                queue.append(dst)

    return closure


def move(states: Set[str], symbol: str, transitions: list[tuple[str, str, str]]) -> Set[str]:
    reached: Set[str] = set()
    for src, sym, dst in transitions:
        if src in states and sym == symbol:
            reached.add(dst)
    return reached


def remove_epsilon(enfa: TransitionGraph) -> TransitionGraph:
    alphabet = sorted({sym for _, sym, _ in enfa.transitions if sym != EPSILON})
    new_transitions: Set[tuple[str, str, str]] = set()
    new_final: Set[str] = set()
    reachable_states = get_reachable_states(enfa.start, enfa.transitions)

    for state in reachable_states:
        closure = epsilon_closure({state}, enfa.transitions)
        if any(final_state in closure for final_state in enfa.final):
            new_final.add(state)

        for symbol in alphabet:
            reached = move(closure, symbol, enfa.transitions)
            closure_reached = epsilon_closure(reached, enfa.transitions)
            for target in closure_reached:
                new_transitions.add((state, symbol, target))

    result = TransitionGraph(
    states=sorted(
        list({s for t in new_transitions for s in (t[0], t[2])}),
        key=lambda s: int(s[1:])
    ),
    start=enfa.start,
    final=sorted(new_final, key=lambda s: int(s[1:])),
    transitions=sort_transitions(list(new_transitions)),
    )

    return remove_unreachable(result)


def remove_unreachable(graph: TransitionGraph) -> TransitionGraph:
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
        states=sorted(list(reachable), key=lambda s: int(s[1:])),
        start=graph.start,
        final=new_final,
        transitions=new_transitions,
    )