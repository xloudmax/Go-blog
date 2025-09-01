import { useState, useCallback, useMemo } from 'react';
import { 
  usePosts, 
  useSearchPosts,
  usePopularPosts,
  useRecentPosts,
  useTrendingTags
} from '../api/graphql';
import { PostFilterInput, PostSortInput, AccessLevel, PostStatus } from '../generated/graphql';

// 博客列表管理hook
export const useBlogList = () => {
  const [filter, setFilter] = useState<PostFilterInput>({});
  const [sort, setSort] = useState<PostSortInput>({ field: 'createdAt', order: 'DESC' });
  const [limit] = useState(20);

  const { posts, loading, error, loadMore, refetch } = usePosts(filter, sort, limit);

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
    posts,
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
  const { search, results, loading, error } = useSearchPosts();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('blog_search_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  // 执行搜索
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    
    // 添加到搜索历史
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('blog_search_history', JSON.stringify(newHistory));
    
    // 执行搜索
    await search(query);
  }, [search, searchHistory]);
  
  // 清除搜索历史
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('blog_search_history');
  }, []);
  
  return {
    searchQuery,
    results,
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
  const { posts: popularPosts, loading: loadingPopular } = usePopularPosts(5);
  const { posts: recentPosts, loading: loadingRecent } = useRecentPosts(5);
  const { tags: trendingTags, loading: loadingTags } = useTrendingTags(10);
  
  const stats = useMemo(() => {
    return {
      totalViews: popularPosts.reduce((sum: number, post: { stats: { viewCount: number; }; }) => sum + (post.stats?.viewCount || 0), 0),
      totalLikes: popularPosts.reduce((sum: number, post: { stats: { likeCount: number; }; }) => sum + (post.stats?.likeCount || 0), 0),
      avgEngagement: popularPosts.length > 0 
        ? popularPosts.reduce((sum: number, post: { stats: { likeCount: number; viewCount: number; }; }) => sum + ((post.stats?.likeCount || 0) / Math.max(post.stats?.viewCount || 1, 1)), 0) / popularPosts.length
        : 0,
    };
  }, [popularPosts]);
  
  const loading = loadingPopular || loadingRecent || loadingTags;
  
  return {
    popularPosts,
    recentPosts,
    trendingTags,
    stats,
    loading,
  };
};