from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Set

from constants import EPSILON
from models import TransitionGraph
from regex_parser import is_symbol
from automata_utils import sort_transitions


class StateFactory:
    def __init__(self, prefix: str = "S") -> None:
        self.prefix = prefix
        self.counter = 0

    def next(self) -> str:
        state = f"{self.prefix}{self.counter}"
        self.counter += 1
        return state


@dataclass
class Fragment:
    start: str
    end: str


def add_edge(edges: Dict[str, Dict[str, Set[str]]], src: str, symbol: str, dst: str) -> None:
    edges[src][symbol].add(dst)


def postfix_to_enfa(postfix: str) -> TransitionGraph:
    factory = StateFactory("S")
    stack: List[Fragment] = []
    edges: Dict[str, Dict[str, Set[str]]] = defaultdict(lambda: defaultdict(set))

    for token in postfix:
        if is_symbol(token):
            start = factory.next()
            end = factory.next()
            add_edge(edges, start, token, end)
            stack.append(Fragment(start, end))

        elif token == ".":
            if len(stack) < 2:
                raise ValueError("Invalid regex: concatenation missing operand.")
            right = stack.pop()
            left = stack.pop()
            add_edge(edges, left.end, EPSILON, right.start)
            stack.append(Fragment(left.start, right.end))

        elif token == "|":
            if len(stack) < 2:
                raise ValueError("Invalid regex: union missing operand.")
            right = stack.pop()
            left = stack.pop()
            start = factory.next()
            end = factory.next()

            add_edge(edges, start, EPSILON, left.start)
            add_edge(edges, start, EPSILON, right.start)
            add_edge(edges, left.end, EPSILON, end)
            add_edge(edges, right.end, EPSILON, end)

            stack.append(Fragment(start, end))

        elif token == "*":
            if not stack:
                raise ValueError("Invalid regex: star missing operand.")
            node = stack.pop()
            start = factory.next()
            end = factory.next()

            add_edge(edges, start, EPSILON, node.start)
            add_edge(edges, start, EPSILON, end)
            add_edge(edges, node.end, EPSILON, node.start)
            add_edge(edges, node.end, EPSILON, end)

            stack.append(Fragment(start, end))

        else:
            raise ValueError(f"Unexpected token '{token}' in postfix expression.")

    if len(stack) != 1:
        raise ValueError("Invalid regex: expression could not be reduced to one automaton.")

    fragment = stack.pop()

    states: Set[str] = {fragment.start, fragment.end}
    transitions: List[tuple[str, str, str]] = []

    for src, by_symbol in edges.items():
        states.add(src)
        for symbol, targets in by_symbol.items():
            for dst in targets:
                states.add(dst)
                transitions.append((src, symbol, dst))

    def get_reachable(start: str, graph_edges: Dict[str, Dict[str, Set[str]]]) -> Set[str]:
        reachable: Set[str] = set()
        stack = [start]

        while stack:
            s = stack.pop()
            if s in reachable:
                continue
            reachable.add(s)

            for sym in graph_edges.get(s, {}):
                for nxt in graph_edges[s][sym]:
                    stack.append(nxt)

        return reachable

    reachable_states = get_reachable(fragment.start, edges)

    filtered_transitions = [
        (src, sym, dst)
        for src, sym, dst in transitions
        if src in reachable_states and dst in reachable_states
    ]

    ordered_states = sorted(reachable_states, key=lambda s: int(s[1:]))

    return TransitionGraph(
        states=ordered_states,
        start=fragment.start,
        final=[fragment.end],
        transitions=sort_transitions(filtered_transitions),
    )
