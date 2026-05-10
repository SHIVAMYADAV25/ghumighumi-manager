import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setToken: (token) => {
        localStorage.setItem('accessToken', token);
        set({ accessToken: token });
      },

      login: async (credentials) => {
        set({ isLoading: true });
        const { data } = await authApi.login(credentials);
        localStorage.setItem('accessToken', data.accessToken);
        set({ user: data.user, accessToken: data.accessToken, isLoading: false });
        return data;
      },

      register: async (credentials) => {
        set({ isLoading: true });
        const { data } = await authApi.register(credentials);
        localStorage.setItem('accessToken', data.accessToken);
        set({ user: data.user, accessToken: data.accessToken, isLoading: false });
        return data;
      },

      logout: async () => {
        try { await authApi.logout(); } catch (_) {}
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null });
      },

      refreshUser: async () => {
        const { data } = await authApi.getMe();
        set({ user: data.user });
      },

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

      isAuthenticated: () => !!get().user && !!get().accessToken,
    }),
    {
      name: 'ws-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    }
  )
);

export default useAuthStore;