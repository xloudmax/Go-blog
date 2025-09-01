// src/hooks/appStateHooks.ts
// 应用状态相关的便捷hooks，用于访问应用上下文中的不同部分

import { useAppState } from './useAppState';

// 便捷的状态和操作hooks
export const useAppUser = () => {
  const { state, actions } = useAppState();
  return {
    user: state.currentUser,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin,
    login: actions.login,
    logout: actions.logout,
    refreshUser: actions.refreshUser,
  };
};

export const useAppUI = () => {
  const { state, actions } = useAppState();
  return {
    sidebarOpen: state.sidebarOpen,
    toggleSidebar: actions.toggleSidebar,
    setSidebarOpen: actions.setSidebarOpen,
    isLoading: state.isLoading,
    error: state.error,
    setError: actions.setError,
    clearError: actions.clearError,
  };
};