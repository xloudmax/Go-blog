import { useContext, Suspense, lazy } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import {
  Layout,
  Typography,
} from 'antd';
import { ThemeContext } from '../components/ThemeProvider'
import { useAppUser } from '../hooks/appStateHooks'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import IconSidebar from '@/components/IconSidebar'
import PageLoading from '@/components/PageLoading'

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

const { Content, Footer } = Layout;
const { Text } = Typography;

export default function AppLayout() {
    const { theme: appTheme, toggle } = useContext(ThemeContext)
    const { isAuthenticated } = useAppUser() // Keep this if needed for layout logic, e.g. hiding sidebar items? 
    // Actually IconSidebar might need auth state, but it handles it internally or passed via props?
    // IconSidebar doesn't take auth props in previous code.
    
    // 使用自定义 Hook 处理离线文章同步
    useOfflineSync();

    return (
        <>
            {/* 图标侧边栏 */}
            <IconSidebar
                isDarkMode={appTheme === 'dark'}
                onThemeToggle={toggle}
            />

            <Layout style={{
                minHeight: '100vh',
                marginLeft: '72px',  // 为图标侧边栏留出空间
                backgroundColor: appTheme === 'dark' ? '#1f2937' : '#ffffff'
            }}>
                <Content style={{
                    backgroundColor: appTheme === 'dark' ? '#1f2937' : '#f9fafb',
                    padding: '2rem 1.5rem 0'  // 上 左右 下
                }}>
                    <Suspense fallback={<PageLoading />}>
                        <Routes>
                            <Route path="/home" element={<HomePage />} />
                            <Route path="/search" element={<SearchPage />} />
                            <Route path="/tags" element={<TagsPage />} />
                            <Route path="/notifications" element={<NotificationPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
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
                    </Suspense>
                </Content>
                <Footer className="text-center bg-gray-100 dark:bg-gray-800 py-4">
                    <Text type="secondary" className="text-sm">Xloudmax © {new Date().getFullYear()}</Text>
                </Footer>
            </Layout>
        </>
    );
}