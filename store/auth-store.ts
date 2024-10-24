import { cookieManager } from "@/lib/cookie-manager";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  id: number;
  email: string;
  username: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isInitialized: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isInitialized: false,
      setAuth: (user, token) => {
        set({ user, token, isInitialized: true });
        cookieManager.setAuthCookie(user, token);
      },
      logout: () => {
        set({ user: null, token: null, isInitialized: true });
        cookieManager.clearAuthCookie();
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
