"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/contexts/AuthProvider";
import { useChat } from "@/components/contexts/ChatProvider";
import { useRequestState } from "@/components/contexts/RequestStateProvider";
import { isAbortError } from "@/lib/apiUtils.mjs";
import {
  mergeMessages,
  normalizeChatSummary,
  normalizeMessage,
  upsertChatSummary,
} from "@/lib/chatData.mjs";
import { getFriendlyError } from "@/lib/errorMessages";
import { normalizeStreamPayload } from "@/lib/chatStream.mjs";
import { sendChatRequest } from "@/lib/chatApi";

const PENDING_CHAT_PREFIX = "__pending__-";

function createPendingChatId(timestamp) {
  return `${PENDING_CHAT_PREFIX}${timestamp}`;
}

function isPendingChatId(chatId) {
  return typeof chatId === "string" && chatId.startsWith(PENDING_CHAT_PREFIX);
}

export function useChatComposer({ apiUrl, chatIdParam, selectedModel }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user } = useAuth();
  const { setChatHistory, messages, setMessages, currentChatId, setCurrentChatId } = useChat();
  const {
    isFetching,
    setIsFetching,
    setError,
    isProcessing,
    setIsProcessing,
    abortController,
    setAbortController,
  } = useRequestState();

  const [pendingChatId, setPendingChatId] = useState(null);
  const activeRequestKeyRef = useRef(null);
  const currentMessagesRef = useRef([]);
  const pathnameRef = useRef(pathname);

  const activeChatId = pendingChatId ?? chatIdParam ?? currentChatId;
  const currentMessages = useMemo(
    () => (activeChatId ? messages[activeChatId] || [] : []),
    [activeChatId, messages]
  );

  useEffect(() => {
    currentMessagesRef.current = currentMessages;
  }, [currentMessages]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    setCurrentChatId(chatIdParam ?? null);
  }, [chatIdParam, setCurrentChatId]);

  useEffect(() => {
    if (chatIdParam) {
      setPendingChatId(null);
      return;
    }

    if (!isFetching) {
      setPendingChatId(null);
    }
  }, [chatIdParam, isFetching]);

  const handleSend = useCallback(
    async (userText) => {
      if (!userText.trim()) return false;
      if (isFetching || isProcessing) return false;

      if (!user || !token) {
        setError("ለመወያየት እባክዎ በመለያዎ ይግቡ።");
        return false;
      }

      setError(null);

      const controller = new AbortController();
      const requestStartedAt = Date.now();
      const requestKey = `${requestStartedAt}-${Math.random().toString(36).slice(2)}`;
      const routeChatId = chatIdParam && !isPendingChatId(chatIdParam) ? chatIdParam : null;
      const stableCurrentChatId =
        currentChatId && !isPendingChatId(currentChatId) ? currentChatId : null;
      const optimisticCurrentChatId =
        currentChatId && isPendingChatId(currentChatId) ? currentChatId : null;
      const persistedChatId = routeChatId || stableCurrentChatId;
      const optimisticChatId =
        persistedChatId ||
        pendingChatId ||
        optimisticCurrentChatId ||
        createPendingChatId(requestStartedAt);
      const optimisticAssistantMessageId = `assistant-${optimisticChatId}-${requestStartedAt}`;
      const optimisticUserMessage = normalizeMessage(
        {
          id: `user-${optimisticChatId}-${requestStartedAt}`,
          role: "user",
          content: userText,
          createdAt: requestStartedAt,
          done: true,
        },
        0
      );

      let assistantContent = "";
      let assistantMessageId = optimisticAssistantMessageId;
      let assistantCreatedAt = optimisticUserMessage.createdAt + 1;
      let hasNavigatedToRoute = false;

      activeRequestKeyRef.current = requestKey;
      setAbortController(controller);
      setIsFetching(true);
      setIsProcessing(true);
      setMessages((previous) => ({
        ...previous,
        [optimisticChatId]: mergeMessages(previous[optimisticChatId] || [], [optimisticUserMessage]),
      }));

      if (!persistedChatId) {
        setPendingChatId(optimisticChatId);
        setCurrentChatId(optimisticChatId);
      }

      void (async () => {
        try {
          await sendChatRequest({
            apiUrl,
            message: userText,
            chatId: persistedChatId,
            model: selectedModel,
            token,
            signal: controller.signal,
            maxHistory: 20,
            onPayload: (payload) => {
              if (activeRequestKeyRef.current !== requestKey) return;

              const normalized = normalizeStreamPayload(payload);
              if (!normalized) return;

              assistantContent += normalized.content;
              const previousAssistantMessageId = assistantMessageId;

              if (normalized.id) {
                assistantMessageId = normalized.id;
              }

              assistantCreatedAt = Math.max(
                assistantCreatedAt,
                normalized.createdAt,
                optimisticUserMessage.createdAt + 1
              );

              const chatId = normalized.chatInfo.id;
              const route = `/chats/${chatId}`;
              const assistantMessage = normalizeMessage(
                {
                  id: assistantMessageId,
                  role: "assistant",
                  content: assistantContent,
                  createdAt: assistantCreatedAt,
                  done: normalized.done,
                },
                0
              );
              const nextMessages = assistantContent || normalized.done ? [assistantMessage] : [];

              setCurrentChatId(chatId);
              setPendingChatId(null);
              setMessages((previous) => {
                const sourceMessages = previous[optimisticChatId] || [];
                const baseMessages =
                  optimisticChatId === chatId
                    ? sourceMessages
                    : mergeMessages(previous[chatId] || [], sourceMessages);
                const nextBaseMessages =
                  previousAssistantMessageId === assistantMessageId
                    ? baseMessages
                    : baseMessages.filter(
                        (message) => message.id !== previousAssistantMessageId
                      );
                const next = {
                  ...previous,
                  [chatId]: mergeMessages(nextBaseMessages, nextMessages),
                };

                if (optimisticChatId !== chatId) {
                  delete next[optimisticChatId];
                }

                return next;
              });

              setChatHistory((previous) =>
                upsertChatSummary(
                  previous,
                  normalizeChatSummary({
                    id: chatId,
                    title: normalized.chatInfo.title,
                    lastMessage: assistantContent,
                    updatedAt: normalized.createdAt,
                  })
                )
              );

              if (!hasNavigatedToRoute && pathnameRef.current !== route) {
                hasNavigatedToRoute = true;
                pathnameRef.current = route;
                router.replace(route);
              }
            },
          });
        } catch (errorValue) {
          if (isAbortError(errorValue)) {
            setError(null);
          } else {
            setError(getFriendlyError(errorValue, { action: "መልእክት ለመላክ­" }));
          }
        } finally {
          if (activeRequestKeyRef.current === requestKey) {
            activeRequestKeyRef.current = null;
          }

          setIsFetching(false);
          setIsProcessing(false);
          setAbortController(null);
        }
      })();

      return true;
    },
    [
      apiUrl,
      chatIdParam,
      currentChatId,
      isFetching,
      isProcessing,
      pendingChatId,
      router,
      selectedModel,
      setAbortController,
      setChatHistory,
      setCurrentChatId,
      setError,
      setIsFetching,
      setIsProcessing,
      setMessages,
      token,
      user,
    ]
  );

  const handleRegenerate = useCallback(
    (assistantIndex) => {
      const userMessage = currentMessagesRef.current[assistantIndex - 1];
      if (!userMessage || userMessage.role !== "user") return;

      void handleSend(userMessage.content);
    },
    [handleSend]
  );

  const handleStop = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
    setIsProcessing(false);
  }, [abortController, setIsProcessing]);

  return {
    activeChatId,
    handleRegenerate,
    handleSend,
    handleStop,
  };
}
