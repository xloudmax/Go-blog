
import { useState, useEffect, useContext, ReactNode } from 'react';
import { useCurrentUser, useAuth } from '@/api/graphql';
import { AppContext, AppState, AppActions } from '@/context/AppContext';

// 应用状态提供器
export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  // 获取用户数据
  const { user, loading: userLoading, error: userError, refetch: refetchUser } = useCurrentUser();
  const { login: authLogin, logout: authLogout } = useAuth();

  // 本地状态
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [sidebarOpen, setSidebarOpenState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  // 计算派生状态
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const isLoading = userLoading;

  // 监听用户错误
  useEffect(() => {
    if (userError) {
      setErrorState(userError.message);
    }
  }, [userError]);

  // 主题持久化
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // 状态对象
  const state: AppState = {
    currentUser: user,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    theme,
    sidebarOpen,
  };

  // 操作对象
  const actions: AppActions = {
    // 用户操作
    login: async (identifier: string, password: string, remember = false) => {
      try {
        setErrorState(null);
        const result = await authLogin(identifier, password, remember);
        if (result) {
          await refetchUser();
        }
        return result;
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setErrorState(error.message || '登录失败');
        throw error;
      }
    },

    logout: async () => {
      try {
        await authLogout();
        setErrorState(null);
      } catch (error: unknown) {
        if (process.env.NODE_ENV === 'development') {
           // eslint-disable-next-line no-console
           console.error('登出错误:', error instanceof Error ? error.message : String(error));
        }
        // 即使登出失败也清理本地状态
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    },

    refreshUser: () => {
      refetchUser();
    },

    // 主题操作
    toggleTheme: () => {
      setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    },

    setTheme: (newTheme: 'light' | 'dark') => {
      setThemeState(newTheme);
    },

    // UI操作
    toggleSidebar: () => {
      setSidebarOpenState(prev => !prev);
    },

    setSidebarOpen: (open: boolean) => {
      setSidebarOpenState(open);
    },

    // 错误处理
    setError: (newError: string | null) => {
      setErrorState(newError);
    },

    clearError: () => {
      setErrorState(null);
    },
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// 使用应用状态的hook
// eslint-disable-next-line react-refresh/only-export-components
export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};
