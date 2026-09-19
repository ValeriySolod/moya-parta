'use client';

import { create } from 'zustand';

const CHAT_DOCK_KEY = 'moya-parta-chat-dock';

function readChatDockOpen(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const raw = window.localStorage.getItem(CHAT_DOCK_KEY);
  if (raw === null) {
    return true;
  }

  return raw === '1';
}

interface UiState {
  toast: { message: string; tone: 'success' | 'info' | 'error' } | null;
  chatDockOpen: boolean;
  showToast: (
    message: string,
    tone?: 'success' | 'info' | 'error',
  ) => void;
  clearToast: () => void;
  setChatDockOpen: (open: boolean) => void;
  toggleChatDock: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  toast: null,
  chatDockOpen: true,
  showToast: (message, tone = 'success') => {
    set({ toast: { message, tone } });
    window.setTimeout(() => set({ toast: null }), 2200);
  },
  clearToast: () => set({ toast: null }),
  setChatDockOpen: (open) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHAT_DOCK_KEY, open ? '1' : '0');
    }
    set({ chatDockOpen: open });
  },
  toggleChatDock: () => {
    const next = !get().chatDockOpen;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHAT_DOCK_KEY, next ? '1' : '0');
    }
    set({ chatDockOpen: next });
  },
}));

export function hydrateChatDockPreference(): void {
  useUiStore.setState({ chatDockOpen: readChatDockOpen() });
}
