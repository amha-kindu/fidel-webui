"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/contexts/AuthProvider";
import { useChat } from "@/components/contexts/ChatProvider";
import { useRequestState } from "@/components/contexts/RequestStateProvider";
import { useIntersectionObserver } from "@/components/hooks/IntersectionObserver";
import { usePreserveScrollPosition } from "@/components/hooks/ScrollAnchor";
import { createBearerHeaders, isAbortError, readResponseErrorMessage } from "@/lib/apiUtils.mjs";
import { mergeMessages, normalizeMessageListResponse } from "@/lib/chatData.mjs";
import { createHttpError, getFriendlyError } from "@/lib/errorMessages";

export function useMessageHistory({ apiUrl, chatId, scrollRef, scrollRoot }) {
  const { user, token } = useAuth();
  const { isProcessing } = useRequestState();
  const { messages, setMessages, currentChatId, pageInfo } = useChat();

  const pageSize = Number(process.env.NEXT_PUBLIC_PAGE_SIZE ?? "10");
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const bottomRef = useRef(null);
  const autoScrollRef = useRef(true);
  const requestRef = useRef({ key: null, controller: null });
  const activeChatIdRef = useRef(null);

  const activeChatId = chatId ?? currentChatId;
  const currentMessages = activeChatId ? messages[activeChatId] || [] : [];
  const lastMessage = currentMessages[currentMessages.length - 1] || null;
  const shouldShowTypingIndicator =
    isProcessing && (!lastMessage || lastMessage.role !== "assistant");
  const lastMessageSignature = lastMessage
    ? `${lastMessage.id}:${lastMessage.content}:${lastMessage.done}`
    : "";

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const snapshotScrollPosition = usePreserveScrollPosition({
    listRef: scrollRef,
    key: activeChatId,
    dep: currentMessages.length,
  });

  const fetchMessages = useCallback(
    async ({ offset = 0, replace = false } = {}) => {
      if (!user || !token || !apiUrl || !activeChatId) return;

      requestRef.current.controller?.abort();

      const controller = new AbortController();
      const requestKey = `${activeChatId}-${offset}-${Date.now()}`;
      const requestedChatId = activeChatId;

      requestRef.current = { key: requestKey, controller };
      setMessagesError(null);
      setIsMessagesLoading(true);

      try {
        const response = await fetch(
          `${apiUrl}/chats/${requestedChatId}?limit=${pageSize}&offset=${offset}`,
          {
            headers: createBearerHeaders(token),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const detail = await readResponseErrorMessage(
            response,
            "Failed to fetch chat messages"
          );
          throw createHttpError(response.status, detail);
        }

        const payload = await response.json();
        if (
          requestRef.current.key !== requestKey ||
          requestedChatId !== activeChatIdRef.current
        ) {
          return;
        }

        const { items, total } = normalizeMessageListResponse(payload);
        const nextOffset = offset + items.length;

        setMessages((previous) => ({
          ...previous,
          [requestedChatId]: replace
            ? mergeMessages([], items)
            : mergeMessages(previous[requestedChatId] || [], items),
        }));

        pageInfo.current = {
          ...pageInfo.current,
          [requestedChatId]: {
            offset: nextOffset,
            hasMore: nextOffset < total,
            initialized: true,
          },
        };
      } catch (error) {
        if (isAbortError(error)) return;

        const safeError =
          error?.status ? error : new Error("Network error while loading messages.");
        setMessagesError(getFriendlyError(safeError, { action: "መልእክቶችን ለመጫን" }));
      } finally {
        if (requestRef.current.key === requestKey) {
          requestRef.current = { key: null, controller: null };
          setIsMessagesLoading(false);
        }
      }
    },
    [activeChatId, apiUrl, pageInfo, pageSize, setMessages, token, user]
  );

  useEffect(() => {
    return () => {
      requestRef.current.controller?.abort();
    };
  }, []);

  useEffect(() => {
    setMessagesError(null);
    requestRef.current.controller?.abort();

    if (!activeChatId) return;

    const currentPage = pageInfo.current[activeChatId];
    if (currentPage?.initialized || currentMessages.length > 0) return;

    void fetchMessages({ offset: 0, replace: true });
  }, [activeChatId, currentMessages.length, fetchMessages, pageInfo]);

  const loadMoreRef = useIntersectionObserver({
    root: scrollRoot,
    enabled:
      Boolean(scrollRoot) &&
      Boolean(activeChatId) &&
      currentMessages.length > 0 &&
      !isMessagesLoading &&
      Boolean(pageInfo.current[activeChatId]?.hasMore),
    rootMargin: "160px",
    threshold: 0.1,
    onIntersect: () => {
      const currentPage = pageInfo.current[activeChatId] || {
        offset: 0,
        hasMore: false,
      };

      if (!activeChatId || !currentPage.hasMore || isMessagesLoading) return;

      if (currentPage.offset !== 0) {
        autoScrollRef.current = false;
        snapshotScrollPosition();
      }

      void fetchMessages({ offset: currentPage.offset, replace: false });
    },
  });

  useEffect(() => {
    if (!activeChatId || !scrollRef.current) return;

    if (!autoScrollRef.current) {
      autoScrollRef.current = true;
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, currentMessages.length, lastMessageSignature, scrollRef]);

  const retryMessages = useCallback(() => {
    void fetchMessages({ offset: 0, replace: true });
  }, [fetchMessages]);

  return {
    bottomRef,
    currentMessages,
    isMessagesLoading,
    loadMoreRef,
    messagesError,
    retryMessages,
    shouldShowTypingIndicator,
  };
}
