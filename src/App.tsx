// src/App.tsx
// 应用入口，仅负责路由包装与布局挂载
import { BrowserRouter } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'

/**
 * 应用的根组件
 * 由于布局已拆分到 AppLayout 中，此处只负责包裹 BrowserRouter
 */
export default function App() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    )
}
