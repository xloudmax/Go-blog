import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Card, Empty, Typography, Tag, Space, Popconfirm, message } from 'antd';
import { LiquidButton } from '@/components/LiquidButton';
import { PageHeader } from '@/components/PageHeader';
import { PageContainer } from '@/components/PageContainer';
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
import type { Notification } from '@/generated/graphql';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

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
  const handleNotificationClick = async (notification: Notification) => {
    // 标记为已读
    if (!notification.isRead) {
      try {
        await markAsRead({ variables: { id: notification.id } });
      } catch {
        // 忽略错误
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
    } catch {
      message.error('操作失败');
    }
  };

  // 删除通知
  const handleDelete = async (id: string) => {
    try {
      await deleteNotification({ variables: { id } });
      message.success('通知已删除');
      refetch();
    } catch {
      message.error('删除失败');
    }
  };

  // 清空所有通知
  const handleClearAll = async () => {
    try {
      await clearAll();
      message.success('所有通知已清空');
      refetch();
    } catch {
      message.error('操作失败');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="通知中心"
        icon={<BellOutlined />}
        extra={
          <Space>
            <LiquidButton
              onClick={handleMarkAllAsRead}
              disabled={notifications.length === 0}
              variant="secondary"
              className="!h-10 !px-4 flex items-center gap-2 !rounded-full"
            >
              <CheckOutlined /> 全部已读
            </LiquidButton>
            <Popconfirm
              title="确定要清空所有通知吗？"
              onConfirm={handleClearAll}
              okText="确定"
              cancelText="取消"
            >
              <LiquidButton
                disabled={notifications.length === 0}
                variant="danger"
                className="!h-10 !px-4 flex items-center gap-2 !rounded-full"
              >
                <ClearOutlined /> 清空通知
              </LiquidButton>
            </Popconfirm>
          </Space>
        }
      />

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
          renderItem={(notification: Notification) => (
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
                            loading="lazy"
                            decoding="async"
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
                          <LiquidButton
                            variant="ghost"
                            className="!h-auto !p-0 !text-blue-500 hover:!text-blue-600 text-sm"
                          >
                            查看文章
                          </LiquidButton>
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
                          <LiquidButton
                            variant="danger"
                            onClick={(e) => e.stopPropagation()}
                            className="!h-auto !p-0 !bg-transparent !border-none !shadow-none flex items-center gap-1 text-sm"
                          >
                            <DeleteOutlined /> 删除
                          </LiquidButton>
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
    </PageContainer>
  );
}
