import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  HomeOutlined,
  SearchOutlined,
  AppstoreOutlined,
  DeploymentUnitOutlined,
  UserOutlined
} from '@ant-design/icons';
import { ThemeContext } from './ThemeProvider';
import { useAppUser } from '@/hooks';

// Tauri API
let emit: any;
let listen: any;

if (window.__TAURI_INTERNALS__) {
  import('@tauri-apps/api/event').then(mod => { 
    emit = mod.emit; 
    listen = mod.listen; 
  });
}

const MobileBottomBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
  const { isAuthenticated, user } = useAppUser();
  const isDarkMode = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);

  const [isIOS, setIsIOS] = useState(false);

  const navItems = [
    { key: 'home', icon: <HomeOutlined />, label: '首页', path: '/home' },
    { key: 'search', icon: <SearchOutlined />, label: '搜索', path: '/search' },
    { key: 'insight', icon: <DeploymentUnitOutlined />, label: 'Insight', path: '/insight' },
    { key: 'tags', icon: <AppstoreOutlined />, label: '分类', path: '/tags' },
    { key: 'profile', icon: user?.avatar ? <div className="w-6 h-6 rounded-full bg-cover" style={{ backgroundImage: `url(${user.avatar})` }} /> : <UserOutlined />, label: '我的', path: isAuthenticated ? '/profile' : '/login' },
  ];

  const activeIndex = navItems.findIndex(item => 
    location.pathname === item.path || (item.path !== '/home' && location.pathname.startsWith(item.path))
  );

  useEffect(() => {
    const checkPlatform = async () => {
      if (window.__TAURI_INTERNALS__) {
        try {
          const { type } = await import('@tauri-apps/plugin-os');
          if (type() === 'ios') {
            setIsIOS(true);
            if (emit) emit('show-native-bar');
          }
        } catch (e) { console.error(e); }
      }
    };
    checkPlatform();
  }, []);

  useEffect(() => {
    if (isIOS && listen) {
      const unlisten = listen('tab-changed', (event: any) => {
        navigate(navItems[event.payload.index]?.path || '/home');
      });
      return () => { unlisten.then((f: any) => f()); };
    }
  }, [isIOS, isAuthenticated, navigate]);

  if (isIOS) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] md:hidden">
      <div 
        ref={containerRef}
        className="mx-auto max-w-md w-full h-16 overflow-hidden shadow-2xl relative select-none touch-none"
        style={{
          borderRadius: '24px',
          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.4)'}`,
        }}
      >
        {/* 1. 底层：内容显示层 (不接收事件) */}
        <div className="flex justify-around items-center h-full px-3 relative z-10 pointer-events-none">
          {navItems.map((item, index) => (
            <div key={item.key} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <div className="text-xl" style={{ color: activeIndex === index ? (isDarkMode ? '#fff' : '#000') : 'rgba(128,128,128,0.5)' }}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold" style={{ opacity: activeIndex === index ? 1 : 0.5 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* 2. 顶层：真正的拖拽滑块 (在图标上方，捕获所有点击和拖拽) */}
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0.05}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const dropX = info.point.x - rect.left;
            const tabWidth = rect.width / navItems.length;
            const nextIndex = Math.max(0, Math.min(navItems.length - 1, Math.floor(dropX / tabWidth)));
            navigate(navItems[nextIndex].path);
          }}
          // 点击非当前项也触发跳转
          onTap={(event, info) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const tapX = info.point.x - rect.left;
            const tabWidth = rect.width / navItems.length;
            const nextIndex = Math.max(0, Math.min(navItems.length - 1, Math.floor(tapX / tabWidth)));
            navigate(navItems[nextIndex].path);
          }}
          animate={{
            x: activeIndex * ((containerRef.current?.offsetWidth || 0) / navItems.length)
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="absolute top-2 bottom-2 left-1 z-50 cursor-grab active:cursor-grabbing"
          style={{
            width: `calc(${100 / navItems.length}% - 8px)`,
            borderRadius: '16px',
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.7)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)'}`,
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          }}
        >
          {/* 装饰用的液态高光 */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 rounded-[inherit]" />
        </motion.div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] mt-2" />
    </div>
  );
};

export default MobileBottomBar;
