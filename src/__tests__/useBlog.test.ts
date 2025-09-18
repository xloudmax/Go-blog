import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBlogList, useBlogSearch, useBlogDashboard } from '../hooks/useBlog';

// Mock the generated GraphQL hooks
vi.mock('../generated/graphql', () => ({
  usePostsQuery: vi.fn(),
  useSearchPostsQuery: vi.fn(),
  usePopularPostsQuery: vi.fn(),
  useRecentPostsQuery: vi.fn(),
  useTrendingTagsQuery: vi.fn(),
}));

describe('useBlog Hook Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up localStorage
    localStorage.clear();
  });

  describe('useBlogList', () => {
    it('should initialize with default filter and sort values', async () => {
      // Mock the usePostsQuery hook return value
      const { usePostsQuery } = await import('../generated/graphql');
      (usePostsQuery as any).mockReturnValue({
        data: { posts: [] },
        loading: false,
        error: null,
        fetchMore: vi.fn(),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBlogList());

      expect(result.current.filter).toEqual({});
      expect(result.current.sort).toEqual({ field: 'created_at', order: 'DESC' });
    });

    it('should update filter when filterByAuthor is called', async () => {
      const { usePostsQuery } = await import('../generated/graphql');
      (usePostsQuery as any).mockReturnValue({
        data: { posts: [] },
        loading: false,
        error: null,
        fetchMore: vi.fn(),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBlogList());

      act(() => {
        result.current.filterByAuthor('author123');
      });

      expect(result.current.filter).toEqual({ authorId: 'author123' });
    });

    it('should update filter when filterByStatus is called', async () => {
      const { usePostsQuery } = await import('../generated/graphql');
      (usePostsQuery as any).mockReturnValue({
        data: { posts: [] },
        loading: false,
        error: null,
        fetchMore: vi.fn(),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBlogList());

      act(() => {
        result.current.filterByStatus('PUBLISHED' as any);
      });

      expect(result.current.filter).toEqual({ status: 'PUBLISHED' });
    });

    it('should clear filters when clearFilters is called', async () => {
      const { usePostsQuery } = await import('../generated/graphql');
      (usePostsQuery as any).mockReturnValue({
        data: { posts: [] },
        loading: false,
        error: null,
        fetchMore: vi.fn(),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBlogList());

      // Set some filters first
      act(() => {
        result.current.filterByAuthor('author123');
        result.current.filterByStatus('PUBLISHED' as any);
      });

      expect(result.current.filter).toEqual({ authorId: 'author123', status: 'PUBLISHED' });

      // Clear filters
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filter).toEqual({});
    });

    it('should update sort when sortBy is called', async () => {
      const { usePostsQuery } = await import('../generated/graphql');
      (usePostsQuery as any).mockReturnValue({
        data: { posts: [] },
        loading: false,
        error: null,
        fetchMore: vi.fn(),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBlogList());

      act(() => {
        result.current.sortBy('title', 'ASC');
      });

      expect(result.current.sort).toEqual({ field: 'title', order: 'ASC' });
    });
  });

  describe('useBlogSearch', () => {
    it('should initialize with empty search query and history', async () => {
      const { useSearchPostsQuery } = await import('../generated/graphql');
      (useSearchPostsQuery as any).mockReturnValue({
        data: null,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useBlogSearch());

      expect(result.current.searchQuery).toBe('');
      expect(result.current.searchHistory).toEqual([]);
    });

    it('should perform search and update history', async () => {
      const { useSearchPostsQuery } = await import('../generated/graphql');
      (useSearchPostsQuery as any).mockReturnValue({
        data: { searchPosts: { posts: [], total: 0 } },
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useBlogSearch());

      act(() => {
        result.current.performSearch('test query');
      });

      expect(result.current.searchQuery).toBe('test query');
      expect(result.current.searchHistory).toEqual(['test query']);
    });

    it('should load search history from localStorage', async () => {
      const history = ['query1', 'query2'];
      localStorage.setItem('blog_search_history', JSON.stringify(history));

      const { useSearchPostsQuery } = await import('../generated/graphql');
      (useSearchPostsQuery as any).mockReturnValue({
        data: null,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useBlogSearch());

      expect(result.current.searchHistory).toEqual(history);
    });

    it('should clear search history', async () => {
      const history = ['query1', 'query2'];
      localStorage.setItem('blog_search_history', JSON.stringify(history));

      const { useSearchPostsQuery } = await import('../generated/graphql');
      (useSearchPostsQuery as any).mockReturnValue({
        data: null,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useBlogSearch());

      act(() => {
        result.current.clearSearchHistory();
      });

      expect(result.current.searchHistory).toEqual([]);
      expect(localStorage.getItem('blog_search_history')).toBeNull();
    });
  });

  describe('useBlogDashboard', () => {
    it('should calculate stats correctly', async () => {
      const mockPosts = [
        { stats: { viewCount: 100, likeCount: 10 } },
        { stats: { viewCount: 200, likeCount: 30 } },
        { stats: { viewCount: 150, likeCount: 20 } },
      ];

      const { usePopularPostsQuery, useRecentPostsQuery, useTrendingTagsQuery } = await import('../generated/graphql');
      
      (usePopularPostsQuery as any).mockReturnValue({
        data: { getPopularPosts: mockPosts },
        loading: false,
      });

      (useRecentPostsQuery as any).mockReturnValue({
        data: { getRecentPosts: [] },
        loading: false,
      });

      (useTrendingTagsQuery as any).mockReturnValue({
        data: { getTrendingTags: [] },
        loading: false,
      });

      const { result } = renderHook(() => useBlogDashboard());

      expect(result.current.stats.totalViews).toBe(450);
      expect(result.current.stats.totalLikes).toBe(60);
      // 计算公式: (60 + 450) / 3 = 170
      expect(result.current.stats.avgEngagement).toBe(170);
    });

    it('should handle empty posts when calculating stats', async () => {
      const { usePopularPostsQuery, useRecentPostsQuery, useTrendingTagsQuery } = await import('../generated/graphql');
      
      (usePopularPostsQuery as any).mockReturnValue({
        data: { getPopularPosts: [] },
        loading: false,
      });

      (useRecentPostsQuery as any).mockReturnValue({
        data: { getRecentPosts: [] },
        loading: false,
      });

      (useTrendingTagsQuery as any).mockReturnValue({
        data: { getTrendingTags: [] },
        loading: false,
      });

      const { result } = renderHook(() => useBlogDashboard());

      expect(result.current.stats.totalViews).toBe(0);
      expect(result.current.stats.totalLikes).toBe(0);
      expect(result.current.stats.avgEngagement).toBe(0);
    });
  });
});
