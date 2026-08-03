"use client";

import { useEffect, useRef } from "react";
import { useAuthStore, setupAxiosInterceptors } from "@/store/authStore";
import axios from "axios";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setupDone = useRef(false);

  useEffect(() => {
    if (setupDone.current) return;
    setupDone.current = true;

    // 1. Setup axios interceptors (must be first)
    setupAxiosInterceptors();

    // 2. Immediately rehydrate Authorization header from persisted store
    const { accessToken, isAuthenticated, refreshToken, logout } = useAuthStore.getState();

    if (isAuthenticated && accessToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      // 3. Proactively refresh the token on page load
      //    This prevents the first API call from failing with a 401 if the
      //    15-min access token has already expired but the 7-day refresh is valid
      refreshToken().catch(() => {
        // If refresh fails, clear auth state (token truly expired)
        logout();
      });
    }

    // 4. Set up proactive token refresh — refresh 2 minutes before expiry
    //    Access token is 15 min → refresh every 13 min
    const REFRESH_INTERVAL_MS = 13 * 60 * 1000;
    const interval = setInterval(async () => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated) {
        clearInterval(interval);
        return;
      }
      await state.refreshToken();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
