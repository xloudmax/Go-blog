import {useState} from 'react';
import {useSystemAdmin, useAdminNavigation} from '../../hooks';
import {useAppUser} from '../../hooks';
// 导入Ant Design组件
import {
    Card,
    Button,
    Alert,
    Spin,
    Statistic,
    Row,
    Col,
    Typography,
    message,
    Descriptions,
    Space
} from 'antd';
import {
    ReloadOutlined,
    WarningOutlined,
    DatabaseOutlined,
    ApiOutlined,
    ClusterOutlined,
    ClockCircleOutlined,
    CalendarOutlined
} from '@ant-design/icons';

const {Text} = Typography;

export default function SystemManagement() {
    const {isAdmin} = useAppUser();
    const {checkAdminAccess} = useAdminNavigation();

    const {
        dashboard,
        loading,
        error,
        clearCache: handleClearCache,
        rebuildSearchIndex: handleRebuildSearchIndex,
        formatMemoryUsage,
        refetchDashboard,
        refetchStats
    } = useSystemAdmin();

    // 本地状态
    const [operationLoading, setOperationLoading] = useState<string | null>(null);

    // 权限检查
    if (!isAdmin || !checkAdminAccess()) {
        return (
            <Alert
                message="权限不足"
                description="您需要管理员权限才能访问此页面"
                type="warning"
                showIcon
            />
        );
    }

    // 清理缓存
    const handleClearCacheAction = async () => {
        setOperationLoading('cache');
        try {
            await handleClearCache();
            message.success('缓存清理成功！');
        } catch (error: any) {
            message.error(error.message || '清理缓存失败');
        } finally {
            setOperationLoading(null);
        }
    };

    // 重建搜索索引
    const handleRebuildSearchIndexAction = async () => {
        setOperationLoading('search');
        try {
            await handleRebuildSearchIndex();
            message.success('搜索索引重建成功！');
        } catch (error: any) {
            message.error(error.message || '重建搜索索引失败');
        } finally {
            setOperationLoading(null);
        }
    };

    // 刷新数据
    const handleRefreshData = async () => {
        try {
            await Promise.all([
                refetchDashboard(),
                refetchStats()
            ]);
            message.success('数据刷新成功！');
        } catch (error: any) {
            message.error(error.message || '数据刷新失败');
        }
    };

    // 格式化运行时间
    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}天 ${hours}小时 ${minutes}分钟`;
        } else if (hours > 0) {
            return `${hours}小时 ${minutes}分钟`;
        } else {
            return `${minutes}分钟`;
        }
    };

    return (
        <div style={{padding: '24px'}}>
            {/* 加载状态 */}
            {loading && (
                <div style={{textAlign: 'center', padding: '48px'}}>
                    <Spin size="large"/>
                </div>
            )}

            {/* 错误状态 */}
            {error && (
                <Alert
                    message="加载失败"
                    description={error.message}
                    type="error"
                    showIcon
                    action={
                        <Button
                            size="small"
                            onClick={handleRefreshData}
                        >
                            重试
                        </Button>
                    }
                    style={{marginBottom: '24px'}}
                />
            )}

            {/* 服务器信息 */}
            {dashboard && (
                <Row gutter={[16, 16]} style={{marginBottom: '24px'}}>
                    {/* 基本信息 */}
                    <Col xs={24} lg={12}>
                        <Card title="服务器信息" bordered={false}>
                            <Descriptions column={1} layout="horizontal" size="small">
                                <Descriptions.Item label="主机名">
                                    <Text code>{dashboard.hostname}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Go版本">
                                    <Text code>{dashboard.goVersion}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="CPU核心数">
                                    <Space>
                                        <ClusterOutlined/>
                                        <span>{dashboard.cpuCount}</span>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="协程数">
                                    <Space>
                                        <ApiOutlined/>
                                        <span>{dashboard.goroutines}</span>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="运行时间">
                                    <Space>
                                        <ClockCircleOutlined/>
                                        <span>{formatUptime(dashboard.uptime)}</span>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="服务器时间">
                                    <Space>
                                        <CalendarOutlined/>
                                        <span>{new Date(dashboard.serverTime).toLocaleString('zh-CN')}</span>
                                    </Space>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>

                    {/* 内存使用情况 */}
                    <Col xs={24} lg={12}>
                        <Card title="内存使用" bordered={false}>
                            <Descriptions column={1} layout="horizontal" size="small">
                                <Descriptions.Item label="当前分配">
                                    <Text code>{formatMemoryUsage(dashboard.memory.alloc)}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="累计分配">
                                    <Text code>{formatMemoryUsage(dashboard.memory.totalAlloc)}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="系统内存">
                                    <Text code>{formatMemoryUsage(dashboard.memory.sys)}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="堆内存分配">
                                    <Text code>{formatMemoryUsage(dashboard.memory.heapAlloc)}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="堆内存系统">
                                    <Text code>{formatMemoryUsage(dashboard.memory.heapSys)}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* 统计信息 */}
            {dashboard && (
                <Row gutter={[16, 16]} style={{marginBottom: '24px'}}>
                    <Col xs={12} md={6}>
                        <Card>
                            <Statistic
                                title="总用户数"
                                value={dashboard.userCount}
                                valueStyle={{color: '#4f46e5'}}
                            />
                        </Card>
                    </Col>

                    <Col xs={12} md={6}>
                        <Card>
                            <Statistic
                                title="总文章数"
                                value={dashboard.postCount}
                                valueStyle={{color: '#10b981'}}
                            />
                        </Card>
                    </Col>

                    <Col xs={12} md={6}>
                        <Card>
                            <Statistic
                                title="今日注册"
                                value={dashboard.todayRegistrations}
                                valueStyle={{color: '#f59e0b'}}
                            />
                        </Card>
                    </Col>

                    <Col xs={12} md={6}>
                        <Card>
                            <Statistic
                                title="今日文章"
                                value={dashboard.todayPosts}
                                valueStyle={{color: '#3b82f6'}}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* 系统操作 */}
            <Card title="系统维护操作" bordered={false} style={{marginBottom: '24px'}}>
                <Row gutter={[16, 16]}>
                    {/* 缓存管理 */}
                    <Col xs={24} md={12}>
                        <Card
                            title={
                                <Space>
                                    <WarningOutlined style={{color: '#faad14'}}/>
                                    <span>缓存管理</span>
                                </Space>
                            }
                        >
                            <p style={{marginBottom: '16px'}}>
                                清理系统缓存可以释放内存，但可能会暂时影响性能。
                            </p>
                            <Button
                                type="primary"
                                danger
                                loading={operationLoading === 'cache'}
                                onClick={handleClearCacheAction}
                                disabled={!!operationLoading}
                            >
                                {operationLoading === 'cache' ? '清理中...' : '清理缓存'}
                            </Button>
                        </Card>
                    </Col>

                    {/* 搜索索引 */}
                    <Col xs={24} md={12}>
                        <Card
                            title={
                                <Space>
                                    <DatabaseOutlined style={{color: '#1890ff'}}/>
                                    <span>搜索索引</span>
                                </Space>
                            }
                        >
                            <p style={{marginBottom: '16px'}}>
                                重建搜索索引可以提高搜索准确性，但需要一些时间完成。
                            </p>
                            <Button
                                type="primary"
                                loading={operationLoading === 'search'}
                                onClick={handleRebuildSearchIndexAction}
                                disabled={!!operationLoading}
                            >
                                {operationLoading === 'search' ? '重建中...' : '重建索引'}
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </Card>

            {/* 刷新按钮 */}
            <div style={{textAlign: 'center'}}>
                <Button
                    icon={<ReloadOutlined/>}
                    onClick={handleRefreshData}
                    disabled={loading}
                >
                    刷新数据
                </Button>
            </div>
        </div>
    );
}