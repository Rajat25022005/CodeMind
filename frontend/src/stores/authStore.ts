import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  email: string;
  is_verified: boolean;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  setToken: (token: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  get isAuthenticated(): boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      
      logout: () => set({ token: null, user: null }),

      get isAuthenticated() {
        return !!get().token;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
