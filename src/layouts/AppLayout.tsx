import React, { useContext, useMemo, useCallback, useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Layout, 
  Menu, 
  Button, 
  Dropdown, 
  Switch, 
  Avatar,
  Typography,
  Input,
  Drawer,
  Badge,
  Tooltip,
  theme,
  message
} from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  HomeOutlined, 
  FileAddOutlined, 
  FolderOutlined, 
  SettingOutlined, 
  UserOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  SearchOutlined,
  BellOutlined,
  GithubOutlined,
  InfoCircleOutlined,
  BookOutlined,
  ProfileOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { ThemeContext } from '../components/ThemeProvider'
import { useAppUser } from '../hooks/appStateHooks'
import { useBlogActions } from '../api/graphql/blog'
import FilePage from '@/pages/FilePage'
import HomePage from '@/pages/HomePage'
import PostDetailPage from '@/pages/PostDetailPage'
import EditorPage from '@/pages/EditorPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import FoldersPage from '@/pages/FoldersPage'
import AdminPage from '@/pages/admin/AdminPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import offlineStorage from '@/utils/offlineStorage'
import { showErrorNotification } from '@/components/ErrorNotification';

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

export default function AppLayout() {
    const { theme: appTheme, toggle } = useContext(ThemeContext)
    const { user, isAuthenticated, isAdmin, logout } = useAppUser()
    const { createPost } = useBlogActions()
    const navigate = useNavigate()
    const location = useLocation()
    const [drawerOpen, setDrawerOpen] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
    const [hasUnsyncedPosts, setHasUnsyncedPosts] = useState(false)
    theme.useToken();

    // 根据当前路径计算侧边栏选中状态，useMemo 避免重复计算
    const selected = useMemo(() => {
        const path = location.pathname
        if (path === '/') return 'list'
        if (path.startsWith('/editor/posts')) return 'new'
        if (path.startsWith('/admin/folders')) return 'folders'
        if (path.startsWith('/admin')) return 'admin'
        if (path.startsWith('/profile')) return 'profile'
        return ''
    }, [location.pathname])

    // 检查是否有未同步的文章
    useEffect(() => {
        const checkUnsyncedPosts = async () => {
            try {
                const unsynced = await offlineStorage.hasUnsyncedPosts();
                setHasUnsyncedPosts(unsynced);
            } catch (error) {
                console.error('检查未同步文章失败:', error);
            }
        };

        // 初始检查
        checkUnsyncedPosts();

        // 定期检查（每30秒）
        const interval = setInterval(checkUnsyncedPosts, 30000);

        return () => clearInterval(interval);
    }, []);

    // 自动同步离线文章
    useEffect(() => {
        const syncOfflinePosts = async () => {
            if (!isAuthenticated || !navigator.onLine) return;

            try {
                const posts = await offlineStorage.getAllOfflinePosts();
                const unsyncedPosts = posts.filter(post => !post.lastSyncedAt);

                if (unsyncedPosts.length > 0) {
                    message.info(`发现${unsyncedPosts.length}篇离线文章，正在同步...`);

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
                            console.error(`同步文章 ${post.id} 失败:`, error);
                            failCount++;
                        }
                    }

                    if (successCount > 0) {
                        message.success(`成功同步${successCount}篇离线文章`);
                    }

                    if (failCount > 0) {
                        message.error(`${failCount}篇文章同步失败，请检查网络连接后重试`);
                    }

                    // 更新未同步状态
                    setHasUnsyncedPosts(await offlineStorage.hasUnsyncedPosts());
                }
            } catch (error) {
                console.error('同步离线文章失败:', error);
                message.error('离线文章同步失败，请稍后重试');
            }
        };

        // 当用户登录且在线时，检查并同步离线文章
        if (isAuthenticated && navigator.onLine) {
            // 延迟1秒执行同步，避免在页面加载时立即执行
            const timer = setTimeout(syncOfflinePosts, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, createPost]);

    // 回调函数使用 useCallback，防止因重新渲染导致的函数地址变化
    const goEditor = useCallback(() => {
        navigate('/editor/posts')
    }, [navigate])

    const handleLogout = useCallback(async () => {
        try {
            await logout()
            navigate('/')
        } catch (error) {
            showErrorNotification('退出失败', (error as Error).message)
        }
    }, [logout, navigate])

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery)}`)
        }
    }, [searchQuery, navigate])

    // 响应式断点处理
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 992) { // lg断点
                setDrawerOpen(false)
            } else {
                setDrawerOpen(true)
            }
        };

        handleResize(); // 初始化检查
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 侧边栏菜单项
    const menuItems = [
        {
            key: 'list',
            icon: <HomeOutlined />,
            label: <Link to="/">文章列表</Link>,
        },
        ...(isAuthenticated ? [{
            key: 'new',
            icon: <FileAddOutlined />,
            label: <a onClick={goEditor}>新建文章</a>,
        }] : []),
        ...(isAuthenticated ? [{
            key: 'folders',
            icon: <FolderOutlined />,
            label: <Link to="/admin/folders">文件夹管理</Link>,
        }] : []),
        ...(isAuthenticated ? [{
            key: 'profile',
            icon: <ProfileOutlined />,
            label: <Link to="/profile">个人资料</Link>,
        }] : []),
        ...(isAdmin ? [{
            key: 'admin',
            icon: <SettingOutlined />,
            label: <Link to="/admin">管理员控制台</Link>,
        }] : []),
    ];

    // 顶部导航栏菜单项
    const topMenuItems = [
        {
            key: 'list',
            label: <Link to="/">文章列表</Link>,
        },
        ...(isAuthenticated ? [{
            key: 'new',
            label: <Link to="/editor/posts">新建文章</Link>,
        }] : []),
        ...(isAuthenticated ? [{
            key: 'folders',
            label: <Link to="/admin/folders">文件夹管理</Link>,
        }] : []),
        ...(isAuthenticated ? [{
            key: 'profile',
            label: <Link to="/profile">个人资料</Link>,
        }] : []),
        ...(isAdmin ? [{
            key: 'admin',
            label: <Link to="/admin">管理员控制台</Link>,
        }] : []),
    ];

    // 主题切换按钮
    const ThemeToggleButton = () => (
        <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 transition-all responsive-padding-sm">
            <Switch
                checked={appTheme === 'dark'}
                onChange={toggle}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
                className="mx-2"
            />
        </div>
    );

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* 桌面端侧边栏 */}
            <Sider
                collapsible
                collapsed={!drawerOpen}
                onCollapse={(collapsed) => setDrawerOpen(!collapsed)}
                theme="light"
                width={256}
                className="optimized-card hidden lg:block shadow-lg"
            >
                <div className="logo p-4 text-center font-bold text-lg transition-all">
                    <Link to="/">
                        <div className="flex items-center justify-center gap-2">
                            <BookOutlined className="text-primary" />
                            <span className={drawerOpen ? 'block' : 'hidden'}>MyBlog</span>
                        </div>
                    </Link>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[selected]}
                    items={menuItems}
                    className="border-0"
                    style={{
                        width: '100%'
                    }}
                />
                {/* 底部功能区 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 dark:border-neutral-700">
                    {isAuthenticated && (
                        <div className="flex items-center p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 transition-all cursor-pointer mt-3"
                             onClick={() => navigate('/profile')}>
                            {user?.avatar ? (
                                <Avatar src={user.avatar} size="small" />
                            ) : (
                                <Avatar icon={<UserOutlined />} size="small" />
                            )}
                            <Text className={`ml-2 text-sm truncate ${drawerOpen ? 'max-w-[120px]' : 'hidden'}`}>
                                {user?.username || '用户'}
                            </Text>
                            {/* 未同步文章提示 */}
                            {hasUnsyncedPosts && (
                                <Tooltip title="有待同步的离线文章">
                                    <SyncOutlined spin className="ml-1 text-blue-500" />
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
            </Sider>

            {/* 移动端抽屉菜单 */}
            <Drawer
                title="菜单"
                placement="left"
                onClose={() => setMobileDrawerOpen(false)}
                open={mobileDrawerOpen}
                className="lg:hidden"
                width={256}
                classNames={{
                    body: 'p-0',
                    header: 'border-b border-neutral-200 dark:border-neutral-700'
                }}
            >
                <div className="logo p-4 text-center font-bold text-lg mb-4">
                    <Link to="/" onClick={() => setMobileDrawerOpen(false)}>
                        <div className="flex items-center justify-center gap-2">
                            <BookOutlined className="text-primary" />
                            <span>MyBlog</span>
                        </div>
                    </Link>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[selected]}
                    items={menuItems}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="border-0"
                    style={{
                        width: '100%'
                    }}
                />
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    {isAuthenticated && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 mt-3">
                            {user?.avatar ? (
                                <Avatar src={user.avatar} size="small" />
                            ) : (
                                <Avatar icon={<UserOutlined />} size="small" />
                            )}
                            <Text className="ml-2 text-sm truncate max-w-[120px]">
                                {user?.username || '用户'}
                            </Text>
                            <Button
                                type="text"
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                                size="small"
                            >
                                退出
                            </Button>
                        </div>
                    )}
                </div>
            </Drawer>

            <Layout>
                <Header className="flex items-center justify-between px-4 optimized-navbar backdrop-blur-sm shadow-sm home-page-header">
                    <div className="flex items-center">
                        {/* 移动端菜单按钮 */}
                        <Button
                            type="text"
                            icon={<MenuUnfoldOutlined />}
                            onClick={() => setMobileDrawerOpen(true)}
                            className="lg:hidden mr-2"
                            style={{
                                fontSize: '16px',
                                width: 48,
                                height: 48,
                            }}
                        />
                        {/* 桌面端折叠按钮 */}
                        <Button
                            type="text"
                            icon={drawerOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                            onClick={() => setDrawerOpen(!drawerOpen)}
                            className="hidden lg:block mr-2"
                            style={{
                                fontSize: '16px',
                                width: 48,
                                height: 48,
                            }}
                        />
                        <Text className="text-lg font-bold ml-2 hidden md:block">博客首页</Text>
                    </div>

                    {/* 顶部导航菜单 - 优化响应式显示和溢出处理 */}
                    <div className="flex-1 max-w-4xl mx-2">
                        <Menu
                            mode="horizontal"
                            selectedKeys={[selected]}
                            items={topMenuItems}
                            className="optimized-navbar border-0"
                            style={{
                                backgroundColor: 'transparent',
                                lineHeight: '28px',
                                justifyContent: 'flex-end',
                                width: '100%'
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 搜索框移到右侧，缩小尺寸 */}
                        <div className="max-w-xs hidden lg:block">
                            <form onSubmit={handleSearch} className="w-full">
                                <Input
                                    placeholder="搜索文章..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    suffix={<SearchOutlined />}
                                    className="optimized-input"
                                    size="small"
                                />
                            </form>
                        </div>

                        {/* 通知按钮 */}
                        <Tooltip title="通知">
                            <Button
                                type="text"
                                icon={
                                    <Badge count={3} size="small" offset={[0, 0]}>
                                        <BellOutlined />
                                    </Badge>
                                }
                                className="hidden lg:block"
                            />
                        </Tooltip>

                        {/* GitHub按钮 */}
                        <Tooltip title="GitHub">
                            <Button
                                type="text"
                                icon={<GithubOutlined />}
                                className="hidden lg:block"
                                onClick={() => window.open('https://github.com', '_blank')}
                            />
                        </Tooltip>

                        {/* 主题切换按钮 */}
                        <div className="flex items-center">
                            <ThemeToggleButton />
                        </div>

                        {isAuthenticated ? (
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'profile',
                                            label: <Link to="/profile">个人资料</Link>,
                                            icon: <UserOutlined />,
                                        },
                                        ...(isAdmin ? [{
                                            key: 'admin',
                                            label: <Link to="/admin">管理员控制台</Link>,
                                            icon: <SettingOutlined />,
                                        }] : []),
                                        {
                                            key: 'divider',
                                            type: 'divider',
                                        },
                                        {
                                            key: 'about',
                                            label: '关于',
                                            icon: <InfoCircleOutlined />,
                                        },
                                        {
                                            key: 'logout',
                                            icon: <LogoutOutlined />,
                                            label: <button onClick={handleLogout}>退出登录</button>,
                                        },
                                    ],
                                }}
                                placement="bottomRight"
                            >
                                <Button type="text" className="flex items-center gap-2">
                                    {user?.avatar ? (
                                        <Avatar src={user.avatar} size="small" />
                                    ) : (
                                        <Avatar icon={<UserOutlined />} size="small" />
                                    )}
                                    <span className="hidden lg:inline">{user?.username || '用户'}</span>
                                    {/* 未同步文章提示 */}
                                    {hasUnsyncedPosts && (
                                        <Tooltip title="有待同步的离线文章">
                                            <SyncOutlined spin className="ml-1 text-blue-500" />
                                        </Tooltip>
                                    )}
                                </Button>
                            </Dropdown>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button type="text" className="optimized-button">登录</Button>
                                </Link>
                                <Link to="/register">
                                    <Button type="text" className="optimized-button">注册</Button>
                                </Link>
                            </>
                        )}
                        {/* 移动端搜索按钮 */}
                        <Button
                            type="text"
                            icon={<SearchOutlined />}
                            className="lg:hidden"
                            onClick={() => {
                                // 在移动端点击搜索按钮时可以弹出搜索框
                            }}
                        />
                    </div>
                </Header>
                <Content className="m-4 overflow-auto">
                    <div className="bg-white p-4 rounded-lg shadow optimized-card fade-in">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/post/:slug" element={<PostDetailPage />} />
                            <Route path="/posts/:folder/:file" element={<FilePage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/editor/:folder" element={<EditorPage />} />
                            <Route path="/editor/:folder/:file" element={<EditorPage />} />
                            <Route path="/admin/folders" element={<FoldersPage />} />
                            <Route path="/admin/*" element={<AdminPage />} />
                            <Route
                                path="*"
                                element={
                                    <div className="text-center mt-10 fade-in">
                                        <p className="text-lg">页面未找到</p>
                                        <Link to="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                                            返回文章列表
                                        </Link>
                                    </div>
                                }
                            />
                        </Routes>
                    </div>
                </Content>
                <Footer className="text-center bg-gray-100 dark:bg-gray-800 py-4">
                    <Text type="secondary" className="text-sm">MyBlog ©{new Date().getFullYear()} Created with Ant Design</Text>
                </Footer>
            </Layout>
        </Layout>
    );
}