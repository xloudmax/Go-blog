import { useCallback, useState, useEffect } from 'react';
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

const isStatic = import.meta.env.VITE_STATIC_EXPORT === 'true';

// 热门搜索词hook
export const useTrendingSearchesHook = (limit: number = 10): UseTrendingSearchesReturn => {
  const { trendingSearches, loading, error } = useTrendingSearches(limit);
  
  const [staticTrending, setStaticTrending] = useState<string[]>([]);
  const [staticLoading, setStaticLoading] = useState(false);
  
  useEffect(() => {
    if (isStatic) {
      setStaticLoading(true);
      fetch('/static/dashboard.json')
        .then(res => res.json())
        .then(data => {
          if (data && data.tags) {
            const sortedTags = data.tags.sort((a: any, b: any) => b.count - a.count).slice(0, limit);
            setStaticTrending(sortedTags.map((t: any) => t.name));
          }
        })
        .catch(console.error)
        .finally(() => setStaticLoading(false));
    }
  }, [limit]);

  return {
    trendingSearches: isStatic ? staticTrending : trendingSearches,
    loading: isStatic ? staticLoading : loading,
    error: isStatic ? null : error,
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
  const { search: graphqlSearch, results: graphqlResults, loading: graphqlLoading, error: graphqlError, fetchMore } = useEnhancedSearch();
  
  const [staticResults, setStaticResults] = useState<any>(null);
  const [staticLoading, setStaticLoading] = useState(false);
  const [staticError, setStaticError] = useState<any>(null);

  const performSearch = useCallback(async (input: SearchInput) => {
    if (isStatic) {
      setStaticLoading(true);
      setStaticError(null);
      try {
        const query = (input.query || '').toLowerCase();
        
        const res = await fetch('/static/posts.json');
        if (!res.ok) throw new Error('Failed to fetch static posts');
        const posts = await res.json();
        
        let filtered = posts;
        if (query) {
          filtered = posts.filter((p: any) => 
            (p.title || '').toLowerCase().includes(query) || 
            (p.excerpt || '').toLowerCase().includes(query) ||
            (p.content || '').toLowerCase().includes(query) ||
            (p.tags || []).some((t: string) => t.toLowerCase().includes(query))
          );
        }
        
        if (input.sortBy === 'CREATED_AT') {
           filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (input.sortBy === 'UPDATED_AT') {
           filtered.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } else if (input.sortBy === 'VIEW_COUNT') {
           filtered.sort((a: any, b: any) => (b.stats?.viewCount || 0) - (a.stats?.viewCount || 0));
        } else if (input.sortBy === 'LIKE_COUNT') {
           filtered.sort((a: any, b: any) => (b.stats?.likeCount || 0) - (a.stats?.likeCount || 0));
        }
        
        const total = filtered.length;
        const offset = input.offset || 0;
        const limit = input.limit || 10;
        const paginated = filtered.slice(offset, offset + limit);
        
        setStaticResults({
          total,
          took: '0.01s',
          posts: paginated,
          suggestions: []
        });
      } catch (err) {
        setStaticError(err);
      } finally {
        setStaticLoading(false);
      }
      return;
    }

    try {
      await graphqlSearch(input);
    } catch {
      // 错误已经在 GraphQL 层处理
    }
  }, [graphqlSearch]);
  
  return {
    search: performSearch,
    results: isStatic ? staticResults : (graphqlResults || null),
    loading: isStatic ? staticLoading : graphqlLoading,
    error: isStatic ? staticError : graphqlError,
    fetchMore,
  };
};
