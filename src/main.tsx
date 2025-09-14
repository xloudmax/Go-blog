// src/main.tsx
// 应用启动文件，挂载 React 应用并提供GraphQL客户端、主题配置和应用状态管理
import '@ant-design/v5-patch-for-react-19';
import React from 'react'
import ReactDOM from 'react-dom/client'
import Root from './components/Root'
import './index.css'
import './styles/modern-blog.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>
)