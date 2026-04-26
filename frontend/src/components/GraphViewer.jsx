import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

const GraphViewer = ({ transitions, start, finalStates }) => {
  if (!transitions || transitions.length === 0) return null;

  // 🔥 Collect unique states
  const states = new Set();
  transitions.forEach(([from, , to]) => {
    states.add(from);
    states.add(to);
  });

  const stateArray = Array.from(states);

  // 🔥 Circular layout (better spacing)
  const radius = 230;
  const centerX = 450;
  const centerY = 250;

  const nodes = stateArray.map((state, index) => {
    const angle = (index / stateArray.length) * 2 * Math.PI;

    const isStart = state === start;
    const isFinal = finalStates.includes(state);

    return {
      id: state,
      data: { label: state },
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
      style: {
        background: isStart ? "#065f46" : "#111827",
        color: "white",
        border: isFinal
          ? "4px double #60a5fa"
          : "2px solid #3b82f6",
        borderRadius: "50%",
        width: 70,
        height: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
      },
    };
  });

  // 🔥 KEY FIX: separate edges with spacing
  const edgeMap = {};

  const edges = transitions.map(([from, symbol, to], index) => {
    const key = `${from}-${to}`;

    if (!edgeMap[key]) edgeMap[key] = 0;
    edgeMap[key]++;

    const count = edgeMap[key];

    // 🔥 Alternate direction (up/down)
    const direction = count % 2 === 0 ? -1 : 1;

    return {
      id: `e${index}`,
      source: from,
      target: to,
      label: symbol,

      type: "smoothstep",

      // 🔥 REAL FIX (strong spacing)
      pathOptions: {
        offset: direction * Math.ceil(count / 2) * 50,
        borderRadius: 20,
      },

      markerEnd: {
        type: "arrowclosed",
      },

      style: {
        stroke: "#3b82f6",
        strokeWidth: 2,
      },

      labelStyle: {
        fill: "#ffffff",
        fontWeight: "bold",
        fontSize: 12,
      },

      labelBgStyle: {
        fill: "#000",
        fillOpacity: 0.7,
      },

      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
    };
  });

  return (
    <div style={{ height: 520 }} className="mt-6 bg-black rounded-lg">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default GraphViewer;