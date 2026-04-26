import React from "react";
import { StageCard } from "../components/AutomataViews";
import { useConversion } from "../context/ConversionContext";

function EnfaToNfaPage() {
  const { converted } = useConversion();

  if (!converted) {
    return (
      <section className="card stage-card">
        <h2>epsilon-NFA to NFA</h2>
        <p>Convert a regex first from the Home page.</p>
      </section>
    );
  }

  return (
    <StageCard
      title="epsilon-NFA to NFA"
      subtitle="Epsilon transitions removed using epsilon-closure."
      graph={converted.nfa.graph}
      tuple={converted.nfa.tuple}
    />
  );
}

export default EnfaToNfaPage;
