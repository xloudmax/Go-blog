import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Avatar,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  notification,
  Spin,
  Alert,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  LikeOutlined,
  LikeFilled,
  FlagOutlined,
  SendOutlined,
  CommentOutlined,
  MessageOutlined,
  MoreOutlined,
  LinkOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useComments, useCommentActionsHook } from '@/hooks';
import type { BlogPostComment } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 配置dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { TextArea } = Input;
const { Text, Title } = Typography;

interface CommentSectionProps {
  blogPostId: string;
  blogPostSlug: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ blogPostId }) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const { comments, total, loading, error, refetch } = useComments(blogPostId, 10);
  const {
    createComment,
    likeComment,
    unlikeComment,
    reportComment,
    loading: actionLoading
  } = useCommentActionsHook();
  
  // 处理创建评论
  const handleCreateComment = useCallback(async () => {
    if (!newComment.trim()) {
      notification.warning({
        message: '警告',
        description: '请输入评论内容',
        duration: 3,
      });
      return;
    }
    
    try {
      await createComment({
        content: newComment,
        blogPostId: blogPostId,
      });
      
      notification.success({
        message: '成功',
        description: '评论发表成功',
        duration: 3,
      });
      setNewComment('');
      refetch();
    } catch (error) {
      notification.error({
        message: '错误',
        description: '发表评论失败: ' + (error as Error).message,
        duration: 5,
      });
    }
  }, [newComment, blogPostId, createComment, refetch]);
  
  // 处理回复评论
  const handleReplyComment = useCallback(async (parentId: string) => {
    if (!replyContent.trim()) {
      notification.warning({
        message: '警告',
        description: '请输入回复内容',
        duration: 3,
      });
      return;
    }
    
    try {
      await createComment({
        content: replyContent,
        blogPostId: blogPostId,
        parentId: parentId,
      });
      
      notification.success({
        message: '成功',
        description: '回复发表成功',
        duration: 3,
      });
      setReplyContent('');
      setReplyingTo(null);
      refetch();
    } catch (error) {
      notification.error({
        message: '错误',
        description: '发表回复失败: ' + (error as Error).message,
        duration: 5,
      });
    }
  }, [replyContent, blogPostId, createComment, refetch]);
  
  // 处理点赞评论
  const handleLikeComment = useCallback(async (commentId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikeComment(commentId);
        notification.success({
          message: '成功',
          description: '已取消点赞',
          duration: 3,
        });
      } else {
        await likeComment(commentId);
        notification.success({
          message: '成功',
          description: '点赞成功',
          duration: 3,
        });
      }
      refetch();
    } catch (error) {
      notification.error({
        message: '错误',
        description: '操作失败: ' + (error as Error).message,
        duration: 5,
      });
    }
  }, [likeComment, unlikeComment, refetch]);
  
  // 处理举报评论
  const handleReportComment = useCallback(async (commentId: string) => {
    try {
      await reportComment(commentId);
      notification.success({
        message: '成功',
        description: '举报成功，管理员会审核该评论',
        duration: 3,
      });
      refetch();
    } catch (error) {
      notification.error({
        message: '错误',
        description: '举报失败: ' + (error as Error).message,
        duration: 5,
      });
    }
  }, [reportComment, refetch]);

  // 切换回复展开状态
  const toggleReplies = useCallback((commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  // 生成评论短ID（用于显示）
  const getCommentShortId = useCallback((fullId: string) => {
    return fullId.slice(-8); // 取最后8位作为短ID显示
  }, []);

  // 复制评论链接
  const copyCommentLink = useCallback((commentId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#comment-${commentId}`;
    navigator.clipboard.writeText(url).then(() => {
      notification.success({
        message: '成功',
        description: '评论链接已复制到剪贴板',
        duration: 2,
      });
    }).catch(() => {
      notification.error({
        message: '错误',
        description: '复制链接失败',
        duration: 2,
      });
    });
  }, []);

  // 跳转到评论
  const scrollToComment = useCallback((commentId: string) => {
    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 高亮评论
      element.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
      setTimeout(() => {
        element.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
      }, 2000);
    }
  }, []);

  // 取消回复
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
    setReplyContent('');
  }, []);

  // 递归渲染评论（支持多级嵌套）
  const renderComment = useCallback((comment: BlogPostComment, depth: number = 0) => {
    const isLiked = false; // 这里应该从用户状态中获取
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);
    const maxDepth = 5; // 最大嵌套深度
    const isReplyingToThis = replyingTo === comment.id;
    const shortId = getCommentShortId(comment.id);

    return (
      <div
        key={comment.id}
        id={`comment-${comment.id}`}
        className="w-full transition-colors duration-300"
      >
        <div className="comment-user-info">
          {/* 头像 */}
          <Avatar
            src={comment.user?.avatar}
            icon={<UserOutlined />}
            className="comment-avatar"
            size={depth > 0 ? 'small' : 'default'}
          />

          <div className="flex-1">
            {/* 评论内容 */}
            <div className="comment-content bg-gray-100 dark:bg-gray-700">
              <div className="comment-header">
                <div className="comment-user-details">
                  <Text strong className={depth > 0 ? 'text-sm' : ''}>
                    {comment.user?.username || '匿名用户'}
                  </Text>
                  <Tooltip title={`评论ID: ${comment.id}`}>
                    <Text
                      type="secondary"
                      className="text-xs bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded cursor-help"
                    >
                      #{shortId}
                    </Text>
                  </Tooltip>
                  {depth > 0 && comment.parent && (
                    <Tooltip title="回复的评论">
                      <Text
                        type="secondary"
                        className="text-xs cursor-pointer hover:text-blue-500"
                        onClick={() => scrollToComment(comment.parent!.id)}
                      >
                        回复 #{getCommentShortId(comment.parent.id)}
                      </Text>
                    </Tooltip>
                  )}
                </div>
                <div className="comment-meta">
                  <Tooltip title={dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm:ss')}>
                    <Text type="secondary" className="text-xs flex items-center">
                      <ClockCircleOutlined className="mr-3" />
                      {dayjs(comment.createdAt).fromNow()}
                    </Text>
                  </Tooltip>
                  <Tooltip title="复制评论链接">
                    <Button
                      type="text"
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={() => copyCommentLink(comment.id)}
                      className="opacity-50 hover:opacity-100"
                    />
                  </Tooltip>
                </div>
              </div>
              <Text className={`block mt-2 ${depth > 0 ? 'text-sm' : ''}`}>
                {comment.content}
              </Text>
            </div>

            {/* 操作按钮 */}
            <div className="comment-actions">
              <Button
                type="text"
                size="small"
                icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
                onClick={() => handleLikeComment(comment.id, isLiked)}
                loading={actionLoading.like || actionLoading.unlike}
              >
                {comment.likeCount > 0 ? comment.likeCount : ''}
              </Button>

              {/* 只在未达到最大深度时显示回复按钮 */}
              {depth < maxDepth && (
                <Button
                  type="text"
                  size="small"
                  icon={<MessageOutlined />}
                  onClick={() => setReplyingTo(isReplyingToThis ? null : comment.id)}
                >
                  回复
                </Button>
              )}

              {hasReplies && (
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  onClick={() => toggleReplies(comment.id)}
                >
                  {isExpanded ? '收起' : `展开 ${comment.replies.length} 条回复`}
                </Button>
              )}

              <Button
                type="text"
                size="small"
                icon={<FlagOutlined />}
                onClick={() => handleReportComment(comment.id)}
                loading={actionLoading.report}
              >
                举报
              </Button>
            </div>

            {/* 回复输入框 */}
            {isReplyingToThis && (
              <div className="mt-3">
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-400">
                  <Text className="text-xs text-blue-600 dark:text-blue-400">
                    正在回复 @{comment.user?.username || '匿名用户'} 的评论 #{shortId}:
                  </Text>
                  <Text className="block text-xs text-gray-500 truncate mt-1">
                    {comment.content.length > 50 ? comment.content.slice(0, 50) + '...' : comment.content}
                  </Text>
                </div>
                <TextArea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`回复 @${comment.user?.username || '匿名用户'}...`}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  className="mb-2"
                />
                <Space size="small">
                  <Button
                    type="primary"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={() => handleReplyComment(comment.id)}
                    loading={actionLoading.create}
                  >
                    发送回复
                  </Button>
                  <Button size="small" onClick={cancelReply}>
                    取消
                  </Button>
                </Space>
              </div>
            )}

            {/* 嵌套回复 */}
            {hasReplies && isExpanded && depth < maxDepth && (
              <div className="mt-3 ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}

            {/* 如果达到最大深度，显示简化的回复列表 */}
            {hasReplies && isExpanded && depth >= maxDepth && (
              <div className="mt-3 ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                <Text type="secondary" className="text-xs mb-2 block">
                  更多回复请点击具体评论查看
                </Text>
                {comment.replies.slice(0, 3).map(reply => (
                  <div key={reply.id} className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <Text strong className="text-xs">
                      {reply.user?.username || '匿名用户'}:
                    </Text>
                    <Text className="ml-2 text-xs">{reply.content}</Text>
                  </div>
                ))}
                {comment.replies.length > 3 && (
                  <Text type="secondary" className="text-xs">
                    还有 {comment.replies.length - 3} 条回复...
                  </Text>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [
    expandedReplies,
    replyingTo,
    replyContent,
    handleLikeComment,
    handleReportComment,
    handleReplyComment,
    actionLoading,
    toggleReplies,
    cancelReply,
    getCommentShortId,
    copyCommentLink,
    scrollToComment
  ]);

  // 处理URL中的评论锚点
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#comment-') && comments.length > 0) {
      const commentId = hash.replace('#comment-', '');
      // 等待渲染完成后滚动
      setTimeout(() => {
        scrollToComment(commentId);
      }, 100);
    }
  }, [comments, scrollToComment]);

  if (error) {
    return (
      <Alert 
        message="加载评论失败" 
        description={error.message} 
        type="error" 
        showIcon 
      />
    );
  }
  
  return (
    <Card className="mt-6">
      <Title level={4}>
        <CommentOutlined /> 评论 ({total})
      </Title>
      
      {/* 发表评论 */}
      <div className="mb-6">
        <TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="发表你的评论..."
          autoSize={{ minRows: 3, maxRows: 6 }}
          className="mb-2"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleCreateComment}
          loading={actionLoading.create}
        >
          发表评论
        </Button>
      </div>
      
      <Divider />
      
      {/* 评论列表 */}
      {loading ? (
        <div className="text-center py-8">
          <Spin size="large" />
          <Text className="block mt-2">正在加载评论...</Text>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
              {renderComment(comment, 0)}
            </div>
          ))}

          {/* 分页 */}
          {total > 10 && (
            <div className="flex justify-center mt-6">
              <Button type="primary" ghost>
                加载更多评论
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <CommentOutlined className="text-4xl text-gray-300 dark:text-gray-600 mb-2" />
          <Text type="secondary" className="block">
            暂无评论，快来发表第一条评论吧！
          </Text>
        </div>
      )}
    </Card>
  );
};

export default CommentSection;
