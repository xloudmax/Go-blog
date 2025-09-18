import { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { notification } from 'antd';
import { LIKE_POST_MUTATION, UNLIKE_POST_MUTATION, POST_QUERY } from '@/api/graphql';
import { useAppUser } from './appStateHooks';

export interface UseLikeProps {
  postId: string;
  initialIsLiked: boolean;
  initialLikeCount: number;
}

export const useLike = ({ postId, initialIsLiked, initialLikeCount }: UseLikeProps) => {
  const { isAuthenticated } = useAppUser();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const [likePost] = useMutation(LIKE_POST_MUTATION, {
    onError: (error) => {
      // 回滚乐观更新
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
      
      notification.error({
        message: '错误',
        description: `点赞失败: ${error.message}`,
        duration: 5,
      });
    },
    // 乐观响应 - 假设操作会成功
    optimisticResponse: {
      likePost: {
        __typename: 'BlogPost',
        id: postId,
        stats: {
          __typename: 'BlogPostStats',
          likeCount: likeCount + 1,
        },
        isLiked: true,
      },
    },
    // 更新缓存
    update: (cache, { data }) => {
      if (data?.likePost) {
        // 更新 POST_QUERY 缓存
        const existingPost = cache.readQuery({
          query: POST_QUERY,
          variables: { slug: postId },
        });

        if ((existingPost as any)?.post) {
          cache.writeQuery({
            query: POST_QUERY,
            variables: { slug: postId },
            data: {
              post: {
                ...(existingPost as any).post,
                stats: {
                  ...(existingPost as any).post.stats,
                  likeCount: data.likePost.stats?.likeCount || likeCount + 1,
                },
                isLiked: true,
              },
            },
          });
        }
      }
    },
  });

  const [unlikePost] = useMutation(UNLIKE_POST_MUTATION, {
    onError: (error) => {
      // 回滚乐观更新
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      
      notification.error({
        message: '错误',
        description: `取消点赞失败: ${error.message}`,
        duration: 5,
      });
    },
    // 乐观响应 - 假设操作会成功
    optimisticResponse: {
      unlikePost: {
        __typename: 'BlogPost',
        id: postId,
        stats: {
          __typename: 'BlogPostStats',
          likeCount: Math.max(0, likeCount - 1),
        },
        isLiked: false,
      },
    },
    // 更新缓存
    update: (cache, { data }) => {
      if (data?.unlikePost) {
        // 更新 POST_QUERY 缓存
        const existingPost = cache.readQuery({
          query: POST_QUERY,
          variables: { slug: postId },
        });

        if (existingPost) {
          cache.writeQuery({
            query: POST_QUERY,
            variables: { slug: postId },
            data: {
              post: {
                ...(existingPost as any).post,
                stats: {
                  ...(existingPost as any).post.stats,
                  likeCount: data.unlikePost.stats?.likeCount || Math.max(0, likeCount - 1),
                },
                isLiked: false,
              },
            },
          });
        }
      }
    },
  });

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      notification.warning({
        message: '提示',
        description: '请先登录',
        duration: 3,
      });
      return;
    }

    try {
      if (isLiked) {
        // 乐观更新 - 立即更新UI
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        
        // 发送取消点赞请求
        await unlikePost({ 
          variables: { id: postId },
        });
        
        notification.success({
          message: '成功',
          description: '取消点赞成功',
          duration: 2,
        });
      } else {
        // 乐观更新 - 立即更新UI
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        
        // 发送点赞请求
        await likePost({ 
          variables: { id: postId },
        });
        
        notification.success({
          message: '成功',
          description: '点赞成功',
          duration: 2,
        });
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      // 错误处理已经在 mutation 的 onError 中处理
    }
  }, [isAuthenticated, isLiked, likeCount, postId, likePost, unlikePost]);

  return {
    isLiked,
    likeCount,
    handleLike,
  };
};
