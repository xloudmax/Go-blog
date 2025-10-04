import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useCurrentUser, useAuth } from '../api/graphql';
import { User } from '../generated/graphql';

// 应用状态接口
interface AppState {
  // 用户状态
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;

  // 应用状态
  isLoading: boolean;
  error: string | null;

  // 主题状态
  theme: 'light' | 'dark';

  // 侧边栏状态
  sidebarOpen: boolean;
}

// 应用状态操作接口
interface AppActions {
  // 用户操作
  login: (identifier: string, password: string, remember?: boolean) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => void;

  // 主题操作
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // UI操作
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // 错误处理
  setError: (error: string | null) => void;
  clearError: () => void;
}

// 应用上下文
const AppContext = createContext<{
  state: AppState;
  actions: AppActions;
} | null>(null);

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
      } catch (error: any) {
        setErrorState(error.message || '登录失败');
        throw error;
      }
    },

    logout: async () => {
      try {
        await authLogout();
        setErrorState(null);
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('登出错误:', error.message);
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
export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

// 导出 AppContext 以便其他组件可以使用
export { AppContext };