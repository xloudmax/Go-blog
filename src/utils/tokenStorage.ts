// src/utils/tokenStorage.ts
import { invoke } from '@tauri-apps/api/core';

const isTauri = !!(window as any).__TAURI_INTERNALS__;

export const tokenStorage = {
  async get(): Promise<string | null> {
    if (isTauri) {
      try {
        return await invoke<string | null>('get_token');
      } catch (e) {
        console.error('Failed to get token from keychain', e);
        return localStorage.getItem('token');
      }
    }
    return localStorage.getItem('token');
  },

  async set(token: string): Promise<void> {
    localStorage.setItem('token', token);
    if (isTauri) {
      try {
        await invoke('store_token', { token });
      } catch (e) {
        console.error('Failed to store token in keychain', e);
      }
    }
  },

  async remove(): Promise<void> {
    localStorage.removeItem('token');
    if (isTauri) {
      try {
        await invoke('delete_token');
      } catch (e) {
        console.error('Failed to delete token from keychain', e);
      }
    }
  }
};
