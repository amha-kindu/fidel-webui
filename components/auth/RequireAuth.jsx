"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import BrandedLoadingScreen from "@/components/common/BrandedLoadingScreen";
import { useAuth } from "@/components/contexts/AuthProvider";

export default function RequireAuth({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <BrandedLoadingScreen
        className="min-h-[100dvh]"
        message="መለያዎን በማረጋገጥ ላይ..."
      />
    );
  }

  if (!user) {
    return null;
  }

  return children;
}
