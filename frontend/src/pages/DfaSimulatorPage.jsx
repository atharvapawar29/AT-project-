import React from "react";
import { DfaStringSimulator } from "../components/AutomataViews";
import { useConversion } from "../context/ConversionContext";

function DfaSimulatorPage() {
  const { converted } = useConversion();

  if (!converted) {
    return (
      <section className="card stage-card">
        <h2>DFA Simulator</h2>
        <p>Convert a regex first from the Home page.</p>
      </section>
    );
  }

  return <DfaStringSimulator dfa={converted.dfa.graph} />;
}

export default DfaSimulatorPage;
