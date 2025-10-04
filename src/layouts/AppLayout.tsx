import { useContext, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import {
  Layout,
  Typography,
  notification
} from 'antd';
import { ThemeContext } from '../components/ThemeProvider'
import { useAppUser } from '../hooks/appStateHooks'
import { useBlogActions } from '../api/graphql/blog'
import HomePage from '@/pages/HomePage'
import PostDetailPage from '@/pages/PostDetailPage'
import EditorPage from '@/pages/EditorPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import AdminPage from '@/pages/admin/AdminPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import offlineStorage from '@/utils/offlineStorage'
import SearchPage from '@/pages/SearchPage'
import ProfilePage from '@/pages/ProfilePage'
import IconSidebar from '@/components/IconSidebar'

const { Content, Footer } = Layout;
const { Text } = Typography;

export default function AppLayout() {
    const { theme: appTheme, toggle } = useContext(ThemeContext)
    const { isAuthenticated } = useAppUser()
    const { createPost } = useBlogActions()

    // 自动同步离线文章
    useEffect(() => {
        const syncOfflinePosts = async () => {
            if (!isAuthenticated || !navigator.onLine) return;

            try {
                const posts = await offlineStorage.getAllOfflinePosts();
                const unsyncedPosts = posts.filter(post => !post.lastSyncedAt);

                if (unsyncedPosts.length > 0) {
                    notification.info({
                      message: '提示',
                      description: `发现${unsyncedPosts.length}篇离线文章，正在同步...`,
                      duration: 5,
                    });

                    let successCount = 0;
                    let failCount = 0;

                    for (const post of unsyncedPosts) {
                        try {
                            // 调用API同步文章
                            await createPost({
                                title: post.title,
                                content: post.content,
                                tags: post.tags || [],
                                categories: post.categories || [],
                            });

                            // 标记为已同步
                            await offlineStorage.markPostAsSynced(post.id);
                            successCount++;
                        } catch (error) {
                            failCount++;
                        }
                    }

                    if (successCount > 0) {
                        notification.success({
                      message: '同步成功',
                      description: `成功同步${successCount}篇离线文章`,
                      duration: 5,
                    });
                    }

                    if (failCount > 0) {
                        notification.error({
                      message: '同步失败',
                      description: `${failCount}篇文章同步失败，请检查网络连接后重试`,
                      duration: 5,
                    });
                    }
                }
            } catch (error) {
                notification.error({
                  message: '同步失败',
                  description: '离线文章同步失败，请稍后重试',
                  duration: 5,
                });
            }
        };

        // 当用户登录且在线时，检查并同步离线文章
        if (isAuthenticated && navigator.onLine) {
            // 延迟1秒执行同步，避免在页面加载时立即执行
            const timer = setTimeout(syncOfflinePosts, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, createPost]);

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
                    <Routes>
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/search" element={<SearchPage />} />
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
                </Content>
                <Footer className="text-center bg-gray-100 dark:bg-gray-800 py-4">
                    <Text type="secondary" className="text-sm">Blog © {new Date().getFullYear()} Created with Ant Design</Text>
                </Footer>
            </Layout>
        </>
    );
}
