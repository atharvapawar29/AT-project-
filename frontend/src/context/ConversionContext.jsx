import React, { createContext, useContext, useMemo, useState } from "react";
import axios from "axios";
import { formatSubset, relabelAutomaton } from "../utils/automataView";

const ConversionContext = createContext(null);
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export const CLEAN_EXAMPLES = ["a", "ab", "a|b", "(a|b)*abb", "a*b", "(ab|ba)(a|b)"];

export function ConversionProvider({ children }) {
  const [regex, setRegex] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const convert = async () => {
    if (!regex.trim()) {
      setError("Regex cannot be empty.");
      setResult(null);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/convert`, { regex });
      setResult(response.data);
    } catch (err) {
      const message = err?.response?.data?.detail || "Conversion failed. Check regex format.";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setRegex("");
    setResult(null);
    setError("");
  };

  const converted = useMemo(() => {
    if (!result) {
      return null;
    }

    const epsilon = relabelAutomaton(result.epsilon_nfa, result.tuples?.epsilon_nfa);
    const nfa = relabelAutomaton(result.nfa, result.tuples?.nfa);
    const dfa = relabelAutomaton(result.dfa, result.tuples?.dfa);

    const dfaStateSets = Object.entries(result.dfa_state_sets || {}).map(([dfaState, nfaSubset]) => ({
      dfaState: dfa.map[dfaState] || dfaState,
      nfaSubset: (nfaSubset || []).map((state) => nfa.map[state] || state),
    }));

    const dfaBuildSteps = (result.dfa_build_steps || []).map((step) => {
      const fromSubset = (step.from_subset || []).map((state) => nfa.map[state] || state);
      const toSubset = (step.to_subset || []).map((state) => nfa.map[state] || state);

      return {
        ...step,
        from_label: formatSubset(fromSubset),
        to_label: formatSubset(toSubset),
      };
    });

    return {
      input: result.input,
      with_concat: result.with_concat,
      postfix: result.postfix,
      alphabet: result.alphabet || [],
      epsilon,
      nfa,
      dfa,
      dfaStateSets,
      dfaBuildSteps,
    };
  }, [result]);

  return (
    <ConversionContext.Provider
      value={{
        regex,
        setRegex,
        loading,
        error,
        convert,
        reset,
        converted,
      }}
    >
      {children}
    </ConversionContext.Provider>
  );
}

export function useConversion() {
  const context = useContext(ConversionContext);
  if (!context) {
    throw new Error("useConversion must be used within ConversionProvider");
  }
  return context;
}
