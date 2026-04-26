import React, { useMemo, useState } from "react";
import axios from "axios";
import GraphvizViewer from "./GraphvizViewer";

const CLEAN_EXAMPLES = ["a", "ab", "a|b", "(a|b)*abb", "a*b", "(ab|ba)(a|b)"];

function orderStates(rawGraph) {
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

function relabelAutomaton(rawGraph, rawTuple) {
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

function formatSubset(states) {
  if (!states || states.length === 0) {
    return "∅";
  }
  return `{${states.join(", ")}}`;
}

function buildTransitionMap(dfa) {
  const map = new Map();
  (dfa?.transitions || []).forEach(([from, symbol, to]) => {
    map.set(`${from}|${symbol}`, to);
  });
  return map;
}

function runDfaTrace(dfa, input) {
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

function TransitionTable({ transitions }) {
  if (!transitions || transitions.length === 0) {
    return <p className="empty-message">No transitions available.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>Symbol</th>
            <th>To</th>
          </tr>
        </thead>
        <tbody>
          {transitions.map(([from, symbol, to], idx) => (
            <tr key={`${from}-${symbol}-${to}-${idx}`}>
              <td>{from}</td>
              <td>{symbol}</td>
              <td>{to}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TupleView({ tupleData }) {
  if (!tupleData) {
    return null;
  }

  return (
    <div className="text-block tuple-block">
      <p>
        <strong>Q:</strong> {`{${(tupleData.Q || []).join(", ")}}`}
      </p>
      <p>
        <strong>Sigma:</strong> {`{${(tupleData.Sigma || []).join(", ")}}`}
      </p>
      <p>
        <strong>q0:</strong> {tupleData.q0}
      </p>
      <p>
        <strong>F:</strong> {`{${(tupleData.F || []).join(", ")}}`}
      </p>
      <p>
        <strong>delta:</strong> listed in transition table below
      </p>
    </div>
  );
}

function StageCard({ title, subtitle, graph, tuple }) {
  if (!graph) {
    return null;
  }

  return (
    <section className="card stage-card">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <TupleView tupleData={tuple} />
      <TransitionTable transitions={graph.transitions} />
      <GraphvizViewer
        title={title}
        transitions={graph.transitions}
        start={graph.start}
        finalStates={graph.final}
      />
    </section>
  );
}

function DfaBuildSimulator({ steps }) {
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(900);

  React.useEffect(() => {
    if (!steps || steps.length === 0 || !isPlaying) {
      return undefined;
    }

    if (cursor >= steps.length - 1) {
      setIsPlaying(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      setCursor((prev) => Math.min(prev + 1, steps.length - 1));
    }, speedMs);

    return () => clearTimeout(timer);
  }, [steps, isPlaying, cursor, speedMs]);

  React.useEffect(() => {
    setCursor(0);
    setIsPlaying(false);
  }, [steps]);

  if (!steps || steps.length === 0) {
    return null;
  }

  const current = steps[Math.min(cursor, steps.length - 1)];

  return (
    <section className="card dfa-build-card">
      <h2>NFA to DFA Construction Simulator</h2>
      <p>Paper-style subset construction, one transition at a time.</p>

      <div className="simulator-controls dfa-build-controls">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setCursor(0);
            setIsPlaying(false);
          }}
        >
          Reset
        </button>
        <button
          type="button"
          className={isPlaying ? "secondary" : ""}
          onClick={() => setIsPlaying((prev) => !prev)}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={cursor === 0}
          onClick={() => {
            setIsPlaying(false);
            setCursor((prev) => Math.max(prev - 1, 0));
          }}
        >
          Prev
        </button>
        <button
          type="button"
          disabled={cursor >= steps.length - 1}
          onClick={() => {
            setIsPlaying(false);
            setCursor((prev) => Math.min(prev + 1, steps.length - 1));
          }}
        >
          Next
        </button>

        <label className="speed-control" htmlFor="dfa-speed">
          Speed
          <select
            id="dfa-speed"
            value={speedMs}
            onChange={(event) => setSpeedMs(Number(event.target.value))}
          >
            <option value={1200}>Slow</option>
            <option value={900}>Normal</option>
            <option value={500}>Fast</option>
          </select>
        </label>
      </div>

      <div className="text-block">
        <p>
          <strong>Step:</strong> {cursor + 1} / {steps.length}
        </p>
        <p>
          <strong>From subset:</strong> {current.from_label}
        </p>
        <p>
          <strong>Input symbol:</strong> {current.symbol}
        </p>
        <p>
          <strong>To subset:</strong> {current.to_label}
        </p>
        <p>
          <strong>New state:</strong> {current.is_new ? "Yes" : "No"}
        </p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>From Subset</th>
              <th>Symbol</th>
              <th>To Subset</th>
              <th>New?</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr key={`${step.from_label}-${step.symbol}-${index}`} className={index === cursor ? "active-row" : ""}>
                <td>{index + 1}</td>
                <td>{step.from_label}</td>
                <td>{step.symbol}</td>
                <td>{step.to_label}</td>
                <td>{step.is_new ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Simulator({ dfa }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  const alphabet = useMemo(() => {
    return Array.from(new Set((dfa?.transitions || []).map(([, symbol]) => symbol))).sort();
  }, [dfa]);

  React.useEffect(() => {
    setInput("");
    setResult(null);
  }, [dfa]);

  const onRun = () => {
    const traceResult = runDfaTrace(dfa, input.trim());
    setResult(traceResult);
  };

  if (!dfa) {
    return null;
  }

  return (
    <section className="card simulator-card">
      <h2>DFA String Simulator</h2>
      <p>Run strings over the generated DFA and inspect the state path.</p>

      <div className="simulator-controls">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={`Try string over alphabet: ${alphabet.join(", ") || "-"}`}
        />
        <button type="button" onClick={onRun}>
          Run String
        </button>
      </div>

      {result && (
        <div className={`sim-output ${result.accepted ? "accepted" : "rejected"}`}>
          <p>
            <strong>{result.accepted ? "Accepted" : "Rejected"}</strong>
          </p>
          <p>{result.reason}</p>
          <p>
            End state: <strong>{result.endState || "-"}</strong>
          </p>

          {result.trace.length > 0 && (
            <div className="trace-list">
              {result.trace.map((row) => (
                <div key={`${row.step}-${row.from}-${row.symbol}`} className="trace-item">
                  <span>#{row.step}</span>
                  <span>{row.from}</span>
                  <span>--{row.symbol}--&gt;</span>
                  <span>{row.to}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

const RegexInputCard = () => {
  const [regex, setRegex] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const converted = useMemo(() => {
    if (!result) {
      return null;
    }

    const epsilon = relabelAutomaton(result.epsilon_nfa, result.tuples?.epsilon_nfa);
    const nfa = relabelAutomaton(result.nfa, result.tuples?.nfa);
    const dfa = relabelAutomaton(result.dfa, result.tuples?.dfa);

    const dfaStateSets = Object.entries(result.dfa_state_sets || {}).map(([dfaState, nfaSubset]) => ({
      dfaState: dfa.map[dfaState] || dfaState,
      nfaSubset: (nfaSubset || []).map((state) => nfa.map[state] || state),
    }));

    const dfaBuildSteps = (result.dfa_build_steps || []).map((step) => {
      const fromSubset = (step.from_subset || []).map((state) => nfa.map[state] || state);
      const toSubset = (step.to_subset || []).map((state) => nfa.map[state] || state);

      return {
        ...step,
        from_label: formatSubset(fromSubset),
        to_label: formatSubset(toSubset),
      };
    });

    return {
      input: result.input,
      with_concat: result.with_concat,
      postfix: result.postfix,
      alphabet: result.alphabet || [],
      epsilon,
      nfa,
      dfa,
      dfaStateSets,
      dfaBuildSteps,
    };
  }, [result]);

  const convert = async () => {
    if (!regex.trim()) {
      setError("Regex cannot be empty.");
      setResult(null);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/convert", { regex });
      setResult(response.data);
    } catch (err) {
      const message = err?.response?.data?.detail || "Conversion failed. Check regex format.";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setRegex("");
    setResult(null);
    setError("");
  };

  return (
    <main className="learning-shell">
      <section className="hero-card card">
        <div>
          <h1>Regex to DFA Visual Simulator</h1>
          <p>
            Enter a regular expression and see the full paper-style conversion: RE to epsilon-NFA, epsilon-NFA to NFA,
            and NFA to DFA with textbook state symbols.
          </p>
        </div>

        <div className="hero-input-row">
          <input
            value={regex}
            onChange={(event) => setRegex(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                convert();
              }
            }}
            placeholder="Try: (a|b)*abb"
          />
          <button type="button" onClick={convert} disabled={loading}>
            {loading ? "Converting..." : "Convert"}
          </button>
          <button type="button" className="secondary" onClick={reset}>
            Reset
          </button>
        </div>

        <div className="example-row">
          {CLEAN_EXAMPLES.map((item) => (
            <button key={item} type="button" className="example-chip" onClick={() => setRegex(item)}>
              {item}
            </button>
          ))}
        </div>

        {error && <p className="error-box">{error}</p>}
      </section>

      {converted && (
        <section className="card conversion-overview-card">
          <h2>Conversion Details</h2>
          <div className="text-block">
            <p>
              <strong>Input RE:</strong> {converted.input}
            </p>
            <p>
              <strong>Explicit concatenation:</strong> {converted.with_concat}
            </p>
            <p>
              <strong>Postfix:</strong> {converted.postfix}
            </p>
            <p>
              <strong>Alphabet:</strong> {converted.alphabet.join(", ") || "None"}
            </p>
          </div>
        </section>
      )}

      <StageCard
        title="RE to epsilon-NFA"
        subtitle="Thompson construction with epsilon transitions."
        graph={converted?.epsilon?.graph}
        tuple={converted?.epsilon?.tuple}
      />

      <StageCard
        title="epsilon-NFA to NFA"
        subtitle="Epsilon transitions removed using epsilon-closure."
        graph={converted?.nfa?.graph}
        tuple={converted?.nfa?.tuple}
      />

      <StageCard
        title="NFA to DFA"
        subtitle="Subset construction creates deterministic states."
        graph={converted?.dfa?.graph}
        tuple={converted?.dfa?.tuple}
      />

      {converted && converted.dfaStateSets.length > 0 && (
        <section className="card state-subset-card">
          <h2>DFA State Mapping</h2>
          <p>Each DFA state corresponds to a subset of NFA states.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>DFA State</th>
                  <th>NFA Subset</th>
                </tr>
              </thead>
              <tbody>
                {converted.dfaStateSets.map((item) => (
                  <tr key={item.dfaState}>
                    <td>{item.dfaState}</td>
                    <td>{formatSubset(item.nfaSubset)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <DfaBuildSimulator steps={converted?.dfaBuildSteps} />
      <Simulator dfa={converted?.dfa?.graph} />
    </main>
  );
};

export default RegexInputCard;
