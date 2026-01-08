// src/context/ThemeContext.ts
import { createContext } from 'react';

export type Theme = 'light' | 'dark';

export interface Ctx {
    theme: Theme;
    toggle: () => void;
}

// 创建 Context，并提供符合 Ctx 接口的默认值
export const ThemeContext = createContext<Ctx>({
    theme: 'light', // 默认主题
    toggle: () => {}, // 空函数作为默认的 toggle 实现
});
