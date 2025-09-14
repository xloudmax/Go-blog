import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  Typography,
  Avatar,
  Tag,
  Button,
  Space,
  Spin,
  Alert,
  Divider,
  Tooltip,
  Switch,
  notification
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  LikeOutlined,
  ShareAltOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  CommentOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';
import { useQuery } from '@apollo/client';
import { POST_QUERY } from '@/api/graphql';
import { useAppUser, useLike } from '@/hooks';
import { useTheme } from '../components/ThemeProvider';
import MarkdownViewer from '../components/MarkdownViewer';
import CommentSection from '@/components/CommentSection';
import './PostDetailPage.css';

const { Title, Paragraph } = Typography;

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppUser();
  const { theme, toggle: toggleTheme, isDarkMode } = useTheme();

  // 获取文章详情
  const { data, loading, error, refetch } = useQuery(POST_QUERY, {
    variables: { slug },
    skip: !slug,
    errorPolicy: 'all'
  });

  const post = data?.post;

  // 使用优化后的点赞 Hook
  const { isLiked, likeCount, handleLike } = useLike({
    postId: post?.slug || '',
    initialIsLiked: post?.isLiked || false,
    initialLikeCount: post?.stats?.likeCount || 0,
  });

  // 当文章数据变化时重新初始化点赞状态
  useEffect(() => {
    // useLike hook 会自动处理这个逻辑
  }, [post]);

  // 处理分享
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      notification.success({
        message: '成功',
        description: '链接已复制到剪贴板',
        duration: 3,
      });
    }).catch(() => {
      notification.error({
        message: '错误',
        description: '复制失败',
        duration: 5,
      });
    });
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error.message}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <Alert
          message="文章未找到"
          description="您访问的文章不存在或已被删除"
          type="warning"
          showIcon
          action={
            <Link to="/">
              <Button type="primary">返回首页</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900" style={{ padding: '0 40px', boxSizing: 'border-box' }}>
      <div className="max-w-4xl mx-auto py-12">
        {/* 标准页面标题和导航 */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              返回
            </Button>
            <div>
              <Title level={2} className="mb-2">
                文章详情
              </Title>
              <Paragraph type="secondary" className="mb-0">
                阅读完整文章内容
              </Paragraph>
            </div>
          </div>
          
          {/* 主题切换开关 */}
          <div className="flex items-center gap-2">
            <SunOutlined className={!isDarkMode ? 'text-yellow-500' : 'text-gray-400'} />
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              size="small"
            />
            <MoonOutlined className={isDarkMode ? 'text-blue-400' : 'text-gray-400'} />
          </div>
        </div>

        {/* 文章内容容器 */}
        <Card className="mb-6 post-detail-card mx-8">
        <div className="mb-6">
          <Title 
            level={1} 
            className={`mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {post.title}
          </Title>
          
          {post.excerpt && (
            <Paragraph className={`text-lg mb-4 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {post.excerpt}
            </Paragraph>
          )}

          {/* 作者信息和发布时间 */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Avatar 
                src={post.author.avatar} 
                icon={<UserOutlined />}
                size="large"
              />
              <div>
                <div className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {post.author.username}
                </div>
                <div className={`text-sm flex items-center gap-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <CalendarOutlined />
                  {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <Space>
              {/* 编辑按钮 - 只有作者可见 */}
              {isAuthenticated && user?.username === post.author.username && (
                <Tooltip title="编辑文章">
                  <Button 
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/editor/posts/${post.slug}`)}
                  >
                    编辑
                  </Button>
                </Tooltip>
              )}
              
              {/* 点赞按钮 - 使用优化后的逻辑 */}
              <Tooltip title={isLiked ? "取消点赞" : "点赞"}>
                <Button 
                  icon={<LikeOutlined />}
                  onClick={handleLike}
                  type={isLiked ? "primary" : "default"}
                  disabled={!isAuthenticated}
                  className={`transition-all duration-200 ${
                    isLiked 
                      ? 'bg-red-500 border-red-500 hover:bg-red-400' 
                      : ''
                  }`}
                >
                  {likeCount}
                </Button>
              </Tooltip>

              {/* 分享按钮 */}
              <Tooltip title="分享文章">
                <Button 
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                >
                  分享
                </Button>
              </Tooltip>
            </Space>
          </div>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-4">
              <Space wrap>
                {post.tags.map((tag: string) => (
                  <Tag key={tag} color="blue">
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          {/* 统计信息 */}
          <div className={`flex items-center gap-4 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <span className="flex items-center gap-1">
              <EyeOutlined />
              {post.stats?.viewCount || 0} 次浏览
            </span>
            <span className="flex items-center gap-1">
              <LikeOutlined />
              {likeCount} 次点赞
            </span>
            <span className="flex items-center gap-1">
              <CommentOutlined />
              {post.stats?.commentCount || 0} 条评论
            </span>
          </div>
        </div>

        <Divider className={isDarkMode ? 'border-gray-700' : ''} />

        {/* 文章内容 */}
        <div className={`prose max-w-none ${
          isDarkMode 
            ? 'prose-dark prose-invert text-white' 
            : 'prose-light text-gray-900'
        }`}>
          {post.content ? (
            <MarkdownViewer content={post.content} />
          ) : (
            <div className={`text-center py-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              暂无内容
            </div>
          )}
        </div>
      </Card>

      {/* 评论区 */}
      <CommentSection 
        blogPostId={post.id} 
        blogPostSlug={post.slug} 
      />
      </div>
    </div>
  );
}
