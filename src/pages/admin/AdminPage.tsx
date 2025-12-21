import {
  Menu,
  Typography,
  Card,
  Result
} from 'antd';
import { useAdminNavigation } from '../../hooks';
import { useAppUser } from '../../hooks';
import { useTheme } from '@/components/ThemeProvider';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import InviteCodeManagement from './InviteCodeManagement';
import SystemManagement from './SystemManagement';
import PostManagement from './PostManagement';
import CommentManagement from './CommentManagement';
import SearchAnalytics from './SearchAnalytics';
import TagManagement from './TagManagement';

const { Title } = Typography;

export default function AdminPage() {
  const { isDarkMode } = useTheme();
  const { isAdmin } = useAppUser();
  const { currentTab, setCurrentTab, navigationItems, checkAdminAccess } = useAdminNavigation();
  
  // 权限检查
  if (!isAdmin || !checkAdminAccess()) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="您需要管理员权限才能访问此页面"
      />
    );
  }
  
  // 渲染对应的组件
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'posts':
        return <PostManagement />;
      case 'comments':
        return <CommentManagement />;
      case 'invites':
        return <InviteCodeManagement />;
      case 'tags':
        return <TagManagement />;
      case 'analytics':
        return <SearchAnalytics />;
      case 'system':
        return <SystemManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        padding: '0 12px', 
        boxSizing: 'border-box',
        backgroundColor: 'transparent'
      }}
    >
      <div className="w-full max-w-[2400px] mx-auto py-8">
        {/* 页面标题在容器外 */}
        <div className="mb-6">
          <Title level={2} className="mb-2" style={{ color: isDarkMode ? '#f9fafb' : '#374151' }}>
            管理员控制台
          </Title>
          <Typography.Paragraph type="secondary" className="mb-0">
            系统管理和数据维护
          </Typography.Paragraph>
        </div>

        {/* 导航菜单 */}
        <Card className="mb-5 optimized-card" bodyStyle={{ padding: '0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <Menu
                mode="horizontal"
                selectedKeys={[currentTab]}
                items={navigationItems.map(item => ({
                  key: item.id,
                  label: item.label,
                  onClick: () => setCurrentTab(item.id as typeof currentTab)
                }))}
                theme={isDarkMode ? 'dark' : 'light'}
                style={{
                  backgroundColor: 'transparent',
                  borderBottom: 'none',
                  lineHeight: '48px',
                  minWidth: '150px',
                  justifyContent: 'flex-start',
                  flex: 1
                }}
              />
            </div>
          </div>
        </Card>

        {/* 内容区域 */}
        <Card className="optimized-card">
          {/* 统一的页面标题 */}
          <div style={{ marginBottom: '24px' }}>
            {/* 标题部分保持不变 */}
            {currentTab === 'dashboard' && (
              <>
                <Title level={3} style={{ margin: '0 0 8px 0' }}>仪表盘</Title>
                <Typography.Text type="secondary">系统概览和统计信息</Typography.Text>
              </>
            )}
            {currentTab === 'users' && (
              <>
                <Title level={3} style={{ margin: '0 0 8px 0' }}>用户管理</Title>
                <Typography.Text type="secondary">管理系统用户和权限</Typography.Text>
              </>
            )}
            {/* ... other tabs ... */}
            {currentTab === 'posts' && (
              <>
                <Title level={3} style={{ margin: '0 0 8px 0' }}>文章管理</Title>
                <Typography.Text type="secondary">管理博客文章内容和状态</Typography.Text>
              </>
            )}
            {currentTab === 'comments' && (
              <>
                <Title level={3} style={{ margin: '0 0 8px 0' }}>评论管理</Title>
                <Typography.Text type="secondary">审核和管理用户评论</Typography.Text>
              </>
            )}
            {currentTab === 'invites' && (
              <>
                <Title level={3} style={{ margin: '0 0 8px 0' }}>邀请码管理</Title>
                <Typography.Text type="secondary">创建和管理邀请码</Typography.Text>
              </>
            )}
            {currentTab === 'tags' && (
              <>
                <Title level={3} style={{ margin: '0 0 8px 0' }}>标签管理</Title>
                <Typography.Text type="secondary">管理标签和分类，合并重复项</Typography.Text>
              </>
            )}
            {currentTab === 'analytics' && (
              <>
                <Title level={3} style={{ margin: '0 0 8px 0' }}>搜索分析</Title>
                <Typography.Text type="secondary">搜索统计和趋势分析</Typography.Text>
              </>
            )}
            {currentTab === 'system' && (
              <>
                <Title level={3} style={{ margin: '0 0 8px 0' }}>系统管理</Title>
                <Typography.Text type="secondary">服务器信息和系统维护操作</Typography.Text>
              </>
            )}
          </div>
          {renderContent()}
        </Card>
      </div>
    </div>
  );
}
