import { useContext, Suspense, lazy } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import {
  Layout,
  Typography,
  Grid
} from 'antd';
import { ThemeContext } from '../components/ThemeProvider'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import IconSidebar from '@/components/IconSidebar'
import MobileBottomBar from '@/components/MobileBottomBar'
import PageLoading from '@/components/PageLoading'
import { MeshGradientBackground } from '@/components/MeshGradientBackground'
import BackToTop from '@/components/BackToTop'
import TauriTitleBar from '@/components/TauriTitleBar'
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { LiquidButton } from '@/components/LiquidButton';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const PostDetailPage = lazy(() => import('@/pages/PostDetailPage'));
const EditorPage = lazy(() => import('@/pages/EditorPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const TagsPage = lazy(() => import('@/pages/TagsPage'));
const NotificationPage = lazy(() => import('@/pages/NotificationPage'));
const InsightPage = lazy(() => import('@/pages/InsightPage'));
const LiquidGlassTestPage = lazy(() => import('@/pages/LiquidGlassTestPage'));

const { Content, Footer } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function AppLayout() {
    const { theme: appTheme, toggle } = useContext(ThemeContext)
    const screens = useBreakpoint();
    
    // 使用自定义 Hook 处理离线文章同步
    useOfflineSync();

    // Determine sidebar width based on screen size (0 on mobile, 72px on desktop)
    const isMobile = !screens.md;

    return (
        <>
            <TauriTitleBar />
            {/* Global Animated Background */}
            <MeshGradientBackground />
            
            {/* 图标侧边栏 - Desktop Only */}
            <div className="hidden md:block">
                <IconSidebar
                    isDarkMode={appTheme === 'dark'}
                    onThemeToggle={toggle}
                />
            </div>

            {/* 移动端底部导航 - Mobile Only */}
            {isMobile && <MobileBottomBar />}

            {/* 移动端右上角主题切换 - Mobile Only */}
            {isMobile && (
                <div className="fixed z-50 pointer-events-auto" style={{
                    top: 'calc(0.5rem + env(safe-area-inset-top))',
                    right: '1rem'
                }}>
                    <LiquidButton
                        variant="ghost"
                        onClick={toggle}
                        className="!w-10 !h-10 !rounded-full !p-0 flex items-center justify-center backdrop-blur-md shadow-sm border border-black/5 dark:border-white/10"
                    >
                        {appTheme === 'dark' ? <SunOutlined className="text-lg text-yellow-400" /> : <MoonOutlined className="text-lg text-gray-600" />}
                    </LiquidButton>
                </div>
            )}

            <Layout style={{
                minHeight: '100vh',
                marginLeft: isMobile ? 0 : '72px',
                marginBottom: isMobile ? 'calc(64px + env(safe-area-inset-bottom))' : 0, // Padding for bottom bar + safe area
                backgroundColor: 'transparent',
                transition: 'all 0.3s ease'
            }}>
                <Content style={{
                    backgroundColor: 'transparent',
                    padding: isMobile ? 'calc(1rem + env(safe-area-inset-top)) 1rem 0' : 'calc(2rem + env(safe-area-inset-top)) 1.5rem 0',
                    transition: 'all 0.3s ease'
                }}>
                    <Suspense fallback={<PageLoading />}>
                        <div className="page-enter-active min-h-full">
                            <Routes>
                                <Route path="/home" element={<HomePage />} />
                                <Route path="/search" element={<SearchPage />} />
                                <Route path="/insight" element={<InsightPage />} />
                                <Route path="/tags" element={<TagsPage />} />
                                <Route path="/notifications" element={<NotificationPage />} />
                                <Route path="/profile" element={<ProfilePage />} />
                                <Route path="/liquid-glass" element={<LiquidGlassTestPage />} />
                                <Route path="/post/:slug" element={<PostDetailPage />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                <Route path="/editor/posts" element={<EditorPage />} />
                                <Route path="/editor/posts/:file" element={<EditorPage />} />
                                <Route path="/admin/*" element={<AdminPage />} />
                                <Route
                                    path="*"
                                    element={
                                        <div className="flex items-center justify-center min-h-screen">
                                            <div className="text-center">
                                                <p className="text-lg mb-4">页面未找到</p>
                                                <Link to="/home" className="text-blue-600 hover:text-blue-800">
                                                    返回文章列表
                                                </Link>
                                            </div>
                                        </div>
                                    }
                                />
                            </Routes>
                        </div>
                    </Suspense>
                </Content>
                <Footer className="text-center bg-gray-100 dark:bg-gray-800 py-4 pb-[env(safe-area-inset-bottom)]">
                    <Text type="secondary" className="text-sm">Xloudmax © {new Date().getFullYear()}</Text>
                </Footer>
            </Layout>

            {/* Global Back To Top */}
            <BackToTop />
        </>
    );
}
