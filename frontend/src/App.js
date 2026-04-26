import React from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import { ConversionProvider } from "./context/ConversionContext";
import HomePage from "./pages/HomePage";
import JourneyPage from "./pages/JourneyPage";
import ReToEnfaPage from "./pages/ReToEnfaPage";
import EnfaToNfaPage from "./pages/EnfaToNfaPage";
import NfaToDfaPage from "./pages/NfaToDfaPage";
import DfaSimulatorPage from "./pages/DfaSimulatorPage";

function App() {
  return (
    <BrowserRouter>
      <ConversionProvider>
        <main className="learning-shell">
          <header className="card top-nav-card">
            <h1 className="top-brand">Automata Lab</h1>
            <nav className="top-nav-links">
              <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Home
              </NavLink>
              <NavLink to="/journey" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Journey
              </NavLink>
              <NavLink to="/re-to-enfa" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                RE to epsilon-NFA
              </NavLink>
              <NavLink to="/enfa-to-nfa" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                epsilon-NFA to NFA
              </NavLink>
              <NavLink to="/nfa-to-dfa" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                NFA to DFA
              </NavLink>
              <NavLink to="/dfa-simulator" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                DFA Simulator
              </NavLink>
            </nav>
          </header>

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/journey" element={<JourneyPage />} />
            <Route path="/re-to-enfa" element={<ReToEnfaPage />} />
            <Route path="/enfa-to-nfa" element={<EnfaToNfaPage />} />
            <Route path="/nfa-to-dfa" element={<NfaToDfaPage />} />
            <Route path="/dfa-simulator" element={<DfaSimulatorPage />} />
          </Routes>
        </main>
      </ConversionProvider>
    </BrowserRouter>
  );
}

export default App;