"use client";

import { Settings, User } from "lucide-react";

import UserSettings from "@/components/Settings";

export default function SidebarUserPanel({
  setShowSettings,
  showSettings,
  sidebarOpen,
  user,
}) {
  return (
    <div className="relative border-t border-gray-200/50 p-2 dark:border-gray-700/50">
      {sidebarOpen ? (
        <div className="relative flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
          <div className="brand-gradient flex h-8 w-8 items-center justify-center rounded-full">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.name || "ፊደል ተጠቃሚ"}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {user?.email || "በመለያ ገብተዋል"}
            </p>
          </div>
          <button
            type="button"
            data-testid="settings-button"
            onClick={() => setShowSettings((previous) => !previous)}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
            title="ቅንብሮችን ክፈት"
          >
            <Settings className="h-4 w-4 text-gray-400" />
          </button>

          {showSettings && <UserSettings setShowSettings={setShowSettings} />}
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            type="button"
            data-testid="settings-button"
            onClick={() => setShowSettings((previous) => !previous)}
            className="brand-gradient flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-opacity hover:opacity-90"
            title="ቅንብሮችን ክፈት"
          >
            <User className="h-5 w-5 text-white" />
          </button>

          {showSettings && <UserSettings setShowSettings={setShowSettings} />}
        </div>
      )}
    </div>
  );
}
