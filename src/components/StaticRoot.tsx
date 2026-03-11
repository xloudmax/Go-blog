// src/components/StaticRoot.tsx
import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import App from '../App';
import ThemeProvider, { useTheme } from './ThemeProvider';
import { AppStateProvider } from '@/hooks';
import { AntdThemeProvider } from '@/theme/antdTheme';

// 创建一个空的 Apollo Client，防止 Hook 报错
const emptyClient = new ApolloClient({
    cache: new InMemoryCache(),
    // 在静态模式下，所有的 GraphQL 请求都不应该被触发，或者应该静默失败
});

// Simplified internal component for static mode (no Apollo)
function AppWithTheme() {
    const { isDarkMode } = useTheme();

    return (
        <AntdThemeProvider isDarkMode={isDarkMode}>
            <AppStateProvider>
                <AntdApp notification={{ placement: 'topRight', top: 50, duration: 4.5, maxCount: 3 }}>
                    <App />
                </AntdApp>
            </AppStateProvider>
        </AntdThemeProvider>
    );
}

const StaticRoot = () => {
    return (
        <ApolloProvider client={emptyClient}>
            <ConfigProvider theme={{}}>
                <ThemeProvider>
                    <AppWithTheme />
                </ThemeProvider>
            </ConfigProvider>
        </ApolloProvider>
    )
}

export default StaticRoot;
