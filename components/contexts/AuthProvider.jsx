"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  clearAuth,
  fetchCurrentUser,
  getStoredAuth,
  login as loginRequest,
  signup as signupRequest,
  storeAuth,
} from "@/lib/auth";
import { getFriendlyError } from "@/lib/errorMessages";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const init = async () => {
      const { token: storedToken } = getStoredAuth();

      if (!storedToken) {
        if (isActive) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isActive) {
          setError(null);
        }

        const profile = await fetchCurrentUser(storedToken);
        if (!isActive) return;

        setToken(storedToken);
        setUser(profile);
        storeAuth(storedToken, profile);
      } catch (err) {
        if (!isActive) return;

        setError(getFriendlyError(err, { action: "መለያዎን ለመጫን" }));
        clearAuth();
        setToken(null);
        setUser(null);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      isActive = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    setLoading(true);

    try {
      const { token: newToken, user: newUser } = await loginRequest(credentials);
      setToken(newToken);
      setUser(newUser);
      return true;
    } catch (err) {
      setError(getFriendlyError(err, { action: "ለመግባት" }));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (payload) => {
    setError(null);
    setLoading(true);

    try {
      const { token: newToken, user: newUser } = await signupRequest(payload);
      setToken(newToken);
      setUser(newUser);
      return true;
    } catch (err) {
      setError(getFriendlyError(err, { action: "መለያ ለመፍጠር" }));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setError(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      error,
      setError,
      login,
      signup,
      logout,
    }),
    [error, loading, login, logout, signup, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
