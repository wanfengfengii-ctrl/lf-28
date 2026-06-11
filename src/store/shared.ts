import { create } from 'zustand';

export const STORAGE_KEY = 'museum-guide-config';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function loadStorageSlice<T extends Record<string, unknown>>(keys: string[]): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const slice: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in data) slice[key] = data[key];
    }
    return Object.keys(slice).length > 0 ? (slice as T) : null;
  } catch {
    return null;
  }
}

export function saveStorageSlice(slice: Record<string, unknown>): void {
  try {
    let existing: Record<string, unknown> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) existing = JSON.parse(raw);
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...slice }));
  } catch {
    // ignore storage errors
  }
}

interface ConfirmModalData {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface UIState {
  confirmModal: ConfirmModalData | null;
  showConfirmModal: (title: string, message: string, onConfirm: () => void) => void;
  closeConfirmModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  confirmModal: null,
  showConfirmModal: (title, message, onConfirm) =>
    set({ confirmModal: { open: true, title, message, onConfirm } }),
  closeConfirmModal: () => set({ confirmModal: null }),
}));
