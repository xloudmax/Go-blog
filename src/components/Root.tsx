// src/components/Root.tsx
import React from 'react'
import { ApolloProvider } from '@apollo/client'
import { ConfigProvider, App as AntdApp, notification } from 'antd'
import App from '../App'
import ThemeProvider, { useTheme } from './ThemeProvider'
import { AppStateProvider } from '../hooks/useAppState'
import { AntdThemeProvider } from '../theme/antdTheme'
import client from '../graphql/client'

// 内部组件，用于访问主题上下文
function AppWithTheme() {
    const { isDarkMode } = useTheme();
    
    return (
        <AntdThemeProvider isDarkMode={isDarkMode}>
            <ApolloProvider client={client}>
                <AppStateProvider>
                    <AntdApp>
                        <App />
                    </AntdApp>
                </AppStateProvider>
            </ApolloProvider>
        </AntdThemeProvider>
    );
}

const Root = () => {
    // Configure notification globally
    React.useEffect(() => {
        notification.config({
            placement: 'topRight',
            top: 50,
            duration: 4.5,
            maxCount: 3,
            rtl: false,
        });
    }, []);

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
