import { create } from 'zustand';
import type { UserProfile, Business } from '@xyntra/types';

interface AuthState {
  user: any | null; // Supabase User object
  profile: UserProfile | null;
  business: Business | null;
  isLoading: boolean;
  theme: 'light' | 'dark';
  setSession: (
    user: any | null,
    profile: UserProfile | null,
    business: Business | null
  ) => void;
  setBusiness: (business: Business | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  business: null,
  isLoading: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  
  setSession: (user, profile, business) => 
    set({ user, profile, business, isLoading: false }),
    
  setBusiness: (business) => set({ business }),
  
  setProfile: (profile) => set({ profile }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  
  logout: () => 
    set({ user: null, profile: null, business: null, isLoading: false }),
}));
