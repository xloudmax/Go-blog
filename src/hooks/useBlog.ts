import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  usePostsQuery, 
  usePopularPostsQuery, 
  useRecentPostsQuery, 
  useGetTagsQuery,
  useSearchPostsQuery
} from '@/generated/graphql';
import type { 
  PostFilterInput,
  PostSortInput,
  PostStatus
} from '@/generated/graphql';
import type { 
  BlogPost,
  DashboardStats
} from '@/types';

// 博客列表hook
export const useBlogList = (initialLimit = 15) => {
  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<PostFilterInput>({
    status: 'PUBLISHED' as PostStatus
  });
  const [sort, setSort] = useState<PostSortInput>({
    field: 'created_at',
    order: 'DESC'
  });

  const { data, loading, error, refetch } = usePostsQuery({
    variables: {
      limit,
      offset,
      filter,
      sort
    },
    notifyOnNetworkStatusChange: true // Ensure loading state updates on refetch
  });

  // 缓存上一份有效数据，防止 loading 时页面跳动
  const lastPostsRef = useRef<BlogPost[]>([]);
  const posts = useMemo(() => {
    if (data?.posts) {
      lastPostsRef.current = data.posts as BlogPost[];
      return data.posts as BlogPost[];
    }
    return lastPostsRef.current;
  }, [data?.posts]);
  
  // 简单的分页处理
  const goToPage = useCallback((page: number) => {
    setOffset((page - 1) * limit);
  }, [limit]);

  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 加载更多 (防抖)
  const loadMore = useCallback(() => {
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }
    
    loadMoreTimeoutRef.current = setTimeout(() => {
      setLimit((prev) => prev + 3);
      loadMoreTimeoutRef.current = null;
    }, 300); // 300ms debounce
  }, []);

  // 清里定时器
  useEffect(() => {
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, []);

  // 搜索过滤
  const filterBySearch = useCallback((search: string) => {
    setFilter((prev) => ({ ...prev, search }));
    setOffset(0);
  }, []);

  // 标签过滤
  const filterByTags = useCallback((tags: string[]) => {
    setFilter((prev) => ({ ...prev, tags }));
    setOffset(0);
  }, []);

  // 状态过滤
  const filterByStatus = useCallback((status: PostStatus) => {
    setFilter((prev) => ({ ...prev, status }));
    setOffset(0);
  }, []);

  // 清除过滤
  const clearFilters = useCallback(() => {
    setFilter({ status: 'PUBLISHED' as PostStatus });
    setOffset(0);
  }, []);

  return {
    posts: posts as BlogPost[],
    hasMore: posts.length >= limit, // Simple check: if we got fewer posts than limit, we reached the end
    loading,
    error,
    refetch,
    limit,
    offset,
    filter,
    sort,
    setLimit,
    setOffset,
    setFilter,
    setSort,
    goToPage,
    loadMore,
    filterBySearch,
    filterByTags,
    filterByStatus,
    clearFilters
  };
};


// 博客搜索hook
export const useBlogSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const { data, loading, error } = useSearchPostsQuery({
    variables: {
      query: searchQuery,
      limit,
      offset
    },
    skip: !searchQuery
  });

  const searchResults = useMemo(() => data?.searchPosts?.posts || [], [data?.searchPosts?.posts]);
  const total = useMemo(() => data?.searchPosts?.total || 0, [data?.searchPosts?.total]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
    setOffset(0);
  }, []);

  return {
    results: searchResults as BlogPost[],
    total,
    loading,
    error,
    search,
    limit,
    offset,
    setLimit,
    setOffset
  };
};

// 博客仪表盘hook
export const useBlogDashboard = () => {
  const { data: popularData, loading: loadingPopular } = usePopularPostsQuery({
    variables: { limit: 5 }
  });
  const { data: recentData, loading: loadingRecent } = useRecentPostsQuery({
    variables: { limit: 5 }
  });
  const { data: tagsData, loading: loadingTags } = useGetTagsQuery({
    variables: { limit: 20 }
  });

  const popularPosts = useMemo(() => popularData?.getPopularPosts || [], [popularData?.getPopularPosts]);
  const recentPosts = useMemo(() => recentData?.getRecentPosts || [], [recentData?.getRecentPosts]);
  const tags = useMemo(() => tagsData?.getTags || [], [tagsData?.getTags]);

  const stats = useMemo<DashboardStats>(() => {
    const totalViews = popularPosts.reduce((sum, post) => sum + (post.stats?.viewCount || 0), 0);
    const totalLikes = popularPosts.reduce((sum, post) => sum + (post.stats?.likeCount || 0), 0);
    const totalPosts = popularPosts.length + recentPosts.length;
    const engagementRate = popularPosts.length > 0
      ? (totalLikes / Math.max(totalViews, 1)) * 100
      : 0;
    const avgEngagement = totalPosts > 0 ? (totalLikes + totalViews) / totalPosts : 0;

    return {
      totalViews,
      totalLikes,
      totalPosts,
      engagementRate,
      avgEngagement,
    };
  }, [popularPosts, recentPosts]);

  return {
    popularPosts: popularPosts as BlogPost[],
    recentPosts: recentPosts as BlogPost[],
    tags,
    stats,
    loading: loadingPopular || loadingRecent || loadingTags,
  };
};
