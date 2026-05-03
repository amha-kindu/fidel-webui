"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/contexts/AuthProvider";
import { useChat } from "@/components/contexts/ChatProvider";
import { useIntersectionObserver } from "@/components/hooks/IntersectionObserver";
import { createBearerHeaders, isAbortError, readResponseErrorMessage } from "@/lib/apiUtils.mjs";
import { mergeChatSummaries, normalizeChatListResponse } from "@/lib/chatData.mjs";
import { createHttpError, getFriendlyError } from "@/lib/errorMessages";

export function useSidebarChats({ apiUrl, pageSize, sidebarOpen }) {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const { chatHistory, setChatHistory, currentChatId, setCurrentChatId, setMessages } = useChat();

  const [chatListError, setChatListError] = useState(null);
  const [isChatListLoading, setIsChatListLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [chatListNode, setChatListNode] = useState(null);

  const initializedRef = useRef(false);
  const pageInfoRef = useRef({ offset: 0, hasMore: true });
  const requestRef = useRef({ key: null, controller: null });

  const fetchChats = useCallback(
    async ({ offset = 0, replace = false } = {}) => {
      if (!user || !token || !apiUrl) return;

      requestRef.current.controller?.abort();

      const controller = new AbortController();
      const requestKey = `chat-list-${offset}-${Date.now()}`;
      requestRef.current = { key: requestKey, controller };

      setChatListError(null);
      setIsChatListLoading(true);

      try {
        const response = await fetch(`${apiUrl}/chats?limit=${pageSize}&offset=${offset}`, {
          headers: createBearerHeaders(token),
          signal: controller.signal,
        });

        if (!response.ok) {
          const detail = await readResponseErrorMessage(response, "Failed to fetch chats");
          throw createHttpError(response.status, detail);
        }

        const payload = await response.json();
        if (requestRef.current.key !== requestKey) return;

        const { items, total } = normalizeChatListResponse(payload);
        const nextOffset = offset + items.length;

        setChatHistory((previous) => (replace ? items : mergeChatSummaries(previous, items)));

        pageInfoRef.current = {
          offset: nextOffset,
          hasMore: nextOffset < total,
        };
      } catch (error) {
        if (isAbortError(error)) return;

        const safeError =
          error?.status ? error : new Error("Network error while loading chats.");
        setChatListError(getFriendlyError(safeError, { action: "ውይይቶችን ለመጫን" }));
      } finally {
        if (requestRef.current.key === requestKey) {
          requestRef.current = { key: null, controller: null };
          setIsChatListLoading(false);
        }
      }
    },
    [apiUrl, pageSize, setChatHistory, token, user]
  );

  useEffect(() => {
    initializedRef.current = false;
    pageInfoRef.current = { offset: 0, hasMore: true };
    requestRef.current.controller?.abort();
  }, [token, user?.email]);

  useEffect(() => {
    if (loading || !user || !token || initializedRef.current) return;

    initializedRef.current = true;
    void fetchChats({ offset: 0, replace: true });
  }, [fetchChats, loading, token, user]);

  useEffect(() => {
    return () => {
      requestRef.current.controller?.abort();
    };
  }, []);

  const loadMoreRef = useIntersectionObserver({
    root: chatListNode,
    enabled:
      Boolean(chatListNode) &&
      sidebarOpen &&
      !isChatListLoading &&
      pageInfoRef.current.hasMore &&
      chatHistory.length > 0,
    rootMargin: "160px",
    threshold: 0.1,
    onIntersect: () => {
      if (!isChatListLoading && pageInfoRef.current.hasMore) {
        void fetchChats({ offset: pageInfoRef.current.offset, replace: false });
      }
    },
  });

  const handleNewChat = useCallback(() => {
    setChatListError(null);
    setCurrentChatId(null);
    router.push("/chats");
  }, [router, setCurrentChatId]);

  const handleSelectChat = useCallback(
    (chatId) => {
      setCurrentChatId(chatId);
      router.push(`/chats/${chatId}`);
    },
    [router, setCurrentChatId]
  );

  const requestDeleteChat = useCallback((chatId, chatTitle) => {
    setDeleteTargetId(chatId);
    setDeleteTargetTitle(chatTitle || "ይህን ውይይት");
  }, []);

  const cancelDelete = useCallback(() => {
    if (isDeleting) return;

    setDeleteTargetId(null);
    setDeleteTargetTitle("");
  }, [isDeleting]);

  const handleDeleteChat = useCallback(async () => {
    if (!deleteTargetId) return;

    if (!apiUrl) {
      setChatListError(getFriendlyError(new Error("NEXT_PUBLIC_API_URL is not set.")));
      return;
    }

    setIsDeleting(true);
    setChatListError(null);

    try {
      const response = await fetch(`${apiUrl}/chats/${deleteTargetId}`, {
        method: "DELETE",
        headers: createBearerHeaders(token),
      });

      if (!response.ok && response.status !== 404) {
        const detail = await readResponseErrorMessage(response, "Failed to delete chat");
        throw createHttpError(response.status, detail);
      }

      setChatHistory((previous) => previous.filter((chat) => chat.id !== deleteTargetId));
      setMessages((previous) => {
        const next = { ...previous };
        delete next[deleteTargetId];
        return next;
      });

      if (currentChatId === deleteTargetId) {
        setCurrentChatId(null);
        router.replace("/chats");
      }

      setDeleteTargetId(null);
      setDeleteTargetTitle("");
    } catch (error) {
      const safeError =
        error?.status ? error : new Error("Network error while deleting this chat.");
      setChatListError(getFriendlyError(safeError, { action: "ውይይቱን ለመሰረዝ" }));
    } finally {
      setIsDeleting(false);
    }
  }, [
    apiUrl,
    currentChatId,
    deleteTargetId,
    router,
    setChatHistory,
    setCurrentChatId,
    setMessages,
    token,
  ]);

  const retryFetchChats = useCallback(() => {
    void fetchChats({ offset: 0, replace: true });
  }, [fetchChats]);

  return {
    cancelDelete,
    chatHistory,
    chatListError,
    chatListNode,
    currentChatId,
    deleteTargetId,
    deleteTargetTitle,
    handleDeleteChat,
    handleNewChat,
    handleSelectChat,
    isChatListLoading,
    isDeleting,
    loadMoreRef,
    requestDeleteChat,
    retryFetchChats,
    setChatListNode,
  };
}
