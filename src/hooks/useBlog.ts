import { useState, useCallback, useMemo } from 'react';
import { 
  usePostsQuery, 
  usePostQuery, 
  usePopularPostsQuery, 
  useRecentPostsQuery, 
  useTrendingTagsQuery,
  useSearchPostsQuery
} from '@/generated/graphql';
import type { 
  PostFilterInput,
  PostSortInput,
  PostStatus,
  AccessLevel
} from '@/generated/graphql';
import type { 
  BlogPost,
  CreatePostInput,
  UpdatePostInput,
  DashboardStats
} from '@/types';

// 博客列表管理hook
export const useBlogList = () => {
  const [filter, setFilter] = useState<PostFilterInput>({});
  const [sort, setSort] = useState<PostSortInput>({ field: 'created_at', order: 'DESC' });
  const [limit] = useState(20);

  const { data, loading, error, fetchMore, refetch } = usePostsQuery({
    variables: { limit, offset: 0, filter, sort },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  const posts = data?.posts || [];

  const loadMore = useCallback(() => {
    return fetchMore({
      variables: {
        offset: posts.length,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          posts: [...(prev.posts || []), ...(fetchMoreResult.posts || [])],
        };
      },
    });
  }, [fetchMore, posts.length]);

  // 筛选方法
  const filterByAuthor = useCallback((authorId: string) => {
    setFilter(prev => ({ ...prev, authorId }));
  }, []);

  const filterByStatus = useCallback((status: PostStatus) => {
    setFilter(prev => ({ ...prev, status }));
  }, []);

  const filterByTags = useCallback((tags: string[]) => {
    setFilter(prev => ({ ...prev, tags }));
  }, []);

  const filterBySearch = useCallback((search: string) => {
    setFilter(prev => ({ ...prev, search }));
  }, []);

  const filterByDateRange = useCallback((startDate: string, endDate: string) => {
    setFilter(prev => ({ ...prev, startDate, endDate }));
  }, []);

  const filterByAccessLevel = useCallback((accessLevel: AccessLevel) => {
    setFilter(prev => ({ ...prev, accessLevel }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter({});
  }, []);

  // 排序方法
  const sortBy = useCallback((field: string, order: 'ASC' | 'DESC' = 'DESC') => {
    setSort({ field, order });
  }, []);

  return {
    posts: posts as BlogPost[],
    loading,
    error,
    loadMore,
    refetch,

    // 筛选状态
    filter,
    sort,

    // 筛选方法
    filterByAuthor,
    filterByStatus,
    filterByTags,
    filterBySearch,
    filterByDateRange,
    filterByAccessLevel,
    clearFilters,

    // 排序方法
    sortBy,
  };
};

// 博客搜索hook
export const useBlogSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('blog_search_history');
    return saved ? JSON.parse(saved) : [];
  });

  const { data: searchData, loading, error } = useSearchPostsQuery({
    variables: { query: searchQuery, limit: 20, offset: 0 },
    skip: !searchQuery,
  });
  
  // 执行搜索 - 修复无限循环问题
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    
    // 添加到搜索历史
    setSearchHistory(prevHistory => {
      const newHistory = [query, ...prevHistory.filter(h => h !== query)].slice(0, 10);
      localStorage.setItem('blog_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []); // 移除searchHistory依赖
  
  // 清除搜索历史
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('blog_search_history');
  }, []);
  
  return {
    searchQuery,
    results: searchData?.searchPosts?.posts || [],
    total: searchData?.searchPosts?.total || 0,
    loading,
    error,
    searchHistory,
    
    // 操作
    performSearch,
    clearSearchHistory,
    setSearchQuery,
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
  const { data: tagsData, loading: loadingTags } = useTrendingTagsQuery({
    variables: { limit: 10 }
  });

  const popularPosts = popularData?.getPopularPosts || [];
  const recentPosts = recentData?.getRecentPosts || [];
  const trendingTags = tagsData?.getTrendingTags || [];
  
  const stats = useMemo<DashboardStats>(() => {
    return {
      totalViews: popularPosts.reduce((sum, post) => sum + (post.stats?.viewCount || 0), 0),
      totalLikes: popularPosts.reduce((sum, post) => sum + (post.stats?.likeCount || 0), 0),
      totalPosts: popularPosts.length + recentPosts.length,
      engagementRate: popularPosts.length > 0 
        ? (popularPosts.reduce((sum, post) => sum + (post.stats?.likeCount || 0), 0) / popularPosts.reduce((sum, post) => sum + (post.stats?.viewCount || 0), 1)) * 100 
        : 0
    };
  }, [popularPosts, recentPosts]);
  
  return {
    popularPosts: popularPosts as BlogPost[],
    recentPosts: recentPosts as BlogPost[],
    trendingTags,
    stats,
    loading: loadingPopular || loadingRecent || loadingTags,
  };
};