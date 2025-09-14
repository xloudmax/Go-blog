import { gql, useQuery, useLazyQuery } from '@apollo/client';
import type { 
  TrendingSearchesQuery, 
  SearchStatsQuery 
} from '@/generated/graphql';
import type { 
  UseTrendingSearchesReturn,
  UseSearchStatsReturn,
  SearchStats as TypedSearchStats
} from '@/types';

// 热门搜索词查询
export const TRENDING_SEARCHES_QUERY = gql`
  query TrendingSearches($limit: Int) {
    getTrendingSearches(limit: $limit)
  }
`;

// 搜索统计信息查询
export const SEARCH_STATS_QUERY = gql`
  query SearchStats {
    getSearchStats {
      totalSearches
      popularQueries {
        query
        count
        lastSearched
      }
      searchTrends {
        date
        searchCount
        topQueries
      }
    }
  }
`;

// 基础搜索查询 - 使用后端现有的searchPosts
export const BASIC_SEARCH_QUERY = gql`
  query SearchPosts($query: String!, $limit: Int, $offset: Int) {
    searchPosts(query: $query, limit: $limit, offset: $offset) {
      posts {
        id
        title
        slug
        excerpt
        tags
        categories
        coverImageUrl
        status
        publishedAt
        author {
          id
          username
          avatar
        }
        stats {
          viewCount
          likeCount
        }
      }
      total
      took
    }
  }
`;

// 热门搜索词 Hook
export const useTrendingSearches = (limit: number = 10): UseTrendingSearchesReturn => {
  const { data, loading, error } = useQuery(TRENDING_SEARCHES_QUERY, {
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
  const { data, loading, error } = useQuery(SEARCH_STATS_QUERY, {
    errorPolicy: 'all',
  });

  return {
    searchStats: data?.getSearchStats as TypedSearchStats | null,
    loading,
    error,
  };
};

// 基础搜索 Hook - 替代增强搜索
export const useEnhancedSearch = () => {
  const [searchPosts, { data, loading, error, fetchMore }] = useLazyQuery(BASIC_SEARCH_QUERY, {
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