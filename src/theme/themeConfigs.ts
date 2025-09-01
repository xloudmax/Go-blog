// src/theme/themeConfigs.ts
// 主题配置常量，用于Ant Design主题配置

import type {ThemeConfig} from 'antd';
import {theme} from 'antd';

// 亮色主题配置
export const lightTheme: ThemeConfig = {
    algorithm: theme.defaultAlgorithm,
    token: {
        // 主色
        colorPrimary: 'var(--color-primary-light, #4f46e5)',
        colorSuccess: 'var(--color-success-light, #10b981)',
        colorWarning: 'var(--color-warning-light, #f59e0b)',
        colorError: 'var(--color-error-light, #ef4444)',
        colorInfo: 'var(--color-info-light, #3b82f6)',

        // 背景色
        colorBgBase: '#ffffff', // 对应原来的 bg-base-100
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#f9fafb', // 对应原来的 bg-base-200

        // 文字颜色
        colorText: '#111827',
        colorTextSecondary: '#6b7280',
        colorTextTertiary: '#9ca3af',

        // 边框
        colorBorder: '#e5e7eb',
        colorBorderSecondary: '#f3f4f6',

        // 字体
        fontFamily: '"Noto Sans SC", "Hack Nerd Mono", sans-serif',
        fontSize: 14,

        // 圆角
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,

        // 阴影
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    },
    components: {
        Button: {
            borderRadius: 8,
            fontWeight: 500,
        },
        Input: {
            borderRadius: 8,
        },
        Card: {
            borderRadius: 12,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        },
        Modal: {
            borderRadius: 12,
        },
        Drawer: {
            borderRadius: 0,
        },
        Menu: {
            borderRadius: 8,
        },
        Table: {
            borderRadius: 8,
        },
        Tag: {
            borderRadius: 6,
            // 移除强制文字颜色配置，让CSS样式控制文字颜色
        },
    },
};

// 深色主题配置
export const darkTheme: ThemeConfig = {
    algorithm: theme.darkAlgorithm,
    token: {
        // 主色
        colorPrimary: 'var(--color-primary-dark, #6366f1)', // 深色模式下稍微亮一点的主色
        colorSuccess: 'var(--color-success-dark, #10b981)',
        colorWarning: 'var(--color-warning-dark, #f59e0b)',
        colorError: 'var(--color-error-dark, #ef4444)',
        colorInfo: 'var(--color-info-dark, #3b82f6)',

        // 背景色
        colorBgBase: '#1f1f1f', // 对应原来的深色背景
        colorBgContainer: '#2d2d2d',
        colorBgElevated: '#3d3d3d',
        colorBgLayout: '#1a1a1a',

        // 文字颜色
        colorText: '#ffffff',
        colorTextSecondary: '#d1d5db',
        colorTextTertiary: '#9ca3af',

        // 边框
        colorBorder: '#404040',
        colorBorderSecondary: '#525252',

        // 字体
        fontFamily: '"Noto Sans SC", "Hack Nerd Mono", sans-serif',
        fontSize: 14,

        // 圆角
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,

        // 阴影
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
    },
    components: {
        Button: {
            borderRadius: 8,
            fontWeight: 500,
        },
        Input: {
            borderRadius: 8,
        },
        Card: {
            borderRadius: 12,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
        },
        Modal: {
            borderRadius: 12,
        },
        Drawer: {
            borderRadius: 0,
        },
        Menu: {
            borderRadius: 8,
        },
        Table: {
            borderRadius: 8,
        },
        Tag: {
            borderRadius: 6,
            // 移除强制文字颜色配置，让CSS样式控制文字颜色
        },
    },
};