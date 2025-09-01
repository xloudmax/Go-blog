import {useState, useEffect } from 'react';
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
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  LikeOutlined,
  ShareAltOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useQuery, useMutation } from '@apollo/client';
import { POST_QUERY, LIKE_POST_MUTATION, UNLIKE_POST_MUTATION } from '@/api/graphql';
import { useAppUser } from '@/hooks';
import MarkdownViewer from '../components/MarkdownViewer';

const { Title, Paragraph } = Typography;

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppUser();
  const [isLiked, setIsLiked] = useState(false);

  // 获取文章详情
  const { data, loading, error, refetch } = useQuery(POST_QUERY, {
    variables: { slug },
    skip: !slug,
    errorPolicy: 'all'
  });

  const post = data?.post;

  // 当文章数据加载完成后，初始化点赞状态
  useEffect(() => {
    if (post && isAuthenticated) {
      setIsLiked(post.isLiked || false);
    } else {
      setIsLiked(false);
    }
  }, [post, isAuthenticated]);

  // 点赞/取消点赞
  const [likePost] = useMutation(LIKE_POST_MUTATION, {
    onCompleted: () => {
      setIsLiked(true);
      message.success('点赞成功');
      // 更新缓存中的数据
      refetch();
    },
    onError: (error) => {
      message.error(`点赞失败: ${error.message}`);
    }
  });

  const [unlikePost] = useMutation(UNLIKE_POST_MUTATION, {
    onCompleted: () => {
      setIsLiked(false);
      message.success('取消点赞成功');
      // 更新缓存中的数据
      refetch();
    },
    onError: (error) => {
      message.error(`取消点赞失败: ${error.message}`);
    }
  });

  // 处理点赞
  const handleLike = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      return;
    }

    if (!post) return;

    try {
      if (isLiked) {
        await unlikePost({ variables: { id: post.id } });
      } else {
        await likePost({ variables: { id: post.id } });
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
    }
  };

  // 处理分享
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
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
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <div className="mb-4">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          返回
        </Button>
      </div>

      {/* 文章头部信息 */}
      <Card className="mb-6">
        <div className="mb-6">
          <Title level={1} className="mb-4">
            {post.title}
          </Title>
          
          {post.excerpt && (
            <Paragraph className="text-lg text-gray-600 mb-4">
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
                <div className="font-medium">{post.author.username}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
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
              
              {/* 点赞按钮 */}
              <Tooltip title={isLiked ? "取消点赞" : "点赞"}>
                <Button 
                  icon={<LikeOutlined />}
                  onClick={handleLike}
                  type={isLiked ? "primary" : "default"}
                  disabled={!isAuthenticated}
                >
                  {post.stats?.likeCount || 0}
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
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <EyeOutlined />
              {post.stats?.viewCount || 0} 次浏览
            </span>
            <span className="flex items-center gap-1">
              <LikeOutlined />
              {post.stats?.likeCount || 0} 次点赞
            </span>
          </div>
        </div>

        <Divider />

        {/* 文章内容 */}
        <div className="prose max-w-none">
          {post.content ? (
            <MarkdownViewer content={post.content} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无内容
            </div>
          )}
        </div>
      </Card>

      {/* 相关文章推荐等其他内容可以在这里添加 */}
    </div>
  );
}