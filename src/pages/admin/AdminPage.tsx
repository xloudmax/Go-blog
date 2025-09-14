import {
  Menu, 
  Typography, 
  Card, 
  Result 
} from 'antd';
import { useAdminNavigation } from '../../hooks';
import { useAppUser } from '../../hooks';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import InviteCodeManagement from './InviteCodeManagement';
import SystemManagement from './SystemManagement';

const { Title } = Typography;

export default function AdminPage() {
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
      case 'invites':
        return <InviteCodeManagement />;
      case 'system':
        return <SystemManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900" style={{ padding: '0 40px', boxSizing: 'border-box' }}>
      <div className="max-w-7xl mx-auto py-12">
        {/* 页面标题在容器外 */}
        <div className="mb-8">
          <Title level={2} className="mb-4 text-gray-900 dark:text-gray-100">
            管理员控制台
          </Title>
          <Typography.Paragraph type="secondary" className="mb-0">
            系统管理和数据维护
          </Typography.Paragraph>
        </div>

        {/* 导航菜单 */}
        <Card className="mb-6 mx-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Menu
                mode="horizontal"
                selectedKeys={[currentTab]}
                items={navigationItems.map(item => ({
                  key: item.id,
                  label: item.label,
                  onClick: () => setCurrentTab(item.id as typeof currentTab)
                }))}
                theme="light"
                style={{
                  backgroundColor: 'transparent',
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
        <Card className="mx-8">
          {/* 统一的页面标题 */}
          <div style={{ marginBottom: '24px' }}>
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
            {currentTab === 'invites' && (
              <>
                <Title level={3} style={{ margin: '0 0 8px 0' }}>邀请码管理</Title>
                <Typography.Text type="secondary">创建和管理邀请码</Typography.Text>
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