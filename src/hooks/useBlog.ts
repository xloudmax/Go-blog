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

  // Static export support: Fetch from JSON files instead of GraphQL
  const isStatic = import.meta.env.VITE_STATIC_EXPORT === 'true';

  const { data, loading: apolloLoading, error: apolloError, refetch } = usePostsQuery({
    variables: {
      limit,
      offset,
      filter,
      sort
    },
    notifyOnNetworkStatusChange: true,
    skip: isStatic
  });

  const [staticPosts, setStaticPosts] = useState<BlogPost[]>([]);
  const [staticLoading, setStaticLoading] = useState(isStatic);
  const [staticError, setStaticError] = useState<Error | null>(null);

  useEffect(() => {
    if (isStatic) {
      setStaticLoading(true);
      fetch('./static/posts.json')
        .then(res => res.json())
        .then(data => {
          setStaticPosts(data);
          setStaticLoading(false);
        })
        .catch(err => {
          setStaticError(err);
          setStaticLoading(false);
        });
    }
  }, [isStatic]);

  const loading = isStatic ? staticLoading : apolloLoading;
  const error = isStatic ? staticError : apolloError;

  // 缓存上一份有效数据，防止 loading 时页面跳动
  const lastPostsRef = useRef<BlogPost[]>([]);
  const posts = useMemo(() => {
    if (isStatic) return staticPosts;
    if (data?.posts) {
      lastPostsRef.current = data.posts as BlogPost[];
      return data.posts as BlogPost[];
    }
    return lastPostsRef.current;
  }, [data?.posts, staticPosts, isStatic]);
  
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
export const useBlogSearch = (initialLimit = 15) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(initialLimit);
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
  // Static export support
  const isStatic = import.meta.env.VITE_STATIC_EXPORT === 'true';

  const { data: popularData, loading: loadingPopular } = usePopularPostsQuery({
    variables: { limit: 5 },
    skip: isStatic
  });
  const { data: recentData, loading: loadingRecent } = useRecentPostsQuery({
    variables: { limit: 5 },
    skip: isStatic
  });
  const { data: tagsData, loading: loadingTags } = useGetTagsQuery({
    variables: { limit: 20 },
    skip: isStatic
  });

  const [staticDashboard, setStaticDashboard] = useState<{
    popularPosts: BlogPost[];
    recentPosts: BlogPost[];
    tags: string[];
  }>({
    popularPosts: [],
    recentPosts: [],
    tags: []
  });

  useEffect(() => {
    if (isStatic) {
      fetch('./static/dashboard.json')
        .then(res => res.json())
        .then(data => {
          if (data) {
            setStaticDashboard({
              popularPosts: data.popularPosts || [],
              recentPosts: data.recentPosts || [],
              tags: data.tags || []
            });
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(err);
        });
    }
  }, [isStatic]);

  const popularPosts = useMemo(() => {
    if (isStatic) return staticDashboard.popularPosts;
    return popularData?.getPopularPosts || [];
  }, [popularData?.getPopularPosts, staticDashboard.popularPosts, isStatic]);

  const recentPosts = useMemo(() => {
    if (isStatic) return staticDashboard.recentPosts;
    return recentData?.getRecentPosts || [];
  }, [recentData?.getRecentPosts, staticDashboard.recentPosts, isStatic]);

  const tags = useMemo(() => {
    if (isStatic) return staticDashboard.tags || [];
    return tagsData?.getTags || [];
  }, [tagsData?.getTags, staticDashboard.tags, isStatic]);

  const stats = useMemo<DashboardStats>(() => {
    const popularPostsArray = popularPosts as BlogPost[];
    const recentPostsArray = recentPosts as BlogPost[];
    const totalViews = popularPostsArray.reduce((sum: number, post: BlogPost) => sum + (post.stats?.viewCount || 0), 0);
    const totalLikes = popularPostsArray.reduce((sum: number, post: BlogPost) => sum + (post.stats?.likeCount || 0), 0);
    const totalPosts = popularPostsArray.length + recentPostsArray.length;
    const engagementRate = popularPostsArray.length > 0
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
