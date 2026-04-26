import React, { useEffect, useMemo, useState } from "react";
import { StageCard, DfaStateMapping, DfaBuildSimulator } from "./AutomataViews";
import { formatSubset } from "../utils/automataView";

function JourneySimulator({ converted }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(1800);
  const [transitionIndex, setTransitionIndex] = useState(0);

  const stages = useMemo(() => {
    if (!converted) {
      return [];
    }

    return [
      {
        key: "enfa",
        title: "Step 1: RE to epsilon-NFA",
        subtitle: "Thompson construction with epsilon transitions.",
        graph: converted.epsilon.graph,
        tuple: converted.epsilon.tuple,
        extra: null,
      },
      {
        key: "nfa",
        title: "Step 2: epsilon-NFA to NFA",
        subtitle: "Remove epsilon transitions using epsilon-closure.",
        graph: converted.nfa.graph,
        tuple: converted.nfa.tuple,
        extra: null,
      },
      {
        key: "dfa",
        title: "Step 3: NFA to DFA",
        subtitle: "Subset construction creates deterministic states.",
        graph: converted.dfa.graph,
        tuple: converted.dfa.tuple,
        extra: (
          <>
            <DfaStateMapping rows={converted.dfaStateSets} formatSubset={formatSubset} />
            <DfaBuildSimulator steps={converted.dfaBuildSteps} />
          </>
        ),
      },
    ];
  }, [converted]);

  useEffect(() => {
    setStageIndex(0);
    setIsPlaying(true);
  }, [converted]);

  useEffect(() => {
    setTransitionIndex(0);
  }, [stageIndex]);

  useEffect(() => {
    if (!isPlaying || stages.length === 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setStageIndex((current) => {
        if (current >= stages.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, speedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, stageIndex, speedMs, stages.length]);

  const current = stages[stageIndex];
  const sceneTransitions = useMemo(() => current?.graph?.transitions || [], [current]);

  useEffect(() => {
    if (!isPlaying || sceneTransitions.length === 0) {
      return undefined;
    }

    const transitionTimer = setTimeout(() => {
      setTransitionIndex((currentIdx) =>
        currentIdx < sceneTransitions.length - 1 ? currentIdx + 1 : currentIdx
        );
    }, Math.max(500, Math.floor(speedMs * 0.55)));

    return () => clearTimeout(transitionTimer);
  }, [isPlaying, transitionIndex, sceneTransitions, speedMs]);

  if (!converted || stages.length === 0) {
    return null;
  }

  const activeTransition = sceneTransitions[transitionIndex] || null;
  const activeState =
  current.key === "dfa"
    ? sceneTransitions[transitionIndex]?.[2]
    : activeTransition
    ? activeTransition[2]
    : current?.graph?.start || null;

  return (
    <section className="card journey-simulator-card">
      <div className="journey-sim-header">
        <div>
          <h2>Conversion Simulator</h2>
          <p>Auto-plays the RE → epsilon-NFA → NFA → DFA flow with a moving neon focus.</p>
        </div>
        <div className="journey-sim-controls">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setStageIndex(0);
              setIsPlaying(true);
            }}
          >
            Restart
          </button>
          <button type="button" onClick={() => setIsPlaying((prev) => !prev)}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <label className="speed-control speed-control-inline" htmlFor="journey-speed">
            Speed
            <select
              id="journey-speed"
              value={speedMs}
              onChange={(event) => setSpeedMs(Number(event.target.value))}
            >
              <option value={1900}>Slow</option>
              <option value={1400}>Normal</option>
              <option value={900}>Fast</option>
            </select>
          </label>
        </div>
      </div>

      <div className="journey-timeline">
        {stages.map((stage, index) => (
          <button
            key={stage.key}
            type="button"
            className={`journey-step-chip ${index === stageIndex ? "active" : ""} ${index < stageIndex ? "done" : ""}`}
            onClick={() => {
              setStageIndex(index);
              setIsPlaying(false);
            }}
          >
            <span className="journey-step-dot" />
            <span>{stage.title}</span>
          </button>
        ))}
      </div>

      <div className="journey-current-scene">
        <div className="journey-focus-orb" />
        <div className="journey-scene-copy">
          <h3>{current.title}</h3>
          <p>{current.subtitle}</p>
          <div className="journey-scene-progress">
            <span>Stage {stageIndex + 1}</span>
            <span>of {stages.length}</span>
          </div>
          {activeTransition && (
            <div className="journey-active-badge">
              <span className="journey-active-tag">active</span>
              <span>{activeTransition[0]}</span>
              <span>--{activeTransition[1]}--&gt;</span>
              <span>{activeTransition[2]}</span>
            </div>
          )}
          {transitionIndex === sceneTransitions.length - 1 && (
            <div className="journey-active-badge">
                <span>✔ Construction Complete</span>
            </div>
        )}
        </div>
      </div>

      <StageCard
        title={current.title}
        subtitle={current.subtitle}
        graph={current.graph}
        tuple={current.tuple}
        compactGraph={stageIndex === 0}
        activeState={activeState}
        activeTransition={activeTransition}
      />

      {current.extra}
    </section>
  );
}

export default JourneySimulator;
