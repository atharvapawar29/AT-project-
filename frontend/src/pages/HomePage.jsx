import React from "react";
import { Link } from "react-router-dom";
import { CLEAN_EXAMPLES, useConversion } from "../context/ConversionContext";

function HomePage() {
  const { regex, setRegex, loading, error, convert, reset, converted } = useConversion();

  return (
    <>
      <section className="hero-card card">
        <div>
          <h1>Regex to DFA Visual Simulator</h1>
          <p>
            Enter a regular expression and navigate page-by-page through RE to epsilon-NFA,
            epsilon-NFA to NFA, and NFA to DFA.
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

          <div className="quick-nav-row">
            <Link to="/re-to-enfa" className="page-link-chip">
              RE to epsilon-NFA
            </Link>
            <Link to="/enfa-to-nfa" className="page-link-chip">
              epsilon-NFA to NFA
            </Link>
            <Link to="/nfa-to-dfa" className="page-link-chip">
              NFA to DFA
            </Link>
            <Link to="/dfa-simulator" className="page-link-chip">
              DFA Simulator
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

export default HomePage;
