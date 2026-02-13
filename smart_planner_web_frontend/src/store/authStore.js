// src/store/authStore.js - Authentication state management with Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import * as api from '../api';

const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        token: null,
        isLoggedIn: false,
        isLoading: false,
        error: null,
        
        // Actions
        setUser: (user) => set({ user, isLoggedIn: !!user }),
        setToken: (token) => set({ token }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        
        // Login
        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const result = await api.signInWithEmail(email, password);
            set({
              user: result.user,
              token: result.token,
              isLoggedIn: true,
              isLoading: false,
              error: null
            });
            return result;
          } catch (error) {
            set({
              error: error.message,
              isLoading: false,
              isLoggedIn: false
            });
            throw error;
          }
        },
        
        // Register
        register: async (email, password, fullName) => {
          set({ isLoading: true, error: null });
          try {
            const result = await api.signUpWithEmail(email, password, fullName);
            set({
              user: result.user,
              token: result.token,
              isLoggedIn: true,
              isLoading: false,
              error: null
            });
            return result;
          } catch (error) {
            set({
              error: error.message,
              isLoading: false
            });
            throw error;
          }
        },
        
        // Logout
        logout: async () => {
          set({ isLoading: true });
          try {
            await api.signOut();
            set({
              user: null,
              token: null,
              isLoggedIn: false,
              isLoading: false,
              error: null
            });
          } catch (error) {
            set({ error: error.message });
          }
        },
        
        // Check if authenticated
        isAuthenticated: () => {
          return get().isLoggedIn && !!get().token;
        },
        
        // Clear error
        clearError: () => set({ error: null })
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isLoggedIn: state.isLoggedIn
        })
      }
    )
  )
);

export default useAuthStore;
