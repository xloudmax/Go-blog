import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tooltip } from 'antd';
import { LiquidGlass } from './LiquidKit/glass';
import {
  FileTextOutlined,
  SearchOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  EditOutlined,
  BookOutlined,
  LogoutOutlined,
  BellOutlined,
  DeploymentUnitOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useAppUser } from '@/hooks';
import { useUnreadNotificationCount } from '@/api/graphql/notification';

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path?: string;
  onClick?: () => void;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

interface IconSidebarProps {
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
}

const IconSidebar: React.FC<IconSidebarProps> = ({ isDarkMode = false, onThemeToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAppUser();

  // 获取未读通知数量
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.unreadNotificationCount || 0;

  // 顶部导航菜单项
  const topMenuItems: MenuItem[] = [
    {
      key: 'posts',
      icon: <FileTextOutlined />,
      label: '文章',
      path: '/home',
    },
    {
      key: 'tags',
      icon: <BookOutlined />,
      label: '标签分类',
      path: '/tags',
    },
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: '搜索',
      path: '/search',
    },
    {
      key: 'insight',
      icon: <DeploymentUnitOutlined />,
      label: '知识洞察',
      path: '/insight',
    },
    {
      key: 'liquid-glass',
      icon: <ExperimentOutlined />,
      label: '液态玻璃测试',
      path: '/liquid-glass',
    },
    ...(isAuthenticated ? [{
      key: 'notifications',
      icon: <BellOutlined />,
      label: '通知中心',
      path: '/notifications',
      requireAuth: true,
    }] : []),
    ...(isAuthenticated ? [{
      key: 'editor',
      icon: <EditOutlined />,
      label: '写文章',
      path: '/editor/posts',
      requireAuth: true,
    }] : []),
    ...(isAdmin ? [{
      key: 'admin',
      icon: <SettingOutlined />,
      label: '管理员控制台',
      path: '/admin',
      requireAdmin: true,
    }] : []),
  ];

  // 过滤菜单项
  const filterMenuItems = (items: MenuItem[]) => {
    return items.filter(item => {
      if (item.requireAdmin && !isAdmin) return false;
      return !(item.requireAuth && !isAuthenticated);
    });
  };

  const filteredTopItems = filterMenuItems(topMenuItems);

  // 判断是否为当前路径
  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // 菜单项点击处理
  const handleItemClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // 渲染菜单项的通用组件
  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.path);
    return (
      <Tooltip key={item.key} title={item.label} placement="right">
        <div
          onClick={() => handleItemClick(item)}
          className={`w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-200 rounded-xl
            ${active 
              ? (isDarkMode ? 'text-white bg-white/10' : 'text-gray-900 bg-black/5') 
              : (isDarkMode ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-black/5')
            }`}
          style={{ position: 'relative' }}
        >
          <span style={{ fontSize: '24px' }}>{item.icon}</span>
          {/* 通知红点徽章 */}
          {item.key === 'notifications' && unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                backgroundColor: '#ff4d4f',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '0 5px',
                fontSize: '10px',
                fontWeight: 'bold',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="fixed left-0 top-0 h-screen z-50 pointer-events-none">
      <LiquidGlass
        blur={0.4}
        glassThickness={60}
        refractiveIndex={1.25}
        bezelWidth={10}
        specularOpacity={0.3}
        style={{
          width: '72px',
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          padding: '1.5rem 0',
          pointerEvents: 'auto',
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
        }}
        className={`border-r shadow-2xl ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}
      >
      {/* 顶部：Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '1rem' }}>
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <Tooltip title="Blog" placement="right">
            <div
              className="w-11 h-11 flex items-center justify-center transition-all"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
              }}
            >
              <span className="font-bold" style={{ fontSize: '24px' }}>B</span>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* 中间：菜单项（可滚动） */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: '1rem',
          paddingBottom: '1rem',
        }}
      >
        {filteredTopItems.map(renderMenuItem)}
      </div>

      {/* 底部：主题切换 + 用户头像 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          paddingTop: '1rem',
        }}
      >
        {/* 主题切换 */}
        {onThemeToggle && (
            <div className="flex flex-col items-center gap-4">
          <Tooltip title={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'} placement="right">
            <div
              onClick={onThemeToggle}
              className="w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-200"
              style={{
                color: isDarkMode ? '#6b7280' : '#9ca3af',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDarkMode ? '#6b7280' : '#9ca3af';
              }}
            >
              <span style={{ fontSize: '24px' }}>
                {isDarkMode ? <SunOutlined /> : <MoonOutlined />}
              </span>
            </div>
          </Tooltip>
          </div>
        )}

        {/* 退出登录 */}
        {isAuthenticated && (
          <Tooltip title="退出登录" placement="right">
            <div
              onClick={() => logout()}
              className="w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-200 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
              style={{
                fontSize: '24px',
              }}
            >
              <LogoutOutlined />
            </div>
          </Tooltip>
        )}

        {/* 用户头像 */}
        {isAuthenticated && user && (
          <Tooltip title={user.username || '用户'} placement="right">
            <div
              onClick={() => navigate('/profile')}
              className="cursor-pointer transition-all duration-200"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...(user.avatar
                  ? {
                      backgroundImage: `url(${user.avatar})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }
                  : {
                      backgroundColor: isDarkMode ? '#2a2a2a' : '#f3f4f6',
                    }
                ),
              }}
            >
              {!user.avatar && (
                <span
                  style={{
                    color: isDarkMode ? '#ffffff' : '#111827',
                    fontSize: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </Tooltip>
        )}
      </div>
      </LiquidGlass>
    </div>
  );
};

export default IconSidebar;
