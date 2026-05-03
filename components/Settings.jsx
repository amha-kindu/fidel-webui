"use client";

import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";

import Portal from "@/components/Portal";
import { useAuth } from "@/components/contexts/AuthProvider";
import { useTheme } from "@/components/contexts/ThemeProvider";

export default function UserSettings({ setShowSettings }) {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999]">
        <div className="absolute inset-0" onClick={() => setShowSettings(false)} />
        <div className="absolute bottom-20 left-4 right-4 w-auto rounded-xl border border-gray-200 bg-white py-2 shadow-xl backdrop-blur-xl dark:border-gray-600 dark:bg-gray-800 sm:bottom-16 sm:right-auto sm:w-72">
          <div className="border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-600 dark:text-gray-400">
            ቅንብሮች
          </div>

          <button
            type="button"
            data-testid="theme-light-button"
            onClick={() => {
              setTheme("light");
              setShowSettings(false);
            }}
            className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
              theme === "light"
                ? "brand-selected-control"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            <Sun className="h-4 w-4" />
            ብርሃናማ መልክ
          </button>

          <button
            type="button"
            data-testid="theme-dark-button"
            onClick={() => {
              setTheme("dark");
              setShowSettings(false);
            }}
            className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
              theme === "dark"
                ? "brand-selected-control"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            <Moon className="h-4 w-4" />
            ጨለማ መልክ
          </button>

          <button
            type="button"
            data-testid="theme-system-button"
            onClick={() => {
              setTheme("system");
              setShowSettings(false);
            }}
            className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
              theme === "system"
                ? "brand-selected-control"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            <Monitor className="h-4 w-4" />
            የሲስተም መልክ
          </button>

          <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-600">
            <button
              type="button"
              data-testid="logout-button"
              onClick={() => {
                logout();
                setShowSettings(false);
                router.replace("/auth");
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              ውጣ
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
