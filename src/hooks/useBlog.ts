import { useState, useCallback, useMemo } from 'react';
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
export const useBlogList = (initialLimit = 10) => {
  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<PostFilterInput>({
    status: 'PUBLISHED' as PostStatus
  });
  const [sort, setSort] = useState<PostSortInput>({
    field: 'created_at',
    direction: 'DESC'
  });

  const { data, loading, error, refetch } = usePostsQuery({
    variables: {
      limit,
      offset,
      filter,
      sort
    }
  });

  const posts = useMemo(() => data?.posts || [], [data?.posts]);
  
  // 简单的分页处理
  const goToPage = useCallback((page: number) => {
    setOffset((page - 1) * limit);
  }, [limit]);

  return {
    posts: posts as BlogPost[],
    loading,
    error,
    refetch,
    limit,
    offset,
    setLimit,
    setOffset,
    setFilter,
    setSort,
    goToPage
  };
};

// 博客搜索hook
export const useBlogSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const { data, loading, error, refetch } = useSearchPostsQuery({
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
