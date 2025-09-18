import type {
  UseTrendingSearchesReturn,
  UseSearchStatsReturn,
  SearchStats as TypedSearchStats
} from '@/types';

// Import generated operations
import {
  useSearchPostsLazyQuery,
  useEnhancedSearchLazyQuery,
  useTrendingSearchesQuery,
  useSearchStatsQuery,
  SearchPostsDocument,
  EnhancedSearchDocument,
  TrendingSearchesDocument,
  SearchStatsDocument
} from '@/generated/graphql';

// Export the generated documents for backward compatibility
export const BASIC_SEARCH_QUERY = SearchPostsDocument;
export const ENHANCED_SEARCH_QUERY = EnhancedSearchDocument;
export const TRENDING_SEARCHES_QUERY = TrendingSearchesDocument;
export const SEARCH_STATS_QUERY = SearchStatsDocument;

// 热门搜索词 Hook
export const useTrendingSearches = (limit: number = 10): UseTrendingSearchesReturn => {
  const { data, loading, error } = useTrendingSearchesQuery({
    variables: { limit },
    errorPolicy: 'all',
  });

  return {
    trendingSearches: data?.getTrendingSearches as string[] || [],
    loading,
    error,
  };
};

// 搜索统计信息 Hook
export const useSearchStats = (): UseSearchStatsReturn => {
  const { data, loading, error } = useSearchStatsQuery({
    errorPolicy: 'all',
  });

  return {
    searchStats: data?.getSearchStats as TypedSearchStats | null,
    loading,
    error,
  };
};

// 基础搜索 Hook
export const useBasicSearch = () => {
  const [searchPosts, { data, loading, error, fetchMore }] = useSearchPostsLazyQuery({
    errorPolicy: 'all',
  });

  const search = (params: { query: string; limit?: number; offset?: number }) => {
    return searchPosts({
      variables: {
        query: params.query,
        limit: params.limit || 10,
        offset: params.offset || 0
      },
    });
  };

  return {
    search,
    results: data?.searchPosts,
    loading,
    error,
    fetchMore,
  };
};

// 增强搜索 Hook - 使用真正的enhancedSearch
export const useEnhancedSearch = () => {
  const [enhancedSearch, { data, loading, error, fetchMore }] = useEnhancedSearchLazyQuery({
    errorPolicy: 'all',
  });

  const search = (params: { query: string; limit?: number; offset?: number; filters?: any; sortBy?: string }) => {
    const input = {
      query: params.query,
      limit: params.limit || 10,
      offset: params.offset || 0,
      filters: params.filters || null,
      sortBy: params.sortBy || null,
    };

    return enhancedSearch({
      variables: { input },
    });
  };

  return {
    search,
    results: data?.enhancedSearch,
    loading,
    error,
    fetchMore,
  };
};
