// ============================================================
// Global Auth Store — Zustand with persistent auth
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { IUser } from "@/types";
import axios from "axios";

interface AuthState {
  user:            IUser | null;
  accessToken:     string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  // Actions
  login:        (user: IUser, accessToken: string) => void;
  logout:       () => Promise<void>;
  updateUser:   (updates: Partial<IUser>) => void;
  refreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      isAuthenticated: false,
      isLoading:       false,

      login: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true, isLoading: false });
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      },

      logout: async () => {
        try {
          await axios.post("/api/auth/logout");
        } catch {
          // Ignore errors — always clear local state
        }
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        delete axios.defaults.headers.common["Authorization"];
        if (typeof window !== "undefined") window.location.href = "/login";
      },

      updateUser: (updates) => {
        set(state => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      refreshToken: async () => {
        try {
          const response = await axios.post("/api/auth/refresh", {}, {
            // Do not include the current (possibly expired) access token
            headers: { Authorization: undefined },
            withCredentials: true,
          });
          if (response.data.success) {
            const newToken = response.data.data.accessToken;
            set({ accessToken: newToken, isAuthenticated: true });
            axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
            return true;
          }
          return false;
        } catch {
          // If refresh fails completely, mark as unauthenticated
          set({ isAuthenticated: false, accessToken: null, user: null });
          delete axios.defaults.headers.common["Authorization"];
          return false;
        }
      },
    }),
    {
      name: "oc-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user:            state.user,
        accessToken:     state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ── Axios Interceptors ─────────────────────────────────────────
let isRefreshing  = false;
let refreshQueue: Array<(token: string) => void> = [];

export function setupAxiosInterceptors() {
  // Avoid double-registering interceptors
  // Request interceptor: always attach the latest token
  axios.interceptors.request.use(config => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: auto-refresh on 401
  axios.interceptors.response.use(
    response => response,
    async error => {
      const original = error.config;

      // Skip refresh for auth endpoints to avoid infinite loops
      const isAuthEndpoint = original?.url?.includes("/api/auth/");
      if (
        error.response?.status === 401 &&
        !original._retry &&
        !isAuthEndpoint
      ) {
        if (isRefreshing) {
          // Queue this request until refresh completes
          return new Promise(resolve => {
            refreshQueue.push(token => {
              original.headers["Authorization"] = `Bearer ${token}`;
              resolve(axios(original));
            });
          });
        }

        original._retry = true;
        isRefreshing    = true;

        try {
          const refreshed = await useAuthStore.getState().refreshToken();
          isRefreshing    = false;

          if (refreshed) {
            const newToken = useAuthStore.getState().accessToken!;
            refreshQueue.forEach(cb => cb(newToken));
            refreshQueue = [];
            original.headers["Authorization"] = `Bearer ${newToken}`;
            return axios(original);
          } else {
            refreshQueue = [];
            // Only redirect if user was supposed to be authenticated
            if (useAuthStore.getState().user) {
              await useAuthStore.getState().logout();
            }
          }
        } catch {
          isRefreshing = false;
          refreshQueue = [];
        }
      }

      return Promise.reject(error);
    }
  );
}
