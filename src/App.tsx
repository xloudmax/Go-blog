// src/App.tsx
// 应用入口，负责路由配置

import { Suspense, lazy } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppUser } from '@/hooks';
import AppLayout from './layouts/AppLayout';
import PageLoading from './components/PageLoading';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));

const isStatic = import.meta.env.VITE_STATIC_EXPORT === 'true';

const Router = isStatic ? HashRouter : BrowserRouter;

/**
 * 应用的根组件
 * 配置应用的主要路由
 */
export default function App() {
    const { isAuthenticated, isLoading } = useAppUser();

    if (isLoading && !isStatic) {
        return <PageLoading />;
    }

    if (isStatic) {
        return (
            <Router>
                <Suspense fallback={<PageLoading />}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        {/* 使用 AppLayout 包裹，找回背景 and 导航栏 */}
                        <Route element={<AppLayout />}>
                            <Route path="/home" element={<HomePage />} />
                            <Route path="/post/:slug" element={<PostDetailPage />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/home" replace />} />
                    </Routes>
                </Suspense>
            </Router>
        );
    }

    return (
        <Router>
            <Suspense fallback={<PageLoading />}>
                <Routes>
                    <Route path="/" element={isAuthenticated || isStatic ? <Navigate to="/home" replace /> : <LandingPage />} />
                    <Route path="/*" element={<AppLayout />} />
                </Routes>
            </Suspense>
        </Router>
    );
}
