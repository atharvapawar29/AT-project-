import React, { useMemo, useState } from "react";
import GraphvizViewer from "./GraphvizViewer";
import { runDfaTrace } from "../utils/automataView";

export function TransitionTable({ transitions }) {
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

export function TupleView({ tupleData }) {
  if (!tupleData) {
    return null;
  }

  return (
    <div className="text-block tuple-block">
      <p>
        <strong>Q:</strong> {`{${(tupleData.Q || []).join(", ")}}`}
      </p>
      <p>
        <strong>Σ:</strong> {`{${(tupleData.Sigma || []).join(", ")}}`}
      </p>
      <p>
        <strong>q0:</strong> {tupleData.q0}
      </p>
      <p>
        <strong>F:</strong> {`{${(tupleData.F || []).join(", ")}}`}
      </p>
      <p>
        <strong>δ:</strong> listed in transition table below
      </p>
    </div>
  );
}

export function StageCard({
  title,
  subtitle,
  graph,
  tuple,
  compactGraph = false,
  activeState = null,
  activeTransition = null,
}) {
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
        compact={compactGraph}
        activeState={activeState}
        activeTransition={activeTransition}
      />
    </section>
  );
}

export function DfaStateMapping({ rows, formatSubset }) {
  if (!rows || rows.length === 0) {
    return null;
  }

  return (
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
            {rows.map((item) => (
              <tr key={item.dfaState}>
                <td>{item.dfaState}</td>
                <td>{formatSubset(item.nfaSubset)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DfaBuildSimulator({ steps }) {
  const [cursor, setCursor] = useState(0);
  const [activeTransition, setActiveTransition] = useState(null);
  const safeSteps = steps || [];
  const current = safeSteps[Math.min(cursor, Math.max(safeSteps.length - 1, 0))] || null;

  React.useEffect(() => {
    setCursor(0);
  }, [steps]);

  // 🔥 Set active transition for animation
  React.useEffect(() => {
    if (!current) {
      setActiveTransition(null);
      return;
    }

    setActiveTransition([
      current.from_label,
      current.symbol,
      current.to_label,
    ]);
  }, [current]);

  if (safeSteps.length === 0) {
    return null;
  }

  return (
    <section className="card dfa-build-card">
      <h2>NFA to DFA Construction Simulator</h2>

      <div className="simulator-controls dfa-build-controls">
        <button onClick={() => setCursor(0)} className="secondary">Reset</button>

        <button
          className="secondary"
          disabled={cursor === 0}
          onClick={() => setCursor((prev) => Math.max(prev - 1, 0))}
        >
          Prev
        </button>

        <button
          disabled={cursor >= steps.length - 1}
          onClick={() => setCursor((prev) => Math.min(prev + 1, steps.length - 1))}
        >
          Next
        </button>
      </div>

      <div className="text-block">
        <p><strong>Step:</strong> {cursor + 1} / {safeSteps.length}</p>
        <p><strong>From:</strong> {current.from_label}</p>
        <p><strong>Symbol:</strong> {current.symbol}</p>
        <p><strong>To:</strong> {current.to_label}</p>
        <p><strong>New:</strong> {current.is_new ? "Yes" : "No"}</p>
      </div>
      <p style={{ color: "#8dd0ff", marginTop: "8px" }}>
      {current.from_label} --{current.symbol}→ {current.to_label}
      </p>

      {/* 🔥 LIVE GRAPH ANIMATION */}
      <GraphvizViewer
        title="Live DFA Construction"
        transitions={safeSteps
            .slice(0, cursor + 1)
            .map(s => [s.from_label, s.symbol, s.to_label])}
        start={safeSteps[0]?.from_label}
        forceHorizontal
        finalStates={
          safeSteps
            .slice(0, cursor + 1)
            .map(s => s.to_label)
            .filter((state, i, arr) => arr.indexOf(state) === i)
          }
        activeTransition={activeTransition}
        activeState={current.to_label || current.from_label}
        />
    </section>
  );
}

export function DfaStringSimulator({ dfa }) {
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
