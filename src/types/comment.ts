// 评论相关类型定义
import type { 
  BlogPostComment as GeneratedBlogPostComment,
  CreateCommentInput as GeneratedCreateCommentInput,
  UpdateCommentInput as GeneratedUpdateCommentInput
} from '@/generated/graphql';

// Comment type
export type BlogPostComment = GeneratedBlogPostComment;

// Create comment input type
export type CreateCommentInput = GeneratedCreateCommentInput;

// Update comment input type
export type UpdateCommentInput = GeneratedUpdateCommentInput;

// 评论过滤器
export interface CommentFilter {
  blogPostId?: string;
  userId?: string;
  isApproved?: boolean;
}

// 评论排序
export interface CommentSort {
  field?: string;
  order?: 'ASC' | 'DESC';
}

// 评论结果
export interface CommentResult {
  comments: BlogPostComment[];
  total: number;
}

// 评论钩子返回类型
export interface UseCommentsReturn {
  comments: BlogPostComment[];
  total: number;
  loading: boolean;
  error?: Error;
  loadMore: () => void;
  refetch: () => void;
}

export interface UseCommentReturn {
  comment: BlogPostComment | null;
  loading: boolean;
  error?: Error;
}

export interface UseCommentActionsReturn {
  createComment: (input: CreateCommentInput) => Promise<BlogPostComment>;
  updateComment: (id: string, input: UpdateCommentInput) => Promise<BlogPostComment>;
  deleteComment: (id: string) => Promise<void>;
  likeComment: (id: string) => Promise<BlogPostComment>;
  unlikeComment: (id: string) => Promise<BlogPostComment>;
  reportComment: (id: string) => Promise<BlogPostComment>;
  
  loading: {
    create: boolean;
    update: boolean;
    delete: boolean;
    like: boolean;
    unlike: boolean;
    report: boolean;
  };
  
  errors: {
    create?: Error;
    update?: Error;
    delete?: Error;
  };
}