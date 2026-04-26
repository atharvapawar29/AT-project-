import React from "react";
import { StageCard } from "../components/AutomataViews";
import { useConversion } from "../context/ConversionContext";

function ReToEnfaPage() {
  const { converted } = useConversion();

  if (!converted) {
    return (
      <section className="card stage-card">
        <h2>RE to epsilon-NFA</h2>
        <p>Convert a regex first from the Home page.</p>
      </section>
    );
  }

  return (
    <StageCard
      title="RE to epsilon-NFA"
      subtitle="Thompson construction with epsilon transitions."
      graph={converted.epsilon.graph}
      tuple={converted.epsilon.tuple}
      compactGraph
    />
  );
}

export default ReToEnfaPage;
