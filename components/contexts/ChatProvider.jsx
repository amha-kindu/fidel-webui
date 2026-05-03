"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/contexts/AuthProvider";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const pageInfo = useRef({});
  const [messages, setMessages] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [draftInput, setDraftInput] = useState("");

  const resetChatState = useCallback(() => {
    pageInfo.current = {};
    setMessages({});
    setChatHistory([]);
    setCurrentChatId(null);
    setDraftInput("");
  }, []);

  useEffect(() => {
    if (!user) {
      resetChatState();
    }
  }, [resetChatState, user]);

  const value = useMemo(
    () => ({
      chatHistory,
      setChatHistory,
      messages,
      setMessages,
      currentChatId,
      setCurrentChatId,
      draftInput,
      setDraftInput,
      pageInfo,
      resetChatState,
    }),
    [chatHistory, currentChatId, draftInput, messages, resetChatState]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
