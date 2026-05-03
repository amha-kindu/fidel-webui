"use client";

import { GripVertical, Menu, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import ChatHistoryList from "@/components/sidebar/ChatHistoryList";
import SidebarUserPanel from "@/components/sidebar/SidebarUserPanel";
import { useAuth } from "@/components/contexts/AuthProvider";
import { resolveApiBaseUrl } from "@/lib/apiUtils.mjs";
import { useSidebarChats } from "@/components/sidebar/useSidebarChats";
import Image from 'next/image'

const DESKTOP_SIDEBAR_DEFAULT_WIDTH = 320;
const DESKTOP_SIDEBAR_MIN_WIDTH = 256;
const DESKTOP_SIDEBAR_MAX_WIDTH = 480;
const DESKTOP_CONTENT_MIN_WIDTH = 320;
const DESKTOP_SIDEBAR_STORAGE_KEY = "fidel.sidebar.desktopWidth";

function clampDesktopSidebarWidth(width) {
  const staticMaxWidth = Math.min(
    DESKTOP_SIDEBAR_MAX_WIDTH,
    Math.max(DESKTOP_SIDEBAR_MIN_WIDTH, width)
  );

  if (typeof window === "undefined") {
    return staticMaxWidth;
  }

  const viewportMaxWidth = Math.max(
    DESKTOP_SIDEBAR_MIN_WIDTH,
    Math.min(DESKTOP_SIDEBAR_MAX_WIDTH, window.innerWidth - DESKTOP_CONTENT_MIN_WIDTH)
  );

  return Math.min(viewportMaxWidth, Math.max(DESKTOP_SIDEBAR_MIN_WIDTH, width));
}

export default function Sidebar() {
  const apiUrl = resolveApiBaseUrl();
  const pageSize = Number(process.env.NEXT_PUBLIC_CH_PAGE_SIZE ?? "10");
  const { user } = useAuth();

  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [desktopWidth, setDesktopWidth] = useState(DESKTOP_SIDEBAR_DEFAULT_WIDTH);
  const [isResizingDesktop, setIsResizingDesktop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const desktopWidthRef = useRef(DESKTOP_SIDEBAR_DEFAULT_WIDTH);

  const desktopExpanded = !desktopCollapsed;
  const sidebarOpen = desktopExpanded || mobileOpen;

  const {
    cancelDelete,
    chatHistory,
    chatListError,
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
  } = useSidebarChats({
    apiUrl,
    pageSize,
    sidebarOpen,
  });

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    desktopWidthRef.current = desktopWidth;
  }, [desktopWidth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedWidthValue = window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY);
    if (storedWidthValue === null) {
      return;
    }

    const storedWidth = Number(storedWidthValue);
    if (!Number.isFinite(storedWidth)) {
      return;
    }

    const nextWidth = clampDesktopSidebarWidth(storedWidth);
    desktopWidthRef.current = nextWidth;
    setDesktopWidth(nextWidth);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !desktopExpanded) {
      return undefined;
    }

    const handleViewportResize = () => {
      const nextWidth = clampDesktopSidebarWidth(desktopWidthRef.current);
      if (nextWidth === desktopWidthRef.current) {
        return;
      }

      desktopWidthRef.current = nextWidth;
      setDesktopWidth(nextWidth);
      window.localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, String(nextWidth));
    };

    window.addEventListener("resize", handleViewportResize);
    return () => {
      window.removeEventListener("resize", handleViewportResize);
    };
  }, [desktopExpanded]);

  useEffect(() => {
    if (!isResizingDesktop || typeof window === "undefined") {
      return undefined;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const finishDesktopResize = () => {
      const nextWidth = clampDesktopSidebarWidth(desktopWidthRef.current);
      desktopWidthRef.current = nextWidth;
      setDesktopWidth(nextWidth);
      window.localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, String(nextWidth));
      setIsResizingDesktop(false);
    };

    const handleDesktopResize = (event) => {
      const nextWidth = clampDesktopSidebarWidth(event.clientX);
      if (nextWidth === desktopWidthRef.current) {
        return;
      }

      desktopWidthRef.current = nextWidth;
      setDesktopWidth(nextWidth);
    };

    window.addEventListener("pointermove", handleDesktopResize);
    window.addEventListener("pointerup", finishDesktopResize);
    window.addEventListener("pointercancel", finishDesktopResize);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleDesktopResize);
      window.removeEventListener("pointerup", finishDesktopResize);
      window.removeEventListener("pointercancel", finishDesktopResize);
    };
  }, [isResizingDesktop]);

  const toggleDesktopSidebar = useCallback(() => {
    setDesktopCollapsed((previous) => !previous);
  }, []);

  const saveDesktopWidth = useCallback((nextWidth) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, String(nextWidth));
  }, []);

  const updateDesktopWidth = useCallback(
    (nextWidth) => {
      const clampedWidth = clampDesktopSidebarWidth(nextWidth);
      desktopWidthRef.current = clampedWidth;
      setDesktopWidth(clampedWidth);
      saveDesktopWidth(clampedWidth);
    },
    [saveDesktopWidth]
  );

  const handleDesktopResizeStart = useCallback(
    (event) => {
      if (desktopCollapsed || (event.pointerType === "mouse" && event.button !== 0)) {
        return;
      }

      event.preventDefault();
      setIsResizingDesktop(true);
    },
    [desktopCollapsed]
  );

  const handleDesktopResizeKeyDown = useCallback(
    (event) => {
      if (desktopCollapsed) {
        return;
      }

      let nextWidth = desktopWidthRef.current;
      const step = event.shiftKey ? 32 : 16;

      if (event.key === "ArrowLeft") {
        nextWidth -= step;
      } else if (event.key === "ArrowRight") {
        nextWidth += step;
      } else if (event.key === "Home") {
        nextWidth = DESKTOP_SIDEBAR_MIN_WIDTH;
      } else if (event.key === "End") {
        nextWidth = DESKTOP_SIDEBAR_MAX_WIDTH;
      } else {
        return;
      }

      event.preventDefault();
      updateDesktopWidth(nextWidth);
    },
    [desktopCollapsed, updateDesktopWidth]
  );

  const handleNewChatAction = useCallback(() => {
    handleNewChat();
    closeMobileSidebar();
  }, [closeMobileSidebar, handleNewChat]);

  const handleSelectChatAction = useCallback(
    (chatId) => {
      handleSelectChat(chatId);
      closeMobileSidebar();
    },
    [closeMobileSidebar, handleSelectChat]
  );

  const renderSidebarShell = ({ expanded, isMobile = false }) => (
    <>
      <div className={`${expanded ? "" : "flex-col"} flex items-center justify-between gap-2 p-2`}>
        <button
          type="button"
          onClick={handleNewChatAction}
          className="flex min-w-0 items-center gap-2 rounded-lg p-2 focus:outline-none"
          aria-label="ወደ ውይይቶች ሂድ"
        >
          <Image 
            src="/fidel-logo.png" 
            alt="Logo"
            width="50"
            height="50" 
          />
        </button>

        <button
          type="button"
          onClick={isMobile ? closeMobileSidebar : toggleDesktopSidebar}
          className="rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          title={
            isMobile
              ? "ጎን አሞሌን ዝጋ"
              : expanded
                ? "ጎን አሞሌን ሰብስብ"
                : "ጎን አሞሌን ክፈት"
          }
        >
          {isMobile ? (
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {expanded ? (
          <div className="border-b border-gray-200/50 p-2 dark:border-gray-700/50">
            <button
              type="button"
              onClick={handleNewChatAction}
              className="brand-hover-surface flex w-full items-center gap-3 rounded-xl border border-gray-200/50 px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 dark:border-gray-700/50 dark:text-gray-300"
            >
              <Plus className="h-4 w-4" />
              አዲስ ውይይት
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleNewChatAction}
            className="brand-hover-surface m-2 flex items-center justify-center rounded-xl border border-gray-200/50 p-2 text-sm font-medium text-gray-700 transition-all duration-200 dark:border-gray-700/50 dark:text-gray-300"
            title="አዲስ ውይይት"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}

        <ChatHistoryList
          chatHistory={chatHistory}
          chatListError={chatListError}
          currentChatId={currentChatId}
          isChatListLoading={isChatListLoading}
          loadMoreRef={loadMoreRef}
          onRequestDelete={requestDeleteChat}
          onRetry={retryFetchChats}
          onSelectChat={handleSelectChatAction}
          setChatListNode={setChatListNode}
          sidebarOpen={expanded}
        />
      </div>

      <SidebarUserPanel
        setShowSettings={setShowSettings}
        showSettings={showSettings}
        sidebarOpen={expanded}
        user={user}
      />
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        data-testid="mobile-sidebar-open"
        className="fixed left-3 top-3 z-40 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200/70 bg-white/90 shadow-lg backdrop-blur-xl transition-colors hover:bg-white md:hidden dark:border-gray-700/70 dark:bg-gray-800/90 dark:hover:bg-gray-800"
        aria-label="ጎን አሞሌን ክፈት"
      >
        <Menu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
      </button>

      <aside
        data-testid="desktop-sidebar"
        className={`relative hidden h-full flex-col overflow-visible border-r border-gray-200/50 bg-white/80 backdrop-blur-xl transition-[width] ${
          isResizingDesktop ? "duration-0" : "duration-300"
        } md:flex ${
          desktopExpanded ? "" : "w-16"
        } dark:border-gray-700/50 dark:bg-gray-800/80`}
        style={desktopExpanded ? { width: `${desktopWidth}px` } : undefined}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {renderSidebarShell({ expanded: desktopExpanded })}
        </div>
        {desktopExpanded && (
          <div className="absolute inset-y-0 -right-4 -z-10 hidden w-6 items-center justify-center md:flex">
            <div
              role="separator"
              tabIndex={0}
              aria-label="Resize sidebar"
              aria-orientation="vertical"
              aria-valuemin={DESKTOP_SIDEBAR_MIN_WIDTH}
              aria-valuemax={DESKTOP_SIDEBAR_MAX_WIDTH}
              aria-valuenow={desktopWidth}
              data-testid="desktop-sidebar-resize-handle"
              onPointerDown={handleDesktopResizeStart}
              onKeyDown={handleDesktopResizeKeyDown}
              title="Resize sidebar"
              className="brand-handle relative flex h-14 w-4 cursor-col-resize items-center justify-center rounded-r-full border shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-slate-950/5 transition-all hover:scale-[1.03] focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary)/0.28)] dark:ring-white/10 dark:focus:ring-[rgb(var(--brand-secondary)/0.34)]"
            >
              <GripVertical className="h-5 w-5" />
            </div>
          </div>
        )}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="ጎን አሞሌን ዝጋ"
            onClick={closeMobileSidebar}
            className="absolute inset-0 bg-slate-900/40"
          />
          <aside
            data-testid="mobile-sidebar-panel"
            className="absolute inset-y-0 left-0 flex w-[min(22rem,calc(100vw-1rem))] max-w-full flex-col overflow-hidden border-r border-gray-200/50 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/95"
          >
            {renderSidebarShell({ expanded: true, isMobile: true })}
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="ውይይት ሰርዝ"
        message={`"${deleteTargetTitle}" የሚለውን ውይይት መሰረዝ እርግጠኛ ነዎት? ይህ እርምጃ ወደ ኋላ አይመለስም።`}
        confirmLabel="ሰርዝ"
        cancelLabel="ተው"
        onConfirm={() => void handleDeleteChat()}
        onCancel={cancelDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
