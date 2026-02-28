import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlanTier } from '@nextjs-blox/shared-types';

type Persona = 'Freelancer' | 'JobSeeker' | 'Professional' | 'Enterprise' | 'Student';

export interface Asset {
  id: string;
  type: 'PORTFOLIO' | 'RESUME' | 'COVER_LETTER';
  title: string;
  healthScore: number;
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  views: number;
  createdAt: string;
  updatedAt: string;
  publishedUrl?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
  icon: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  read: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  tier: PlanTier;
  persona: Persona;
  avatarUrl?: string;
  streak?: number;
  badges?: Badge[];
}

interface BloxState {
  // Auth state
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // User state
  user: UserProfile;

  // Assets state
  assets: Asset[];
  currentAsset: Asset | null;

  // Navigation
  lastVisitedRoute: string;

  // Notifications
  notifications: NotificationItem[];

  // Gamification
  badges: Badge[];
  streak: number;

  // Auth actions
  login: (tokens: { accessToken: string; refreshToken: string }, user: UserProfile) => void;
  logout: () => void;
  updateUser: (patch: Partial<UserProfile>) => void;

  // Asset actions
  setAssets: (assets: Asset[]) => void;
  setCurrentAsset: (asset: Asset | null) => void;

  // Legacy actions
  setTier: (tier: PlanTier) => void;
  setPersona: (persona: Persona) => void;
  setLastVisitedRoute: (route: string) => void;
  addNotification: (title: string) => void;
  markNotificationRead: (id: string) => void;
}

const DEFAULT_USER: UserProfile = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@blox.app',
  tier: PlanTier.FREE,
  persona: 'JobSeeker',
  streak: 5,
  badges: [],
};

export const useBloxStore = create<BloxState>()(
  persist(
    (set) => ({
      // Auth state
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // User state
      user: DEFAULT_USER,

      // Assets state
      assets: [],
      currentAsset: null,

      // Navigation
      lastVisitedRoute: '/',

      // Notifications
      notifications: [
        { id: 'notif-renewal', title: 'Your trial ends in 3 days', read: false },
        { id: 'notif-seo', title: 'Portfolio SEO score improved to 84', read: false },
      ],

      // Gamification
      badges: [
        { id: 'badge-first', name: 'First Asset', description: 'Created your first asset', earnedAt: new Date().toISOString(), icon: 'star' },
        { id: 'badge-streak', name: '5-Day Streak', description: 'Used Blox 5 days in a row', earnedAt: new Date().toISOString(), icon: 'fire' },
      ],
      streak: 5,

      // Auth actions
      login: (tokens, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('blox_access_token', tokens.accessToken);
          localStorage.setItem('blox_refresh_token', tokens.refreshToken);
        }
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
          user,
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('blox_access_token');
          localStorage.removeItem('blox_refresh_token');
        }
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          user: DEFAULT_USER,
          assets: [],
          currentAsset: null,
        });
      },

      updateUser: (patch) =>
        set((state) => ({
          user: { ...state.user, ...patch },
        })),

      // Asset actions
      setAssets: (assets) => set({ assets }),
      setCurrentAsset: (asset) => set({ currentAsset: asset }),

      // Legacy actions
      setTier: (tier) => set((state) => ({ user: { ...state.user, tier } })),
      setPersona: (persona) => set((state) => ({ user: { ...state.user, persona } })),
      setLastVisitedRoute: (route) => set({ lastVisitedRoute: route }),

      addNotification: (title) =>
        set((state) => ({
          notifications: [
            { id: crypto.randomUUID(), title, read: false },
            ...state.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
        })),
    }),
    {
      name: 'blox-store',
    },
  ),
);
