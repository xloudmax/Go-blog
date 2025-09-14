import { useState, useCallback } from 'react';
import { 
  useCommentsQuery,
  useCommentQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
  useReportCommentMutation,
  type CreateCommentMutationVariables,
  type UpdateCommentMutationVariables
} from '@/generated/graphql';
import type { 
  UseCommentsReturn,
  UseCommentReturn,
  UseCommentActionsReturn,
  CreateCommentInput,
  UpdateCommentInput
} from '@/types';

// 评论列表hook
export const useComments = (blogPostId: string, limit: number = 10): UseCommentsReturn => {
  const [offset, setOffset] = useState(0);
  
  const { data, loading, error, fetchMore, refetch } = useCommentsQuery({
    variables: { blogPostId, limit, offset },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });
  
  const loadMore = useCallback(() => {
    return fetchMore({
      variables: {
        offset: data?.comments?.comments?.length || 0,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          comments: {
            ...prev.comments,
            comments: [...(prev.comments.comments || []), ...(fetchMoreResult.comments.comments || [])],
          },
        };
      },
    });
  }, [data?.comments?.comments?.length, fetchMore]);
  
  return {
    comments: data?.comments?.comments || [],
    total: data?.comments?.total || 0,
    loading,
    error,
    loadMore,
    refetch,
  };
};

// 单个评论hook
export const useComment = (id: string): UseCommentReturn => {
  const { data, loading, error } = useCommentQuery({
    variables: { id },
    errorPolicy: 'all',
  });
  
  return {
    comment: data?.comment || null,
    loading,
    error,
  };
};

// 评论操作hook
export const useCommentActionsHook = (): UseCommentActionsReturn => {
  // 使用生成的hooks
  const [createCommentMutation, { loading: createLoading, error: createError }] = useCreateCommentMutation({
    refetchQueries: ['Comments'],
    awaitRefetchQueries: true,
  });
  
  const [updateCommentMutation, { loading: updateLoading, error: updateError }] = useUpdateCommentMutation();
  
  const [deleteCommentMutation, { loading: deleteLoading, error: deleteError }] = useDeleteCommentMutation({
    refetchQueries: ['Comments'],
    awaitRefetchQueries: true,
  });
  
  const [likeCommentMutation, { loading: likeLoading }] = useLikeCommentMutation();
  
  const [unlikeCommentMutation, { loading: unlikeLoading }] = useUnlikeCommentMutation();
  
  const [reportCommentMutation, { loading: reportLoading }] = useReportCommentMutation();
  
  const createComment = useCallback(async (input: CreateCommentInput) => {
    const result = await createCommentMutation({
      variables: { input },
    });
    return result.data?.createComment;
  }, [createCommentMutation]);
  
  const updateComment = useCallback(async (id: string, input: UpdateCommentInput) => {
    const result = await updateCommentMutation({
      variables: { id, input },
    });
    return result.data?.updateComment;
  }, [updateCommentMutation]);
  
  const deleteComment = useCallback(async (id: string) => {
    const result = await deleteCommentMutation({
      variables: { id },
    });
    return result.data?.deleteComment;
  }, [deleteCommentMutation]);
  
  const likeComment = useCallback(async (id: string) => {
    const result = await likeCommentMutation({
      variables: { id },
    });
    return result.data?.likeComment;
  }, [likeCommentMutation]);
  
  const unlikeComment = useCallback(async (id: string) => {
    const result = await unlikeCommentMutation({
      variables: { id },
    });
    return result.data?.unlikeComment;
  }, [unlikeCommentMutation]);
  
  const reportComment = useCallback(async (id: string) => {
    const result = await reportCommentMutation({
      variables: { id },
    });
    return result.data?.reportComment;
  }, [reportCommentMutation]);
  
  return {
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment,
    reportComment,
    loading: {
      create: createLoading,
      update: updateLoading,
      delete: deleteLoading,
      like: likeLoading,
      unlike: unlikeLoading,
      report: reportLoading,
    },
    errors: {
      create: createError,
      update: updateError,
      delete: deleteError,
    },
  };
};