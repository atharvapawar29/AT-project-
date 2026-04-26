from typing import Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from constants import EPSILON
from models import RegexInput
from regex_parser import add_concat, normalize_regex, to_postfix, validate_regex
from thompson import postfix_to_enfa
from epsilon_nfa_to_nfa import remove_epsilon
from nfa_to_dfa import convert_nfa_to_dfa
from automata_utils import as_payload, automata_tuple

app = FastAPI(title="Regex to DFA API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home() -> Dict[str, str]:
    return {"message": "Regex to DFA backend is running."}


@app.post("/convert")
def convert(data: RegexInput) -> Dict[str, object]:
    regex = normalize_regex(data.regex)

    try:
        validate_regex(regex)
        with_concat = add_concat(regex)
        postfix = to_postfix(with_concat)

        epsilon_nfa = postfix_to_enfa(postfix)
        nfa = remove_epsilon(epsilon_nfa)
        dfa, state_sets, dfa_build_steps = convert_nfa_to_dfa(nfa)

        alphabet = sorted({sym for _, sym, _ in epsilon_nfa.transitions if sym != EPSILON})

        return {
            "input": regex,
            "with_concat": with_concat,
            "postfix": postfix,
            "alphabet": alphabet,
            "epsilon_nfa": as_payload(epsilon_nfa),
            "nfa": as_payload(nfa),
            "dfa": as_payload(dfa),
            "dfa_state_sets": state_sets,
            "tuples": {
                "epsilon_nfa": automata_tuple(epsilon_nfa, alphabet),
                "nfa": automata_tuple(nfa, alphabet),
                "dfa": automata_tuple(dfa, alphabet),
            },
            "dfa_build_steps": dfa_build_steps,
            "notes": [
                "Union can be written as '|' or '+'.",
                "Implicit concatenation is inserted as '.'.",
                "Operators supported: *, |, +, parentheses.",
                "CFL/PDA notations like a^n b^n are rejected by design.",
            ],
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
