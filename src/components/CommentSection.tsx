import React, { useState, useCallback } from 'react';
import { 
  Card, 
  List, 
  Avatar, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Divider,
  notification,
  Spin,
  Alert
} from 'antd';
import { 
  UserOutlined, 
  LikeOutlined, 
  LikeFilled, 
  FlagOutlined,
  SendOutlined,
  CommentOutlined
} from '@ant-design/icons';
import { useComments, useCommentActionsHook } from '@/hooks';
import type { BlogPostComment } from '@/types';
import dayjs from 'dayjs';

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
  
  // 渲染单个评论
  const renderComment = (comment: BlogPostComment) => {
    const isLiked = false; // 这里应该从用户状态中获取
    
    return (
      <List.Item>
        <div className="w-full">
          <div className="flex">
            <Avatar 
              src={comment.user?.avatar} 
              icon={<UserOutlined />} 
              className="flex-shrink-0 mr-3"
            />
            <div className="flex-1">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <Text strong>{comment.user?.username || '匿名用户'}</Text>
                  <Text type="secondary" className="text-xs">
                    {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </div>
                <Text className="block mt-1">{comment.content}</Text>
              </div>
              
              <Space className="mt-2" size="middle">
                <Button 
                  type="text" 
                  size="small"
                  icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
                  onClick={() => handleLikeComment(comment.id, isLiked)}
                  loading={actionLoading.like || actionLoading.unlike}
                >
                  {comment.likeCount > 0 ? comment.likeCount : ''}
                </Button>
                
                <Button 
                  type="text" 
                  size="small"
                  onClick={() => setReplyingTo(comment.id === replyingTo ? null : comment.id)}
                >
                  回复
                </Button>
                
                <Button 
                  type="text" 
                  size="small"
                  icon={<FlagOutlined />}
                  onClick={() => handleReportComment(comment.id)}
                  loading={actionLoading.report}
                >
                  举报
                </Button>
              </Space>
              
              {/* 回复输入框 */}
              {replyingTo === comment.id && (
                <div className="mt-3 flex">
                  <TextArea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="输入回复内容..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    className="mr-2"
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleReplyComment(comment.id)}
                    loading={actionLoading.create}
                  >
                    发送
                  </Button>
                </div>
              )}
              
              {/* 显示回复 */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 ml-8">
                  <List
                    dataSource={comment.replies}
                    renderItem={renderReply}
                    size="small"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </List.Item>
    );
  };
  
  // 渲染回复
  const renderReply = (reply: BlogPostComment) => {
    return (
      <div className="flex mt-2" key={reply.id}>
        <Avatar 
          src={reply.user?.avatar} 
          icon={<UserOutlined />} 
          size="small"
          className="flex-shrink-0 mr-2"
        />
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
            <div className="flex justify-between items-start">
              <Text strong>{reply.user?.username || '匿名用户'}</Text>
              <Text type="secondary" className="text-xs">
                {dayjs(reply.createdAt).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
            <Text className="block mt-1 text-sm">{reply.content}</Text>
          </div>
        </div>
      </div>
    );
  };
  
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
        <List
          dataSource={comments}
          renderItem={renderComment}
          pagination={{
            pageSize: 10,
            total: total,
            showSizeChanger: false,
          }}
        />
      ) : (
        <Text type="secondary" className="text-center block py-8">
          暂无评论，快来发表第一条评论吧！
        </Text>
      )}
    </Card>
  );
};

export default CommentSection;
