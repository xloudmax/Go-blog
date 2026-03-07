import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeOutlined,
  SearchOutlined,
  AppstoreOutlined,
  DeploymentUnitOutlined,
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
    { key: 'insight', icon: <DeploymentUnitOutlined />, label: 'Insight', path: '/insight' },
    { key: 'tags', icon: <AppstoreOutlined />, label: '分类', path: '/tags' },
    { 
      key: 'profile', 
      icon: user?.avatar ? (
        <div 
            className="w-6 h-6 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700 shadow-sm"
            style={{ backgroundImage: `url(${user.avatar})` }}
        />
      ) : <UserOutlined />, 
      label: '我的', 
      path: isAuthenticated ? '/profile' : '/login' 
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden pointer-events-none">
      <div 
        className="mx-auto max-w-md w-full overflow-hidden pointer-events-auto shadow-2xl"
        style={{
          borderRadius: '24px',
          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.4)'}`,
          boxShadow: isDarkMode 
            ? '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)' 
            : '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="flex justify-around items-center h-16 px-3 relative">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <div
                key={item.key}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center w-full h-full gap-1 z-10 cursor-pointer active:scale-90 transition-transform duration-200"
              >
                <div 
                  className="text-xl leading-none flex items-center justify-center transition-all duration-300"
                  style={{
                    color: active
                      ? isDarkMode ? '#ffffff' : '#000000'
                      : isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
                    transform: active ? 'translateY(-2px)' : 'none',
                    filter: active ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' : 'none',
                  }}
                >
                  {item.icon}
                </div>
                <span 
                  className="text-[10px] font-semibold leading-none transition-all duration-300"
                  style={{
                    color: active
                      ? isDarkMode ? '#ffffff' : '#000000'
                      : isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
                    opacity: active ? 1 : 0.8,
                  }}
                >
                  {item.label}
                </span>

                {/* Liquid Glass Selection Box */}
                {active && (
                  <motion.div
                    layoutId="liquid-glass-indicator"
                    className="absolute inset-x-1 inset-y-2 z-[-1] overflow-hidden"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8
                    }}
                    style={{
                      borderRadius: '16px',
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(10px) brightness(1.1)',
                      WebkitBackdropFilter: 'blur(10px) brightness(1.1)',
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)'}`,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Inner highlight for "liquid" feel */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-50" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* iOS Home Indicator Spacer */}
      <div className="h-[env(safe-area-inset-bottom)] mt-2" />
    </div>
  );
};

export default MobileBottomBar;
