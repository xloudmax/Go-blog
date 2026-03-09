// src/App.tsx
// 应用入口，负责路由配置

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';

const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

/**
 * 应用的根组件
 * 配置应用的主要路由
 */
export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={isTauri ? <Navigate to="/home" replace /> : <LandingPage />} />
                <Route path="/*" element={<AppLayout />} />
            </Routes>
        </BrowserRouter>
    );
}
