"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BrandedLoadingScreen from "@/components/common/BrandedLoadingScreen";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/components/contexts/AuthProvider";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/chats");
  }, [loading, user, router]);

  if (loading) {
    return (
      <BrandedLoadingScreen
        className="min-h-[100dvh]"
        message="የመግቢያ ሁኔታዎን በመጫን ላይ..."
      />
    );
  }

  return (
    <div className="brand-shell flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
      <LoginForm />
    </div>
  );
}
