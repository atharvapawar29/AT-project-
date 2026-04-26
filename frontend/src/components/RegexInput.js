import React, { useState, useEffect } from "react";

const RegexInputCard = () => {
  const [regex, setRegex] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">

      {/* 🔮 Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black opacity-90 animate-pulse"></div>

      {/* 🔵 Blur Glow Orbs */}
      <div className="absolute w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 top-10 left-10 animate-bounce"></div>
      <div className="absolute w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-20 bottom-10 right-10 animate-pulse"></div>

      {/* ✨ Card */}
      <div
        className={`relative z-10 w-full max-w-xl p-8 rounded-3xl 
        bg-white/10 backdrop-blur-lg border border-white/20 
        shadow-[0_0_40px_rgba(0,0,255,0.3)] 
        transition-all duration-700 
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >

        {/* 🧠 Title */}
        <h1 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Regex → DFA Converter
        </h1>

        {/* ✏️ Input */}
        <input
          type="text"
          value={regex}
          onChange={(e) => setRegex(e.target.value)}
          placeholder="Enter regex (e.g., a+b)"
          className="w-full p-4 rounded-xl bg-black/40 text-white border border-gray-600 
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
          transition duration-300 mb-6 placeholder-gray-400"
        />

        {/* 🚀 Buttons */}
        <div className="flex justify-center gap-4">

          {/* Convert */}
          <button
            className="px-6 py-3 rounded-xl font-semibold text-white 
            bg-gradient-to-r from-blue-500 to-purple-600 
            hover:brightness-125 hover:scale-105 
            transition duration-300 shadow-[0_0_15px_rgba(139,92,246,0.6)]"
          >
            Convert
          </button>

          {/* Clear */}
          <button
            onClick={() => setRegex("")}
            className="px-6 py-3 rounded-xl text-gray-200 
            bg-white/10 backdrop-blur-md border border-white/20 
            hover:bg-white/20 hover:scale-105 
            transition duration-300"
          >
            Clear
          </button>

        </div>
      </div>
    </div>
  );
};

export default RegexInputCard;