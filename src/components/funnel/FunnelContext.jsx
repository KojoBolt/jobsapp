import { createContext, useContext, useState } from 'react';

const FunnelContext = createContext(null);

/**
 * Wraps the entire /start route tree. Holds every quiz answer in memory
 * so checkout/upsell/downsell pages can read e.g. answers.personalize.email
 * without prop-drilling or re-fetching anything.
 */
export function FunnelProvider({ children }) {
  const [answers, setAnswers] = useState({});

  const setAnswer = (stepId, value) => {
    setAnswers((prev) => ({ ...prev, [stepId]: value }));
  };

  const reset = () => setAnswers({});

  return (
    <FunnelContext.Provider value={{ answers, setAnswer, reset }}>
      {children}
    </FunnelContext.Provider>
  );
}

export function useFunnel() {
  const ctx = useContext(FunnelContext);
  if (!ctx) {
    throw new Error('useFunnel must be used inside <FunnelProvider>');
  }
  return ctx;
}
