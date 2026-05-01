"use client";

import { useState, useCallback, useMemo } from "react";
import { getProfile, clearToken as apiClearToken } from "./api";

export interface User {
  token: string;
  userId: string;
  generations_left?: number;
  referral_code?: string;
  api_token?: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("labgen_user");
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        return null;
      }
    }
    return null;
  });

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("labgen_user");
    }
    apiClearToken();
    setUser(null);
  }, []);

  const saveUser = useCallback((u: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("labgen_user", JSON.stringify(u));
    }
    setUser(u);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUser(prev => {
        if (!prev) return null;
        const updated = { 
          ...prev, 
          generations_left: profile.generations_left,
          referral_code: profile.referral_code,
          api_token: profile.api_token
        };
        localStorage.setItem("labgen_user", JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      console.error("Sync profile failed:", err);
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        logout();
      }
    }
  }, [logout]);

  return useMemo(() => ({
    user,
    saveUser,
    logout,
    refreshProfile
  }), [user, saveUser, logout, refreshProfile]);
}
