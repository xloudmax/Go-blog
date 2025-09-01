import {useState} from 'react';
import {
    Button,
    Input,
    Select,
    Table,
    Alert,
    Modal,
    Form,
    Card,
    Typography,
    Avatar,
    Tag,
    Statistic,
    Row,
    Col,
    message,
    Dropdown,
    Space,
    Checkbox
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    UserOutlined,
    MailOutlined,
    LockOutlined
} from '@ant-design/icons';
import {useUserAdmin, useAdminNavigation} from '../../hooks';
import {useAppUser} from '../../hooks';
import {UserRole, AdminCreateUserInput} from '../../generated/graphql';

const {Text} = Typography;
const {Option} = Select;

// 用户类型定义
interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
    avatar?: string;
    bio?: string;
    lastLoginAt?: string;
    createdAt: string;
    postsCount?: number;
}

export default function UserManagement() {
    const {isAdmin} = useAppUser();
    const {checkAdminAccess} = useAdminNavigation();

    const {
        users,
        userStats,
        loading,
        error,
        search,
        setSearch,
        roleFilter,
        setRoleFilter,
        verifiedFilter,
        setVerifiedFilter,
        createUser,
        updateUser,
        deleteUser,
        batchUpdateUsers,
        refetch
    } = useUserAdmin();

    // 本地状态
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [newUserData, setNewUserData] = useState<AdminCreateUserInput>({
        username: '',
        email: '',
        password: '',
        role: 'USER' as UserRole,
        isVerified: false
    });

    // 权限检查
    if (!isAdmin || !checkAdminAccess()) {
        return (
            <Alert message="您需要管理员权限才能访问此页面" type="warning" showIcon/>
        );
    }

    // 创建用户
    const handleCreateUser = async () => {
        try {
            await createUser(newUserData);
            setShowCreateModal(false);
            setNewUserData({
                username: '',
                email: '',
                password: '',
                role: 'USER' as UserRole,
                isVerified: false
            });
            message.success('用户创建成功');
        } catch (error: any) {
            message.error(error.message || '创建用户失败');
        }
    };

    // 更新用户
    const handleUpdateUser = async () => {
        if (!currentUser) return;

        try {
            await updateUser(currentUser.id, {
                username: currentUser.username,
                email: currentUser.email,
                role: currentUser.role,
                isVerified: currentUser.isVerified,
                isActive: currentUser.isActive
            });
            setShowEditModal(false);
            setCurrentUser(null);
            message.success('用户更新成功');
        } catch (error: any) {
            message.error(error.message || '更新用户失败');
        }
    };

    // 删除用户
    const handleDeleteUser = async (userId: string, username: string) => {
        try {
            await deleteUser(userId);
            message.success(`用户 "${username}" 删除成功`);
        } catch (error: any) {
            message.error(error.message || '删除用户失败');
        }
    };

    // 批量操作
    const handleBatchAction = async (action: 'activate' | 'deactivate' | 'verify' | 'unverify') => {
        if (selectedUsers.length === 0) {
            message.warning('请先选择要操作的用户');
            return;
        }

        const updates: any = {};
        switch (action) {
            case 'activate':
                updates.isActive = true;
                break;
            case 'deactivate':
                updates.isActive = false;
                break;
            case 'verify':
                updates.isVerified = true;
                break;
            case 'unverify':
                updates.isVerified = false;
                break;
        }

        try {
            await batchUpdateUsers(selectedUsers, updates);
            setSelectedUsers([]);
            message.success('批量操作成功');
        } catch (error: any) {
            message.error(error.message || '批量操作失败');
        }
    };

    // 格式化日期
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* 统计信息 */}
            <div>
                <Row gutter={16}>
                    <Col span={6}>
                        <Card className="optimized-card">
                            <Statistic title="总用户数" value={userStats.total}/>
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="optimized-card">
                            <Statistic title="管理员" value={userStats.admins}/>
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="optimized-card">
                            <Statistic title="已验证" value={userStats.verified}
                                       suffix={`(${userStats.verificationRate.toFixed(1)}%)`}/>
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="optimized-card">
                            <Statistic title="活跃用户" value={userStats.active}
                                       suffix={`(${userStats.activeRate.toFixed(1)}%)`}/>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* 操作栏 */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* 搜索框 */}
                    <Input
                        placeholder="搜索用户名或邮箱..."
                        prefix={<SearchOutlined/>}
                        style={{width: 256}}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="optimized-input"
                    />

                    {/* 筛选器 */}
                    <Select
                        style={{width: 120}}
                        value={roleFilter || undefined}
                        onChange={(value) => setRoleFilter(value as UserRole || undefined)}
                        placeholder="全部角色"
                        className="optimized-input"
                    >
                        <Option value={undefined}>全部角色</Option>
                        <Option value={'USER' as UserRole}>普通用户</Option>
                        <Option value={'ADMIN' as UserRole}>管理员</Option>
                    </Select>

                    <Select
                        style={{width: 120}}
                        value={verifiedFilter}
                        onChange={(value) => setVerifiedFilter(value)}
                        placeholder="全部状态"
                        className="optimized-input"
                    >
                        <Option value={undefined}>全部状态</Option>
                        <Option value={true}>已验证</Option>
                        <Option value={false}>未验证</Option>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    {/* 批量操作 */}
                    {selectedUsers.length > 0 && (
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'activate',
                                        label: '激活用户',
                                        onClick: () => handleBatchAction('activate')
                                    },
                                    {
                                        key: 'deactivate',
                                        label: '停用用户',
                                        onClick: () => handleBatchAction('deactivate')
                                    },
                                    {
                                        key: 'verify',
                                        label: '验证邮箱',
                                        onClick: () => handleBatchAction('verify')
                                    },
                                    {
                                        key: 'unverify',
                                        label: '取消验证',
                                        onClick: () => handleBatchAction('unverify')
                                    }
                                ]
                            }}
                        >
                            <Button className="optimized-button">批量操作 ({selectedUsers.length})</Button>
                        </Dropdown>
                    )}

                    {/* 创建用户按钮 */}
                    <Button
                        type="primary"
                        icon={<PlusOutlined/>}
                        onClick={() => setShowCreateModal(true)}
                        className="optimized-button"
                    >
                        创建用户
                    </Button>
                </div>
            </div>

            {/* 用户列表 */}
            {loading ? (
                <div style={{textAlign: 'center', padding: '48px'}}>
                    <div className="loading-spinner"></div>
                </div>
            ) : error ? (
                <Alert
                    message="加载失败"
                    description={error.message}
                    type="error"
                    showIcon
                    action={
                        <Button size="small" onClick={() => refetch()} className="optimized-button">
                            重试
                        </Button>
                    }
                />
            ) : (
                <Table
                    rowKey="id"
                    dataSource={users}
                    columns={[
                        {
                            title: '用户信息',
                            key: 'userInfo',
                            render: (_, user: User) => (
                                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                    {user.avatar && (
                                        <Avatar src={user.avatar} size={48} shape="square"/>
                                    )}
                                    <div>
                                        <div style={{fontWeight: 'bold'}}>{user.username}</div>
                                        <Text type="secondary">{user.email}</Text>
                                    </div>
                                </div>
                            )
                        },
                        {
                            title: '角色',
                            dataIndex: 'role',
                            key: 'role',
                            render: (role: UserRole) => (
                                <Tag color={role === 'ADMIN' ? 'red' : 'default'} className="rounded-full">
                                    {role === 'ADMIN' ? '管理员' : '用户'}
                                </Tag>
                            )
                        },
                        {
                            title: '状态',
                            key: 'status',
                            render: (_, user: User) => (
                                <Space direction="vertical">
                                    <Tag color={user.isVerified ? 'green' : 'orange'} className="rounded-full">
                                        {user.isVerified ? '已验证' : '未验证'}
                                    </Tag>
                                    <Tag color={user.isActive ? 'blue' : 'red'} className="rounded-full">
                                        {user.isActive ? '活跃' : '停用'}
                                    </Tag>
                                </Space>
                            )
                        },
                        {
                            title: '文章数',
                            dataIndex: 'postsCount',
                            key: 'postsCount',
                            render: (postsCount: number) => postsCount || 0
                        },
                        {
                            title: '最后登录',
                            dataIndex: 'lastLoginAt',
                            key: 'lastLoginAt',
                            render: (lastLoginAt: string) => lastLoginAt ? formatDate(lastLoginAt) : '从未登录'
                        },
                        {
                            title: '注册时间',
                            dataIndex: 'createdAt',
                            key: 'createdAt',
                            render: (createdAt: string) => formatDate(createdAt)
                        },
                        {
                            title: '操作',
                            key: 'action',
                            render: (_, user: User) => (
                                <Space>
                                    <Button
                                        type="text"
                                        size="small"
                                        onClick={() => {
                                            setCurrentUser(user);
                                            setShowEditModal(true);
                                        }}
                                        className="optimized-button"
                                    >
                                        编辑
                                    </Button>
                                    <Button
                                        type="text"
                                        size="small"
                                        danger
                                        onClick={() => handleDeleteUser(user.id, user.username)}
                                        className="optimized-button"
                                    >
                                        删除
                                    </Button>
                                </Space>
                            )
                        }
                    ]}
                    rowSelection={{
                        selectedRowKeys: selectedUsers,
                        onChange: (selectedRowKeys) => setSelectedUsers(selectedRowKeys as string[])
                    }}
                    pagination={false}
                    className="optimized-card"
                />
            )}

            {/* 创建用户模态框 */}
            <Modal
                title="创建新用户"
                open={showCreateModal}
                onCancel={() => setShowCreateModal(false)}
                onOk={handleCreateUser}
                okText="创建"
                cancelText="取消"
                confirmLoading={loading}
                okButtonProps={{
                    disabled: !newUserData.username || !newUserData.email || !newUserData.password,
                    className: "optimized-button"
                }}
                cancelButtonProps={{
                    className: "optimized-button"
                }}
            >
                <Form layout="vertical">
                    <Form.Item label="用户名" required>
                        <Input
                            placeholder="用户名"
                            value={newUserData.username}
                            onChange={(e) => setNewUserData(prev => ({...prev, username: e.target.value}))}
                            prefix={<UserOutlined/>}
                            className="optimized-input"
                        />
                    </Form.Item>
                    <Form.Item label="邮箱" required>
                        <Input
                            type="email"
                            placeholder="邮箱"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData(prev => ({...prev, email: e.target.value}))}
                            prefix={<MailOutlined/>}
                            className="optimized-input"
                        />
                    </Form.Item>
                    <Form.Item label="密码" required>
                        <Input.Password
                            placeholder="密码"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData(prev => ({...prev, password: e.target.value}))}
                            prefix={<LockOutlined/>}
                            className="optimized-input"
                        />
                    </Form.Item>
                    <Form.Item label="角色">
                        <Select
                            value={newUserData.role}
                            onChange={(value: UserRole) => setNewUserData(prev => ({...prev, role: value}))}
                            className="optimized-input"
                        >
                            <Option value={'USER' as UserRole}>普通用户</Option>
                            <Option value={'ADMIN' as UserRole}>管理员</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Checkbox
                            checked={newUserData.isVerified || false}
                            onChange={(e) => setNewUserData(prev => ({...prev, isVerified: e.target.checked}))}
                        >
                            邮箱已验证
                        </Checkbox>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑用户模态框 */}
            <Modal
                title="编辑用户"
                open={showEditModal && !!currentUser}
                onCancel={() => {
                    setShowEditModal(false);
                    setCurrentUser(null);
                }}
                onOk={handleUpdateUser}
                okText="保存"
                cancelText="取消"
                confirmLoading={loading}
                okButtonProps={{className: "optimized-button"}}
                cancelButtonProps={{className: "optimized-button"}}
            >
                {currentUser && (
                    <Form layout="vertical">
                        <Form.Item label="用户名" required>
                            <Input
                                placeholder="用户名"
                                value={currentUser.username}
                                onChange={(e) => setCurrentUser((prev: User | null) => prev ? ({
                                    ...prev,
                                    username: e.target.value
                                }) : null)}
                                prefix={<UserOutlined/>}
                                className="optimized-input"
                            />
                        </Form.Item>
                        <Form.Item label="邮箱" required>
                            <Input
                                type="email"
                                placeholder="邮箱"
                                value={currentUser.email}
                                onChange={(e) => setCurrentUser((prev: User | null) => prev ? ({
                                    ...prev,
                                    email: e.target.value
                                }) : null)}
                                prefix={<MailOutlined/>}
                                className="optimized-input"
                            />
                        </Form.Item>
                        <Form.Item label="角色">
                            <Select
                                value={currentUser.role}
                                onChange={(value: UserRole) => setCurrentUser((prev: User | null) => prev ? ({
                                    ...prev,
                                    role: value
                                }) : null)}
                                className="optimized-input"
                            >
                                <Option value={'USER' as UserRole}>普通用户</Option>
                                <Option value={'ADMIN' as UserRole}>管理员</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Checkbox
                                checked={currentUser.isVerified}
                                onChange={(e) => setCurrentUser((prev: User | null) => prev ? ({
                                    ...prev,
                                    isVerified: e.target.checked
                                }) : null)}
                            >
                                邮箱已验证
                            </Checkbox>
                        </Form.Item>
                        <Form.Item>
                            <Checkbox
                                checked={currentUser.isActive}
                                onChange={(e) => setCurrentUser((prev: User | null) => prev ? ({
                                    ...prev,
                                    isActive: e.target.checked
                                }) : null)}
                            >
                                账户激活
                            </Checkbox>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    );
}