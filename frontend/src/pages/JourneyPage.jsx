import React from "react";
import { useConversion } from "../context/ConversionContext";
import JourneySimulator from "../components/JourneySimulator";

function JourneyPage() {
  const { converted } = useConversion();

  if (!converted) {
    return (
      <section className="card stage-card">
        <h2>Conversion Journey</h2>
        <p>Convert a regex first from the Home page.</p>
      </section>
    );
  }
  return (
    <JourneySimulator converted={converted} />
  );
}

export default JourneyPage;
