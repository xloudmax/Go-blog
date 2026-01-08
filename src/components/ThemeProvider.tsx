// src/components/ThemeProvider.tsx
import React, { useState, useEffect, ReactNode, useContext } from 'react';
import { ThemeContext, Theme } from '@/context/ThemeContext';

export { ThemeContext };
export type { Theme };

interface ThemeProviderProps {
    children: ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
    const context = useContext(ThemeContext);
    return {
        ...context,
        isDarkMode: context.theme === 'dark'
    };
};

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    /**
     * 计算初始主题
     * 优先级：本地缓存 > html 类名 > 默认亮色
     */
    function getInitialTheme(): Theme {
        const saved = localStorage.getItem('theme')

        if (saved === 'light' || saved === 'dark') {
            return saved
        }

        const hasHtmlDarkClass = document.documentElement.classList.contains('dark')
        if (hasHtmlDarkClass) {
            return 'dark'
        }

        return 'light'
    }

    const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

    // 当 theme 改变时，写入 localStorage 并同步到 DOM
    useEffect(() => {
        localStorage.setItem('theme', theme);

        // 移除所有主题相关类
        document.documentElement.classList.remove('light', 'dark');
        
        // 添加基础主题类
        document.documentElement.classList.add(theme);
        
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;

        // 同步 highlight.js 主题
        const id = 'hljs-theme';
        const href =
            theme === 'dark'
                ? 'https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github-dark.css'
                : 'https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github.css';
        let link = document.getElementById(id) as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        link.href = href;
    }, [theme]);

    // 切换主题
    const toggle = () => {
        setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'))
    }

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
