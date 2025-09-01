import { useState, useCallback } from 'react';
import { 
  useSearchSuggestions, 
  useTrendingSearches, 
  useSearchStats 
} from '../api/graphql/search';

// 搜索建议hook
export const useSearchSuggestionsHook = () => {
  const { getSuggestions, suggestions, loading, error } = useSearchSuggestions();
  const [searchTerm, setSearchTerm] = useState('');

  // 获取搜索建议
  const fetchSuggestions = useCallback(async (query: string, limit?: number) => {
    if (!query.trim()) return [];
    
    setSearchTerm(query);
    await getSuggestions(query, limit);
    return suggestions;
  }, [getSuggestions, suggestions]);

  return {
    searchTerm,
    suggestions,
    loading,
    error,
    fetchSuggestions,
    setSearchTerm,
  };
};

// 热门搜索词hook
export const useTrendingSearchesHook = (limit: number = 10) => {
  const { trendingSearches, loading, error } = useTrendingSearches(limit);
  
  return {
    trendingSearches,
    loading,
    error,
  };
};

// 搜索统计hook
export const useSearchStatsHook = () => {
  const { searchStats, loading, error } = useSearchStats();
  
  return {
    searchStats,
    loading,
    error,
  };
};
