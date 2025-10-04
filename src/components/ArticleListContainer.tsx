import React from 'react';
import { Typography, Alert } from 'antd';
import type { BlogPost } from '@/types';
import ArticleCard from './ArticleCard';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface ArticleListContainerProps {
  posts: BlogPost[];
  loading: boolean;
  error: Error | null;
  onAction: (action: 'view' | 'edit' | 'share', post: BlogPost) => void;
}

const ArticleListContainer: React.FC<ArticleListContainerProps> = ({ 
  posts, 
  loading, 
  error,
  onAction
}) => {
  const navigate = useNavigate();

  // 处理导航
  const handleNavigate = (slug: string) => {
    navigate(`/post/${slug}`);
  };

  // 处理文章操作
  const handlePostAction = (action: 'view' | 'edit' | 'share', post: BlogPost) => {
    switch (action) {
      case 'view':
        navigate(`/post/${post.slug}`);
        break;
      case 'edit':
        navigate(`/editor/posts/${post.slug}`);
        break;
      case 'share':
        { navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`);
        // 使用 notification 而不是 message
        const notification = (window as any).antdNotification || (window as any).notification;
        if (notification && notification.success) {
          notification.success({
            message: '链接已复制',
            description: '文章链接已复制到剪贴板',
            duration: 2,
          });
        }
        break; }
    }
    onAction(action, post);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <Text className="ml-3 text-gray-500 dark:text-gray-400 text-lg">加载中...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <Alert
          message="加载失败"
          description={error.message}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <Title level={3} className="text-gray-400 mb-4 font-normal">
          还没有文章
        </Title>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {posts.map((post) => (
        <ArticleCard
          key={post.id}
          post={post}
          onNavigate={handleNavigate}
          onAction={handlePostAction}
        />
      ))}
    </div>
  );
};

export default ArticleListContainer;
