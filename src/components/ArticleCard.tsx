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

const { Title, Paragraph } = Typography;

interface ArticleCardProps {
  post: BlogPost;
  onNavigate: (slug: string) => void;
  onAction: (action: 'view' | 'edit' | 'share', post: BlogPost) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ post, onNavigate, onAction }) => {
  const { user, isAuthenticated } = useAppUser();

  // 格式化日期时间
  const formatDate = (dateString: string) => {
    if (!dateString) return '未知时间';

    try {
      const date = new Date(dateString);

      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return '未知时间';
      }

      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error, dateString);
      return '未知时间';
    }
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
      className="article-card modern-card-hover h-full flex flex-col"
      cover={
        post.coverImageUrl ? (
          <div className="relative h-48 overflow-hidden flex-shrink-0">
            <img
              alt={post.title}
              src={post.coverImageUrl}
              className="w-full h-full object-cover image-hover-scale"
            />
          </div>
        ) : null
      }
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
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
              {post.tags.slice(0, 3).map((tag) => {
                // 美观的渐变色配置
                const tagColorSchemes = [
                  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#fff' },  // 紫色渐变
                  { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#fff' },  // 粉红渐变
                  { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: '#fff' },  // 蓝色渐变
                  { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', text: '#fff' },  // 绿色渐变
                  { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: '#fff' },  // 橙粉渐变
                  { bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', text: '#fff' },  // 青紫渐变
                  { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', text: '#333' },  // 淡蓝粉渐变
                  { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', text: '#333' },  // 浅粉渐变
                  { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', text: '#333' },  // 暖橙渐变
                  { bg: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', text: '#fff' },  // 红蓝渐变
                ];

                const colorIndex = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const colorScheme = tagColorSchemes[colorIndex % tagColorSchemes.length];

                return (
                  <Tag
                    key={tag}
                    className="rounded-full px-3 py-1 text-xs border-0"
                    style={{
                      background: colorScheme.bg,
                      color: colorScheme.text,
                      fontWeight: 500,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {tag}
                  </Tag>
                );
              })}
            </Space>
          </div>
        )}
        
        {/* 元信息 */}
        <div className="article-card-user-info mt-auto">
          <div className="article-card-author">
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
          </div>
          
          <div className="article-card-stats">
            <span className="article-card-stat text-xs text-gray-500">
              <ClockCircleOutlined />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            <span className="article-card-stat text-xs text-gray-500">
              <EyeOutlined />
              {post.stats?.viewCount || 0}
            </span>
          </div>
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
