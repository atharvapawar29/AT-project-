from typing import List


def is_symbol(token: str) -> bool:
    return token.isalnum()


def normalize_regex(regex: str) -> str:
    return "".join(regex.split())


def reject_non_regular_notation(regex: str) -> None:
    lowered = regex.lower()
    cfl_markers = ["^n", "{n}", "anbn", "a^nb^n", "ww", "|w|", "pda", "cfg", "cfl"]

    if any(marker in lowered for marker in cfl_markers):
        raise ValueError(
            "Input looks like CFL/PDA notation (example: a^n b^n). "
            "This tool supports regular expressions only."
        )


def validate_regex(regex: str) -> None:
    if not regex:
        raise ValueError("Regex cannot be empty.")

    reject_non_regular_notation(regex)

    valid_chars = set("()|+*")
    for ch in regex:
        if not (ch.isalnum() or ch in valid_chars):
            raise ValueError(
                f"Unsupported character '{ch}'. Use letters, digits, (), |, +, *."
            )

    depth = 0
    for ch in regex:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if depth < 0:
            raise ValueError("Mismatched parentheses: ')' appears before matching '('.")

    if depth != 0:
        raise ValueError("Mismatched parentheses: unclosed '('.")

    prev = ""
    for i, ch in enumerate(regex):
        if ch in "|+" and (i == 0 or i == len(regex) - 1):
            raise ValueError("Union operator cannot appear at the start or end.")

        if ch in "|+" and prev in "|+":
            raise ValueError("Consecutive union operators are not allowed.")

        if ch == "*" and (i == 0 or prev in "(|+"):
            raise ValueError("Kleene star must follow a symbol or ')'.")

        if ch == ")" and prev in "(|+":
            raise ValueError("Empty group or invalid operator before ')'.")

        prev = ch


def add_concat(regex: str) -> str:
    converted = regex.replace("+", "|")
    out: List[str] = []

    for i, c1 in enumerate(converted):
        out.append(c1)

        if i + 1 >= len(converted):
            continue

        c2 = converted[i + 1]

        left_can_concat = is_symbol(c1) or c1 in ")*"
        right_can_concat = is_symbol(c2) or c2 == "("

        if left_can_concat and right_can_concat:
            out.append(".")

    return "".join(out)


def precedence(op: str) -> int:
    return {"*": 3, ".": 2, "|": 1}.get(op, 0)


def to_postfix(regex_with_concat: str) -> str:
    stack: List[str] = []
    output: List[str] = []

    for token in regex_with_concat:
        if is_symbol(token):
            output.append(token)
        elif token == "(":
            stack.append(token)
        elif token == ")":
            while stack and stack[-1] != "(":
                output.append(stack.pop())
            if not stack:
                raise ValueError("Mismatched parentheses during postfix conversion.")
            stack.pop()
        else:
            while stack and stack[-1] != "(" and precedence(stack[-1]) >= precedence(token):
                output.append(stack.pop())
            stack.append(token)

    while stack:
        top = stack.pop()
        if top == "(":
            raise ValueError("Mismatched parentheses during postfix conversion.")
        output.append(top)

    return "".join(output)
