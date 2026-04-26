import React, { useEffect, useRef } from "react";
import { instance } from "@viz-js/viz";

function escapeLabel(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toDotId(value) {
  return `"${escapeLabel(value)}"`;
}

const GraphvizViewer = ({
  transitions,
  start,
  finalStates,
  title,
  compact = false,
  forceHorizontal = false,
  activeState = null,
  activeTransition = null,
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!transitions || transitions.length === 0) {
      containerRef.current.innerHTML = "";
      return;
    }

    const render = async () => {
      const viz = await instance();

      const grouped = new Map();
      transitions
        .filter((t) => Array.isArray(t) && t.length === 3)
        .forEach(([from, symbol, to]) => {
          const key = `${from}__${to}`;
          const existing = grouped.get(key) || { from, to, symbols: new Set() };
          existing.symbols.add(symbol);
          grouped.set(key, existing);
        });
      
      const usedStates = new Set();

      // Only include states that are actually part of CURRENT visible transitions
      grouped.forEach(({ from, to }) => {
      usedStates.add(from);
      usedStates.add(to);
      });

// 🔥 ALSO ensure start is included
if (start) {
  usedStates.add(start);
}

      let dot = "digraph Automata {\n";
      dot += "  rankdir=LR;\n";
      dot += compact
        ? "  graph [bgcolor=\"transparent\", pad=\"0.15\", nodesep=\"0.35\", ranksep=\"0.5\", splines=polyline, overlap=false, newrank=true];\n"
        : "  graph [bgcolor=\"transparent\", pad=\"0.2\", nodesep=\"0.75\", ranksep=\"0.95\", splines=polyline, overlap=false, newrank=true];\n";
      dot += compact
        ? "  node [shape=circle, fontname=\"Poppins\", fontsize=11, color=\"#e8efff\", penwidth=1.4, fontcolor=\"#e8efff\"];\n"
        : "  node [shape=circle, fontname=\"Poppins\", fontsize=13, color=\"#e8efff\", penwidth=1.8, fontcolor=\"#e8efff\"];\n";
      dot += compact
        ? "  edge [fontname=\"JetBrains Mono\", fontsize=10, color=\"#e8efff\", fontcolor=\"#e8efff\"];\n"
        : "  edge [fontname=\"JetBrains Mono\", fontsize=12, color=\"#e8efff\", fontcolor=\"#e8efff\"];\n";

      usedStates.forEach((state) => {
          dot += `  ${toDotId(state)};\n`;
      });

      if (forceHorizontal && usedStates.size > 1) {
        const orderedStates = Array.from(usedStates).sort();
        dot += `  { rank=same; ${orderedStates.map(toDotId).join("; ")}; }\n`;
      }

        if (activeState && usedStates.has(activeState)) {
        dot += `  ${toDotId(activeState)} [color="#00f0ff", penwidth=4, style=filled, fillcolor="#0a1f2e"];\n`;
      }

      (finalStates || []).forEach((state) => {
        if (usedStates.has(state)) {
           dot += `  ${toDotId(state)} [shape=doublecircle, color="#2dd4bf", penwidth=2.4];\n`;
          }
      });

      if (start) {
        dot += "  start [shape=point, color=\"#2dd4bf\"];\n";
        dot += `  start -> ${toDotId(start)} [color="#2dd4bf", penwidth=2];\n`;
      }

      grouped.forEach(({ from, to, symbols }) => {
        if (!usedStates.has(from) || !usedStates.has(to)) return;
        const label = Array.from(symbols).sort().map(escapeLabel).join(", ");
        const isActiveEdge =
          !!activeTransition &&
          activeTransition[0] === from &&
          activeTransition[2] === to &&
          symbols.has(activeTransition[1]);

        const edgeTone = isActiveEdge ? "#2ea8ff" : "#e8efff";
        const edgeWidth = isActiveEdge ? 2.8 : 1.2;

        if (from === to) {
          dot += `  ${toDotId(from)} -> ${toDotId(to)} [label="${label}", color="${edgeTone}", penwidth=${edgeWidth}, constraint=false, minlen=2, labelfloat=true, labeldistance=1.6, arrowsize=0.8];\n`;
        } else {
          dot += `  ${toDotId(from)} -> ${toDotId(to)} [label="${label}", color="${edgeTone}", penwidth=${edgeWidth}, arrowsize=0.8];\n`;
        }
      });

      dot += "}\n";

      try {
        const svg = viz.renderSVGElement(dot);
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(svg);
      } catch (error) {
        containerRef.current.innerHTML = "<p>Graph rendering failed.</p>";
      }
    };

    render();
  }, [transitions, start, finalStates, compact, forceHorizontal, activeState, activeTransition]);

  return (
    <section className="graph-card">
      <div className="graph-header-row">
        <h3>{title || "Automata Graph"}</h3>
      </div>
      <div className="graph-canvas" ref={containerRef} />
    </section>
  );
};

export default GraphvizViewer;
