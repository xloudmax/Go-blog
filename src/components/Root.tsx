// src/components/Root.tsx
import React from 'react'
import { ApolloProvider } from '@apollo/client'
import { ConfigProvider } from 'antd'
import App from '../App'
import ThemeProvider, { ThemeContext, useTheme } from './ThemeProvider'
import { AppStateProvider } from '../hooks/useAppState'
import { AntdThemeProvider } from '../theme/antdTheme'
import { lightTheme, darkTheme } from '../theme/themeConfigs'
import client from '../graphql/client'

// 内部组件，用于访问主题上下文
function AppWithTheme() {
    const { isDarkMode } = useTheme();
    
    return (
        <AntdThemeProvider isDarkMode={isDarkMode}>
            <ApolloProvider client={client}>
                <AppStateProvider>
                    <App />
                </AppStateProvider>
            </ApolloProvider>
        </AntdThemeProvider>
    );
}

const Root = () => {
    return (
        <ConfigProvider
            theme={{
                // 自定义主题配置，确保与React 19兼容
            }}
        >
            <ThemeProvider>
                <AppWithTheme />
            </ThemeProvider>
        </ConfigProvider>
    )
}

export default Root;
