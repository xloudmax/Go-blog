import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  SearchOutlined, 
  HomeOutlined, 
  BellOutlined, 
  SettingOutlined, 
  PlusOutlined,
  RightOutlined,
  FileTextOutlined,
  BookOutlined,
  FormOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
  CloudSyncOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import { useAppUser } from '@/hooks';
import { useUnreadNotificationCount } from '@/api/graphql/notification';
import { useNotionSync } from '@/api/graphql/admin';

interface SidebarProps {
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
  className?: string;
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isDarkMode = false, 
  onThemeToggle,
  className = "",
  isCollapsed = false,
  onCollapse
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, isAdmin } = useAppUser();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.unreadNotificationCount || 0;
  
  const { syncNotion, loading: notionLoading } = useNotionSync();

  const handleSyncNotion = async () => {
    try {
      const result = await syncNotion();
      if (result?.success) {
        message.success('Sync started successfully');
      } else {
        message.error(result?.message || 'Sync failed');
      }
    } catch (err) {
      message.error('An error occurred during sync');
    }
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    favorites: true,
    private: true,
    team: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const MenuItem = ({ icon, label, path, badge, onClick, rightIcon }: any) => (
    <div 
      className={`
        group flex items-center px-3 py-1 min-h-[28px] text-sm cursor-pointer select-none
        transition-colors duration-100 rounded-sm mx-1
        ${isActive(path) 
          ? 'bg-neutral-200 dark:bg-[#2c2c2c] text-neutral-900 dark:text-[#d4d4d4] font-medium' 
          : 'text-neutral-600 dark:text-[#9b9b9b] hover:bg-neutral-100 dark:hover:bg-[#2a2a2a]'}
      `}
      onClick={() => onClick ? onClick() : navigate(path)}
    >
      <span className="flex items-center justify-center w-5 h-5 mr-1 text-lg opacity-80">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span className="flex items-center justify-center min-w-[16px] h-4 px-1 ml-auto text-xs font-bold text-white bg-red-500 rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
       {rightIcon && (
        <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-xs text-neutral-400">
          {rightIcon}
        </span>
      )}
    </div>
  );

  const SectionHeader = ({ title, sectionKey }: any) => (
    <div 
      className="flex items-center px-4 py-1 mt-4 mb-1 text-xs font-semibold text-neutral-500 dark:text-[#6b6b6b] hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] cursor-pointer select-none transition-colors"
      onClick={() => toggleSection(sectionKey)}
    >
      <span className="mr-1 text-[10px] transition-transform duration-200" style={{ transform: expandedSections[sectionKey] ? 'rotate(90deg)' : 'rotate(0deg)' }}>
        <RightOutlined />
      </span>
      <span>{title}</span>
      <PlusOutlined className="ml-auto opacity-0 hover:opacity-100 text-[10px]" />
    </div>
  );

  if (isCollapsed) {
    return (
      <div 
        className={`flex flex-col items-center h-full py-4 border-r ${className}`}
        style={{
          backgroundColor: isDarkMode ? 'rgba(32, 32, 32, 0.85)' : 'rgba(247, 247, 245, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="mb-4 cursor-pointer" onClick={() => onCollapse?.(false)}>
          <MenuUnfoldOutlined className="text-lg text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200" />
        </div>
        <div className="flex flex-col gap-4 mt-2">
           <SearchOutlined className="text-xl text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 cursor-pointer" onClick={() => navigate('/search')} />
           <HomeOutlined className="text-xl text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 cursor-pointer" onClick={() => navigate('/home')} />
           <div className="relative cursor-pointer" onClick={() => navigate('/notifications')}>
             <BellOutlined className="text-xl text-neutral-500 hover:text-neutral-800 dark:text-neutral-400" />
             {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
           </div>
           {onThemeToggle && (
             <div onClick={onThemeToggle} className="cursor-pointer mt-auto">
                {isDarkMode ? <SunOutlined className="text-xl text-neutral-400" /> : <MoonOutlined className="text-xl text-neutral-500" />}
             </div>
           )}
            {isAdmin && (
              <div onClick={handleSyncNotion} className="cursor-pointer">
                 <CloudSyncOutlined spin={notionLoading} className="text-xl text-neutral-500 hover:text-neutral-800 dark:text-neutral-400" />
              </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col h-full border-r transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: isDarkMode ? 'rgba(32, 32, 32, 0.85)' : 'rgba(247, 247, 245, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Workspace Switcher / Header */}
      <div className="flex items-center px-4 py-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] transition-colors">
        <div className="flex items-center justify-center w-6 h-6 mr-2 text-sm font-bold text-white bg-blue-500 rounded">
          {user?.username?.[0]?.toUpperCase() || 'X'}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-sm font-medium text-neutral-700 dark:text-[#d4d4d4] truncate">
            {user?.username ? `${user.username}'s base` : 'My Workspace'}
          </div>
        </div>
        <div className="flex items-center text-xs text-neutral-400">
           <span className="mr-2" onClick={(e) => { e.stopPropagation(); onCollapse?.(true); }}>
              <MenuFoldOutlined />
           </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col py-1">
        <MenuItem icon={<SearchOutlined />} label="Search" path="/search" />
        <MenuItem icon={<HomeOutlined />} label="Home" path="/home" />
        {isAuthenticated && (
          <MenuItem 
            icon={<BellOutlined />} 
            label="Inbox" 
            path="/notifications" 
            badge={unreadCount} 
          />
        )}
        {isAuthenticated && (
           <MenuItem icon={<SettingOutlined />} label="Settings" path="/profile" />
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Favorites Section */}
        <SectionHeader title="Favorites" sectionKey="favorites" />
        {expandedSections.favorites && (
          <div className="flex flex-col pb-2">
            {/* Placeholder for favorites */}
            <div className="px-5 py-1 text-xs text-neutral-400 italic">No favorites yet</div>
             {isAdmin && (
               <MenuItem 
                 icon={<CloudSyncOutlined spin={notionLoading} />} 
                 label="Sync Notion" 
                 onClick={handleSyncNotion}
               />
            )}
          </div>
        )}

        {/* Private Section */}
        <SectionHeader title="Private" sectionKey="private" />
        {expandedSections.private && (
          <div className="flex flex-col pb-2">
            <MenuItem icon={<FileTextOutlined />} label="All Posts" path="/home" />
            <MenuItem icon={<BookOutlined />} label="Tags & Categories" path="/tags" />
            {isAuthenticated && (
              <MenuItem icon={<FormOutlined />} label="Drafts" path="/editor/posts" />
            )}
            {isAdmin && (
              <MenuItem icon={<SettingOutlined />} label="Admin Dashboard" path="/admin" />
            )}
             {isAdmin && (
               <MenuItem 
                 icon={<CloudSyncOutlined spin={notionLoading} />} 
                 label="Sync Notion" 
                 onClick={handleSyncNotion}
               />
            )}
          </div>
        )}

        {/* Teamspaces Section (Placeholder) */}
        <SectionHeader title="Teamspaces" sectionKey="team" />
        {expandedSections.team && (
          <div className="flex flex-col pb-2">
             <div className="px-5 py-1 text-xs text-neutral-400">
                Create a teamspace to share content with your team.
             </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto border-t border-[#e9e9e8] dark:border-[#2f2f2f]">
        <div 
           className="flex items-center px-4 py-3 text-sm text-neutral-600 dark:text-[#9b9b9b] cursor-pointer hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] transition-colors"
           onClick={() => navigate(isAuthenticated ? '/editor/posts' : '/login')}
        >
          <PlusOutlined className="mr-2" />
          <span>New Page</span>
        </div>
        {onThemeToggle && (
            <div 
            className="flex items-center px-4 py-2 text-sm text-neutral-600 dark:text-[#9b9b9b] cursor-pointer hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] transition-colors"
            onClick={onThemeToggle}
            >
            {isDarkMode ? <SunOutlined className="mr-2" /> : <MoonOutlined className="mr-2" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
