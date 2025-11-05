import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tooltip } from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  EditOutlined,
  BookOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAppUser } from '@/hooks';
import { useUnreadNotificationCount } from '@/api/graphql/notification';

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
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
  const { isAuthenticated, isAdmin, user } = useAppUser();

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
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // 菜单项点击处理
  const handleItemClick = (path: string) => {
    navigate(path);
  };

  // 渲染菜单项的通用组件
  const renderMenuItem = (item: MenuItem) => (
    <Tooltip key={item.key} title={item.label} placement="right">
      <div
        onClick={() => handleItemClick(item.path)}
        className="w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-200"
        style={{
          color: isActive(item.path)
            ? isDarkMode ? '#ffffff' : '#111827'
            : isDarkMode ? '#6b7280' : '#9ca3af',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#111827';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isActive(item.path)
            ? isDarkMode ? '#ffffff' : '#111827'
            : isDarkMode ? '#6b7280' : '#9ca3af';
        }}
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

  return (
    <div
      className="fixed left-0 top-0 h-screen z-50"
      style={{
        width: '72px',
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderRight: `1px solid ${isDarkMode ? '#2a2a2a' : '#e5e7eb'}`,
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        padding: '1rem 0',
      }}
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
    </div>
  );
};

export default IconSidebar;
