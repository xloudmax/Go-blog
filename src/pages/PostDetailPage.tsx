import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Avatar,
  Tag,
  Space,
  Spin,
  Alert,
  Divider,
  Tooltip,
  notification,
  Grid
} from 'antd';
import { LiquidButton } from '../components/LiquidButton';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  LikeOutlined,
  ShareAltOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  CommentOutlined,
  CloudSyncOutlined
} from '@ant-design/icons';
import { useQuery } from '@apollo/client';
import { POST_QUERY } from '@/api/graphql';
import { useAppUser, useLike } from '@/hooks';
import MarkdownViewer from '../components/MarkdownViewer';
import CommentSection from '@/components/CommentSection';
import TableOfContents from '@/components/TableOfContents';
import BackToTop from '@/components/BackToTop';
import { PageContainer } from '@/components/PageContainer';
import confetti from 'canvas-confetti';

const { Title, Paragraph } = Typography;

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppUser();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  // Static export support
  const isStatic = import.meta.env.VITE_STATIC_EXPORT === 'true';

  // 获取文章详情
  const { data: apolloData, loading: apolloLoading, error: apolloError, refetch } = useQuery(POST_QUERY, {
    variables: { id: slug },
    skip: isStatic || !slug,
    errorPolicy: 'all'
  });

  const [staticPost, setStaticPost] = useState<Record<string, unknown> | null>(null);
  const [staticLoading, setStaticLoading] = useState(isStatic);
  const [staticError, setStaticError] = useState<Error | null>(null);

  useEffect(() => {
    if (isStatic && slug) {
      setStaticLoading(true);
      fetch(`./static/posts/${slug}.json`)
        .then(res => res.json())
        .then(data => {
          setStaticPost(data);
          setStaticLoading(false);
        })
        .catch(err => {
          setStaticError(err);
          setStaticLoading(false);
        });
    }
  }, [isStatic, slug]);

  const loading = isStatic ? staticLoading : apolloLoading;
  const error = isStatic ? staticError : apolloError;
  const post = isStatic ? staticPost : apolloData?.post;

  // 确保 tags 始终是数组 (处理 SSG 模式下的字符串数据)
  const safeTags: string[] = Array.isArray(post?.tags) 
    ? post.tags 
    : (typeof post?.tags === 'string' ? (post.tags as string).split(',').filter(Boolean) : []);

  // 使用优化后的点赞 Hook
  const { isLiked, likeCount, handleLike } = useLike({
    postId: post?.id || '',
    postSlug: post?.slug || '',
    initialIsLiked: post?.isLiked || false,
    initialLikeCount: post?.stats?.likeCount || 0,
  });

  const likeButtonRef = useRef<HTMLButtonElement>(null);

  const onLikeClick = async () => {
    if (!isLiked) {
      const rect = likeButtonRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { x, y },
          scalar: 0.7,
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
          disableForReducedMotion: true,
          zIndex: 10000,
        });
      }
    }
    await handleLike();
  };

  // Sync with native mini-player (Apple Music style)
  useEffect(() => {
    if (post && window.webkit?.messageHandlers?.updateArticle) {
      const payload = {
        title: post.title,
        author: post.author.username
      };
      window.webkit.messageHandlers.updateArticle.postMessage(payload);
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Sent article update to native:', payload);
    }
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

  // 手势处理 - 右滑返回
  const touchStart = useRef<{ x: number, y: number } | null>(null);
  const touchEnd = useRef<{ x: number, y: number } | null>(null);
  const minSwipeDistance = 100; // px

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null; 
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    const isRightSwipe = distanceX < -minSwipeDistance;
    
    // 确保是水平滑动主导（垂直位移较小）
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
        if (isRightSwipe) {
            navigate(-1);
        }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '24rem' }}>
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
          <LiquidButton size="small" onClick={() => refetch()} variant="secondary" className="!h-8 !px-3">
            重试
          </LiquidButton>
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
              <LiquidButton variant="primary">返回首页</LiquidButton>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <PageContainer
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="!px-2"
    >
      <div style={{ 
        maxWidth: '80rem', 
        margin: '0 auto', 
        padding: isMobile ? '1rem 0.25rem' : '3rem 0' 
      }}>
        {/* 标准页面标题和导航 */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* React 19 Metadata Hoisting */}
          <title>{post?.title ? `${post.title} - 博客平台` : '加载中... - 博客平台'}</title>
          {post?.excerpt && <meta name="description" content={post.excerpt} />}
          
          <LiquidButton
            onClick={() => navigate('/home')}
            variant="secondary"
            className="!h-10 !px-4 flex items-center gap-2"
          >
            <ArrowLeftOutlined /> 返回
          </LiquidButton>
        </div>

        {/* 主内容区：文章 + TOC */}
        <div style={{ display: 'flex', gap: '2rem', position: 'relative', alignItems: 'flex-start' }}>
          {/* 左侧主内容区 */}
          <div style={{ flex: '1', minWidth: 0 }}>
            {/* 文章内容容器 */}
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0', // Reduced padding since no border bounds it
              }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <Title
                    level={isMobile ? 2 : 1}
                    style={{ 
                      margin: 0, 
                      color: 'var(--color-text)',
                      fontSize: isMobile ? '1.75rem' : undefined,
                      lineHeight: isMobile ? 1.2 : undefined
                    }}
                  >
                    {post.title}
                  </Title>
                  {post.status !== 'PUBLISHED' && (
                    <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px' }}>
                      草稿
                    </Tag>
                  )}
                </div>

                {post.excerpt && (
                  <Paragraph style={{ 
                    fontSize: isMobile ? '16px' : '18px', 
                    marginBottom: '1rem', 
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6
                  }}>
                    {post.excerpt}
                  </Paragraph>
                )}

                {/* 作者信息和发布时间 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '2rem', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar
                      src={post.author.avatar}
                      icon={<UserOutlined />}
                      size="large"
                    />
                    <div>
                      <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 500, color: 'var(--color-text)' }}>
                        {post.author.username}
                      </div>
                      <div style={{ fontSize: isMobile ? '12px' : '14px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarOutlined />
                        {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* 编辑按钮 - 只有作者可见 */}
                    {isAuthenticated && user?.username === post.author.username && (
                      post.notionPageId ? (
                        <Tooltip title="此文章由 Notion 同步，请在 Notion 中编辑">
                           <LiquidButton
                             disabled
                             variant="secondary"
                             className="flex items-center gap-2"
                           >
                             <CloudSyncOutlined /> Notion 同步
                           </LiquidButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="编辑文章">
                          <LiquidButton
                            onClick={() => navigate(`/editor/posts/${post.slug}`)}
                            variant="secondary"
                            className="flex items-center gap-2"
                          >
                            <EditOutlined /> 编辑
                          </LiquidButton>
                        </Tooltip>
                      )
                    )}

                    {/* 点赞按钮 - 使用优化后的逻辑 */}
                    <Tooltip title={isLiked ? "取消点赞" : "点赞"}>
                      <LiquidButton
                        ref={likeButtonRef}
                        onClick={onLikeClick}
                        variant={isLiked ? "primary" : "secondary"}
                        disabled={!isAuthenticated}
                        className="flex items-center gap-2"
                      >
                        <LikeOutlined /> {likeCount}
                      </LiquidButton>
                    </Tooltip>

                    {/* 分享按钮 */}
                    <Tooltip title="分享文章">
                      <LiquidButton
                        onClick={handleShare}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        <ShareAltOutlined /> 分享
                      </LiquidButton>
                    </Tooltip>
                  </div>
                </div>

                {/* 标签 */}
                {safeTags.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <Space wrap>
                      {safeTags.map((tag: string) => (
                        <Tag key={tag} color="blue">
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 统计信息 */}
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <EyeOutlined />
                    {post.stats?.viewCount || 0} 次浏览
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <LikeOutlined />
                    {likeCount} 次点赞
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CommentOutlined />
                    {post.stats?.commentCount || 0} 条评论
                  </span>
                </div>
              </div>

              <Divider style={{ borderColor: 'var(--color-border)' }} />

              {/* 文章内容 */}
              <div style={{ maxWidth: '100%', color: 'var(--color-text)' }}>
                {post.content ? (
                  <MarkdownViewer content={post.content} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>
                    暂无内容
                  </div>
                )}
              </div>
            </div>

            {/* 评论区 */}
            {post.status === 'PUBLISHED' ? (
              <CommentSection
                blogPostId={post.id}
                blogPostSlug={post.slug}
              />
            ) : (
              <Alert
                message="评论功能已禁用"
                description="草稿文章暂不支持评论功能。发布文章后即可开启评论。"
                type="info"
                showIcon
                style={{ marginTop: '24px' }}
              />
            )}
          </div>

          {/* 右侧 TOC 侧边栏 */}
          {post.content && (
            <aside className="toc-sidebar">
              <div className="toc-sticky">
                <TableOfContents content={post.content} />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* 返回顶部按钮 */}
      <BackToTop />
    </PageContainer>
  );
}
