import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/contexts/AuthProvider";

export default function LoginForm() {
  const router = useRouter();
  const { login, signup, setError: setAuthError, loading } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSignup = mode === "signup";

  const handleSubmit = async (payload) => {
    const success = isSignup ? await signup(payload) : await login(payload);

    if (success) {
      router.replace("/chats");
    }
  };

  return (
    <form
      data-testid="auth-form"
      onSubmit={async (event) => {
        event.preventDefault();
        await handleSubmit({ email, password });
      }}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-xl backdrop-blur-xl dark:border-gray-700 dark:bg-gray-800/90 sm:max-w-md sm:p-6"
    >
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {isSignup ? "መለያ ፍጠር" : "ግባ"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSignup ? "ፊደል ቻትን ለመጠቀም መለያዎን ይፍጠሩ።" : "ወደ ውይይቶችዎ በደህና ይግቡ።"}
        </p>
      </div>

      <label className="block">
        <span className="text-sm text-gray-700 dark:text-gray-300">ኢሜይል</span>
        <input
          data-testid="auth-email-input"
          type="email"
          value={email}
          autoComplete="email"
          disabled={loading}
          onChange={(event) => {
            setAuthError(null);
            setEmail(event.target.value);
          }}
          required
          className="brand-input-focus mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-700 dark:text-gray-300">የይለፍ ቃል</span>
        <input
          data-testid="auth-password-input"
          type="password"
          value={password}
          autoComplete={isSignup ? "new-password" : "current-password"}
          disabled={loading}
          onChange={(event) => {
            setAuthError(null);
            setPassword(event.target.value);
          }}
          required
          className="brand-input-focus mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
      </label>

      <button
        type="submit"
        data-testid="auth-submit-button"
        disabled={loading}
        className="brand-button w-full rounded-lg py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading
          ? isSignup
            ? "መለያ በመፍጠር ላይ..."
            : "በመግባት ላይ..."
          : isSignup
            ? "መለያ ፍጠር"
            : "ግባ"}
      </button>

      <button
        type="button"
        data-testid="auth-back-button"
        onClick={() => router.push("/chats")}
        className="w-full rounded-lg border border-gray-200 py-2 text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        ወደ ውይይቶች ተመለስ
      </button>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        {isSignup ? "መለያ አለዎት?" : "አዲስ ነዎት?"}{" "}
        <button
          type="button"
          data-testid="auth-mode-toggle"
          onClick={() => setMode(isSignup ? "signin" : "signup")}
          className="brand-link font-semibold hover:underline"
        >
          {isSignup ? "ግባ" : "መለያ ፍጠር"}
        </button>
      </div>
    </form>
  );
}
