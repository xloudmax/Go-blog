import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Card, Empty, Button, Typography, Tag, Space, Popconfirm, message } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ClearOutlined,
  CommentOutlined,
  LikeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from '@/api/graphql/notification';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text } = Typography;

export default function NotificationPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // GraphQL queries and mutations
  const { data, loading, refetch } = useNotifications(pageSize, (page - 1) * pageSize);
  const [markAsRead] = useMarkNotificationAsRead();
  const [markAllAsRead] = useMarkAllNotificationsAsRead();
  const [deleteNotification] = useDeleteNotification();
  const [clearAll] = useClearAllNotifications();

  const notifications = data?.notifications || [];

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'COMMENT_REPLY':
      case 'POST_COMMENT':
        return <CommentOutlined style={{ fontSize: '20px', color: '#1890ff' }} />;
      case 'POST_LIKE':
        return <LikeOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />;
      case 'SYSTEM':
        return <InfoCircleOutlined style={{ fontSize: '20px', color: '#52c41a' }} />;
      default:
        return <BellOutlined style={{ fontSize: '20px', color: '#8c8c8c' }} />;
    }
  };

  // 获取通知类型标签颜色
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'COMMENT_REPLY':
        return 'blue';
      case 'POST_COMMENT':
        return 'cyan';
      case 'POST_LIKE':
        return 'red';
      case 'SYSTEM':
        return 'green';
      default:
        return 'default';
    }
  };

  // 获取通知类型文本
  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'COMMENT_REPLY':
        return '评论回复';
      case 'POST_COMMENT':
        return '文章评论';
      case 'POST_LIKE':
        return '文章点赞';
      case 'SYSTEM':
        return '系统通知';
      default:
        return '未知';
    }
  };

  // 处理通知点击
  const handleNotificationClick = async (notification: any) => {
    // 标记为已读
    if (!notification.isRead) {
      try {
        await markAsRead({ variables: { id: notification.id } });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('标记通知为已读失败:', error);
        }
      }
    }

    // 跳转到相关页面
    if (notification.relatedPost) {
      navigate(`/post/${notification.relatedPost.slug}`);
    }
  };

  // 标记所有为已读
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      message.success('所有通知已标记为已读');
      refetch();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 删除通知
  const handleDelete = async (id: string) => {
    try {
      await deleteNotification({ variables: { id } });
      message.success('通知已删除');
      refetch();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 清空所有通知
  const handleClearAll = async () => {
    try {
      await clearAll();
      message.success('所有通知已清空');
      refetch();
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
      {/* 页面标题和操作按钮 */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: '0.5rem' }}>
            <BellOutlined style={{ marginRight: '8px' }} />
            通知中心
          </Title>
          <Text type="secondary">查看您的所有通知消息</Text>
        </div>
        <Space>
          <Button
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
            disabled={notifications.length === 0}
          >
            全部已读
          </Button>
          <Popconfirm
            title="确定要清空所有通知吗？"
            onConfirm={handleClearAll}
            okText="确定"
            cancelText="取消"
          >
            <Button
              icon={<ClearOutlined />}
              danger
              disabled={notifications.length === 0}
            >
              清空通知
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 通知列表 */}
      {notifications.length === 0 && !loading ? (
        <Empty
          description="暂无通知"
          style={{ padding: '3rem' }}
        />
      ) : (
        <List
          loading={loading}
          itemLayout="horizontal"
          dataSource={notifications}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: notifications.length,
            onChange: (newPage) => setPage(newPage),
            showSizeChanger: false,
          }}
          renderItem={(notification: any) => (
            <List.Item
              style={{
                padding: '0',
                marginBottom: '1rem',
                border: 'none',
              }}
            >
              <Card
                hoverable
                onClick={() => handleNotificationClick(notification)}
                style={{
                  width: '100%',
                  backgroundColor: notification.isRead ? 'transparent' : 'rgba(24, 144, 255, 0.05)',
                  borderColor: notification.isRead ? '#d9d9d9' : '#1890ff',
                  borderWidth: notification.isRead ? '1px' : '2px',
                }}
                bodyStyle={{ padding: '1rem' }}
              >
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {/* 通知图标 */}
                  <div style={{ flexShrink: 0 }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* 通知内容 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <Tag color={getNotificationTypeColor(notification.type)}>
                          {getNotificationTypeText(notification.type)}
                        </Tag>
                        {!notification.isRead && (
                          <Tag color="red">未读</Tag>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px', flexShrink: 0, marginLeft: '8px' }}>
                        {dayjs(notification.createdAt).fromNow()}
                      </Text>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                      <Text strong style={{ fontSize: '15px' }}>
                        {notification.title}
                      </Text>
                    </div>

                    <div>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {notification.content}
                      </Text>
                    </div>

                    {/* 相关用户信息 */}
                    {notification.relatedUser && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {notification.relatedUser.avatar && (
                          <img
                            src={notification.relatedUser.avatar}
                            alt={notification.relatedUser.username}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        )}
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          来自 {notification.relatedUser.username}
                        </Text>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div style={{ marginTop: '1rem' }}>
                      <Space>
                        {notification.relatedPost && (
                          <Button
                            type="link"
                            size="small"
                            style={{ padding: 0 }}
                          >
                            查看文章
                          </Button>
                        )}
                        <Popconfirm
                          title="确定要删除这条通知吗？"
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                            style={{ padding: 0 }}
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
