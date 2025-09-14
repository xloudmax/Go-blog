import { useState, useCallback } from 'react';
import { 
  useTrendingSearches, 
  useSearchStats,
  useEnhancedSearch
} from '../api/graphql/search';
import type { 
  UseTrendingSearchesReturn, 
  UseSearchStatsReturn,
  UseEnhancedSearchReturn,
  SearchStats as SearchStatsType,
  SearchInput
} from '../types';


// 热门搜索词hook
export const useTrendingSearchesHook = (limit: number = 10): UseTrendingSearchesReturn => {
  const { trendingSearches, loading, error } = useTrendingSearches(limit);
  
  return {
    trendingSearches,
    loading,
    error,
  };
};

// 搜索统计hook
export const useSearchStatsHook = (): UseSearchStatsReturn => {
  const { searchStats, loading, error } = useSearchStats();
  
  return {
    searchStats: searchStats as SearchStatsType | null,
    loading,
    error,
  };
};

// 增强的搜索hook
export const useEnhancedSearchHook = (): UseEnhancedSearchReturn => {
  const { search, results, loading, error, fetchMore } = useEnhancedSearch();
  
  const performSearch = useCallback(async (input: SearchInput) => {
    try {
      await search(input);
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [search]);
  
  return {
    search: performSearch,
    results: results as any,
    loading,
    error,
    fetchMore,
  };
};