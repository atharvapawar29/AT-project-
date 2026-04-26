export function orderStates(rawGraph) {
  const seen = new Set();
  const ordered = [];

  if (rawGraph?.start) {
    seen.add(rawGraph.start);
    ordered.push(rawGraph.start);
  }

  (rawGraph?.transitions || []).forEach(([from, , to]) => {
    if (!seen.has(from)) {
      seen.add(from);
      ordered.push(from);
    }
    if (!seen.has(to)) {
      seen.add(to);
      ordered.push(to);
    }
  });

  (rawGraph?.states || []).forEach((state) => {
    if (!seen.has(state)) {
      seen.add(state);
      ordered.push(state);
    }
  });

  return ordered;
}

export function relabelAutomaton(rawGraph, rawTuple) {
  if (!rawGraph) {
    return { graph: null, tuple: null, map: {} };
  }

  const orderedStates = orderStates(rawGraph);
  const stateMap = {};

  orderedStates.forEach((state, index) => {
    stateMap[state] = `q${index + 1}`;
  });

  const graph = {
    states: (rawGraph.states || []).map((state) => stateMap[state] || state),
    start: stateMap[rawGraph.start] || rawGraph.start,
    final: (rawGraph.final || []).map((state) => stateMap[state] || state),
    transitions: (rawGraph.transitions || []).map(([from, symbol, to]) => [
      stateMap[from] || from,
      symbol,
      stateMap[to] || to,
    ]),
  };

  const tuple = rawTuple
    ? {
        Q: (rawTuple.Q || []).map((state) => stateMap[state] || state),
        Sigma: rawTuple.Sigma || [],
        delta: (rawTuple.delta || []).map(([from, symbol, to]) => [
          stateMap[from] || from,
          symbol,
          stateMap[to] || to,
        ]),
        q0: stateMap[rawTuple.q0] || rawTuple.q0,
        F: (rawTuple.F || []).map((state) => stateMap[state] || state),
      }
    : null;

  return { graph, tuple, map: stateMap };
}

export function formatSubset(states) {
  if (!states || states.length === 0) {
    return "∅";
  }
  return `{${states.join(", ")}}`;
}

export function buildTransitionMap(dfa) {
  const map = new Map();
  (dfa?.transitions || []).forEach(([from, symbol, to]) => {
    map.set(`${from}|${symbol}`, to);
  });
  return map;
}

export function runDfaTrace(dfa, input) {
  if (!dfa?.start) {
    return {
      accepted: false,
      reason: "No DFA available yet.",
      trace: [],
      endState: null,
    };
  }

  const transitionMap = buildTransitionMap(dfa);
  let currentState = dfa.start;
  const trace = [];

  for (let i = 0; i < input.length; i += 1) {
    const symbol = input[i];
    const key = `${currentState}|${symbol}`;
    const nextState = transitionMap.get(key);

    if (!nextState) {
      trace.push({
        step: i + 1,
        from: currentState,
        symbol,
        to: "dead",
      });

      return {
        accepted: false,
        reason: `No transition from ${currentState} on '${symbol}'.`,
        trace,
        endState: currentState,
      };
    }

    trace.push({
      step: i + 1,
      from: currentState,
      symbol,
      to: nextState,
    });

    currentState = nextState;
  }

  const accepted = (dfa.final || []).includes(currentState);
  return {
    accepted,
    reason: accepted ? "Input ends in an accepting state." : "Input ends in a non-accepting state.",
    trace,
    endState: currentState,
  };
}
