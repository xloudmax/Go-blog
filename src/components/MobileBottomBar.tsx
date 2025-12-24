import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UserOutlined
} from '@ant-design/icons';
import { ThemeContext } from './ThemeProvider';
import { useAppUser } from '@/hooks';

const MobileBottomBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
  const { isAuthenticated, user } = useAppUser();
  const isDarkMode = theme === 'dark';

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/home' && location.pathname.startsWith(path));
  };

  const navItems = [
    { key: 'home', icon: <HomeOutlined />, label: '首页', path: '/home' },
    { key: 'search', icon: <SearchOutlined />, label: '搜索', path: '/search' },
    { key: 'tags', icon: <AppstoreOutlined />, label: '分类', path: '/tags' },
    { 
      key: 'profile', 
      icon: user?.avatar ? (
        <div 
            className="w-6 h-6 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700"
            style={{ backgroundImage: `url(${user.avatar})` }}
        />
      ) : <UserOutlined />, 
      label: '我的', 
      path: isAuthenticated ? '/profile' : '/login' 
    },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
      style={{
        backgroundColor: isDarkMode ? 'rgba(26, 26, 26, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
      }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
              style={{
                color: active
                  ? isDarkMode ? '#ffffff' : '#3b82f6'
                  : isDarkMode ? '#6b7280' : '#9ca3af',
              }}
            >
              <div className="text-xl leading-none">
                {item.icon}
              </div>
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomBar;
