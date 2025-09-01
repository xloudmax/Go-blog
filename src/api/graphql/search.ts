import { gql, useQuery, useLazyQuery } from '@apollo/client';
import type { 
  SearchSuggestionsQuery, 
  TrendingSearchesQuery, 
  SearchStatsQuery 
} from '@/generated/graphql';

// 搜索建议查询
export const SEARCH_SUGGESTIONS_QUERY = gql`
  query SearchSuggestions($query: String!, $limit: Int) {
    getSearchSuggestions(query: $query, limit: $limit)
  }
`;

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

// 搜索建议 Hook
export const useSearchSuggestions = () => {
  const [searchSuggestions, { data, loading, error }] = useLazyQuery(SEARCH_SUGGESTIONS_QUERY, {
    errorPolicy: 'all',
  });

  const getSuggestions = (query: string, limit?: number) => {
    return searchSuggestions({
      variables: { query, limit },
    });
  };

  return {
    getSuggestions,
    suggestions: data?.getSearchSuggestions || [],
    loading,
    error,
  };
};

// 热门搜索词 Hook
export const useTrendingSearches = (limit: number = 10) => {
  const { data, loading, error } = useQuery(TRENDING_SEARCHES_QUERY, {
    variables: { limit },
    errorPolicy: 'all',
  });

  return {
    trendingSearches: data?.getTrendingSearches || [],
    loading,
    error,
  };
};

// 搜索统计信息 Hook
export const useSearchStats = () => {
  const { data, loading, error } = useQuery(SEARCH_STATS_QUERY, {
    errorPolicy: 'all',
  });

  return {
    searchStats: data?.getSearchStats || null,
    loading,
    error,
  };
};
