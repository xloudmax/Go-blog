import React from 'react';
import { Card, Typography, Space, Avatar, Tag, Dropdown, Button } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  ShareAltOutlined, 
  MoreOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { BlogPost } from '@/types';
import { useAppUser } from '@/hooks';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

interface ArticleCardProps {
  post: BlogPost;
  onNavigate: (slug: string) => void;
  onAction: (action: 'view' | 'edit' | 'share', post: BlogPost) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ post, onNavigate, onAction }) => {
  const { user, isAuthenticated } = useAppUser();
  const navigate = useNavigate();

  // 格式化相对时间
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '昨天';
    if (diffDays <= 7) return `${diffDays}天前`;
    if (diffDays <= 30) return `${Math.ceil(diffDays/7)}周前`;
    if (diffDays <= 365) return `${Math.ceil(diffDays/30)}个月前`;
    return `${Math.ceil(diffDays/365)}年前`;
  };

  // 文章操作菜单
  const getPostMenuItems = () => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: '查看文章',
      onClick: () => onAction('view', post)
    },
    {
      key: 'share',
      icon: <ShareAltOutlined />,
      label: '分享文章',
      onClick: () => onAction('share', post)
    },
    ...(isAuthenticated && post.author.username === user?.username ? [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑文章',
        onClick: () => onAction('edit', post)
      }
    ] : [])
  ];

  return (
    <Card 
      className="article-card modern-card-hover"
      cover={
        post.coverImageUrl ? (
          <div className="relative h-48 overflow-hidden">
            <img 
              alt={post.title} 
              src={post.coverImageUrl} 
              className="w-full h-full object-cover image-hover-scale"
            />
          </div>
        ) : null
      }
    >
      <div className="flex flex-col h-full">
        {/* 标题 */}
        <Title 
          level={4} 
          className="article-card-title mb-3 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => onNavigate(post.slug)}
        >
          {post.title}
        </Title>
        
        {/* 摘要 */}
        {post.excerpt && (
          <Paragraph 
            className="article-card-excerpt mb-4 flex-grow"
            ellipsis={{ rows: 3 }}
          >
            {post.excerpt}
          </Paragraph>
        )}
        
        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4">
            <Space size={[0, 8]} wrap>
              {post.tags.slice(0, 3).map(tag => (
                <Tag 
                  key={tag} 
                  className="rounded-full px-3 py-1 text-xs"
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}
        
        {/* 元信息 */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <Space size="small">
            <Avatar 
              size="small" 
              src={post.author.avatar || undefined}
              className="bg-gradient-primary"
            >
              {post.author.username.charAt(0).toUpperCase()}
            </Avatar>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {post.author.username}
            </span>
          </Space>
          
          <Space size="small">
            <span className="text-xs text-gray-500 flex items-center">
              <ClockCircleOutlined className="mr-1" />
              {formatRelativeTime(post.publishedAt || post.createdAt)}
            </span>
            <span className="text-xs text-gray-500 flex items-center">
              <EyeOutlined className="mr-1" />
              {post.stats?.viewCount || 0}
            </span>
          </Space>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-end mt-4">
          <Dropdown menu={{ items: getPostMenuItems() }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className="opacity-60 hover:opacity-100 border-none shadow-none"
            />
          </Dropdown>
        </div>
      </div>
    </Card>
  );
};

export default ArticleCard;