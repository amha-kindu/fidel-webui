"use client";

import { createContext, useContext, useMemo, useState } from "react";

const RequestState = createContext();

export function RequestStateProvider({ children }) {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const value = useMemo(
    () => ({
      isFetching,
      setIsFetching,
      error,
      setError,
      abortController,
      setAbortController,
      isProcessing,
      setIsProcessing,
    }),
    [abortController, error, isFetching, isProcessing]
  );

  return <RequestState.Provider value={value}>{children}</RequestState.Provider>;
}

export function useRequestState() {
  const ctx = useContext(RequestState);
  if (!ctx) throw new Error("useRequestState must be used within RequestStateProvider");
  return ctx;
}
