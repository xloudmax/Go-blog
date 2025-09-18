// src/components/ThemeProvider.tsx
import React, { useState, useEffect, ReactNode, createContext, useContext } from 'react';

// 1. 导出 Theme 类型，方便其他文件导入使用
export type Theme = 'light' | 'dark';

interface Ctx {
    theme: Theme;
    toggle: () => void;
}

// 创建 Context，并提供符合 Ctx 接口的默认值
export const ThemeContext = createContext<Ctx>({
    theme: 'light', // 默认主题
    toggle: () => {}, // 空函数作为默认的 toggle 实现
});

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
     * 优先级：本地缓存 > html 类名 > 系统偏好 > 默认亮色
     */
    function getInitialTheme(): Theme {
        // 强制清除任何现有的主题类
        document.documentElement.classList.remove('light', 'dark');
        document.body.classList.remove('light', 'dark');
        
        const saved = localStorage.getItem('theme')

        if (saved === 'light' || saved === 'dark') {
            return saved
        }
        
        // 清除后检查是否还有dark类
        const hasHtmlDarkClass = document.documentElement.classList.contains('dark')

        if (hasHtmlDarkClass) {
            return 'dark'
        }
        
        // 注释掉系统偏好检测，默认使用亮色主题
        // const prefersColorScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        // console.log('System prefers dark mode:', prefersColorScheme)
        // if (prefersColorScheme) {
        //     return 'dark'
        // }
        

        return 'light'
    }

    const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

    // 当 theme 改变时，写入 localStorage 并同步到 DOM
    useEffect(() => {

        localStorage.setItem('theme', theme);
        
        // 强制清除所有主题类
        document.documentElement.classList.remove('light', 'dark');
        document.body.classList.remove('light', 'dark');
        
        // 添加当前主题类
        document.documentElement.classList.add(theme);
        document.body.classList.add(theme);
        document.documentElement.setAttribute('data-theme', theme);
        
        // 强制设置根元素样式
        if (theme === 'light') {
            document.documentElement.style.colorScheme = 'light';
            document.body.style.backgroundColor = '#ffffff';
        } else {
            document.documentElement.style.colorScheme = 'dark';
            document.body.style.backgroundColor = '#1f2937';
        }
        


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
            <div className={`theme-${theme}`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
