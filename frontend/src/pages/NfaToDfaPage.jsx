import React from "react";
import { DfaStateMapping, StageCard } from "../components/AutomataViews";
import { useConversion } from "../context/ConversionContext";
import { formatSubset } from "../utils/automataView";

function NfaToDfaPage() {
  const { converted } = useConversion();

  if (!converted) {
    return (
      <section className="card stage-card">
        <h2>NFA to DFA</h2>
        <p>Convert a regex first from the Home page.</p>
      </section>
    );
  }

  return (
    <>
      <StageCard
        title="NFA to DFA"
        subtitle="Subset construction creates deterministic states."
        graph={converted.dfa.graph}
        tuple={converted.dfa.tuple}
      />
      <DfaStateMapping rows={converted.dfaStateSets} formatSubset={formatSubset} />
    </>
  );
}

export default NfaToDfaPage;
