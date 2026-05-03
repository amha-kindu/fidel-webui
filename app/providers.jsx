"use client";

import { AuthProvider } from "@/components/contexts/AuthProvider";
import AuthErrorBanner from "@/components/auth/AuthErrorBanner";
import { ChatProvider } from "@/components/contexts/ChatProvider";
import { ThemeProvider } from "@/components/contexts/ThemeProvider";
import { RequestStateProvider } from "@/components/contexts/RequestStateProvider";

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthErrorBanner />
        <RequestStateProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </RequestStateProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
