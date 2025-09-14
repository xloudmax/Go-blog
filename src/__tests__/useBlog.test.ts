import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBlogList, useBlogSearch, useBlogDashboard } from '../hooks/useBlog';
import * as graphqlApi from '../api/graphql';

// Mock the GraphQL API calls
vi.mock('../api/graphql', () => ({
  usePosts: vi.fn(),
  useSearchPosts: vi.fn(),
  usePopularPosts: vi.fn(),
  useRecentPosts: vi.fn(),
  useTrendingTags: vi.fn(),
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
    it('should initialize with default filter and sort values', () => {
      // Mock the usePosts hook return value
      (graphqlApi.usePosts as any).mockReturnValue({
        posts: [],
        loading: false,
        error: null,
        loadMore: vi.fn(),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBlogList());

      expect(result.current.filter).toEqual({});
      expect(result.current.sort).toEqual({ field: 'createdAt', order: 'DESC' });
    });

    it('should update filter when filterByAuthor is called', () => {
      (graphqlApi.usePosts as any).mockReturnValue({
        posts: [],
        loading: false,
        error: null,
        loadMore: vi.fn(),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBlogList());

      act(() => {
        result.current.filterByAuthor('author123');
      });

      expect(result.current.filter).toEqual({ authorId: 'author123' });
    });

    it('should update filter when filterByStatus is called', () => {
      (graphqlApi.usePosts as any).mockReturnValue({
        posts: [],
        loading: false,
        error: null,
        loadMore: vi.fn(),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBlogList());

      act(() => {
        result.current.filterByStatus('PUBLISHED');
      });

      expect(result.current.filter).toEqual({ status: 'PUBLISHED' });
    });

    it('should clear filters when clearFilters is called', () => {
      (graphqlApi.usePosts as any).mockReturnValue({
        posts: [],
        loading: false,
        error: null,
        loadMore: vi.fn(),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBlogList());

      // Set some filters first
      act(() => {
        result.current.filterByAuthor('author123');
        result.current.filterByStatus('PUBLISHED');
      });

      expect(result.current.filter).toEqual({ authorId: 'author123', status: 'PUBLISHED' });

      // Clear filters
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filter).toEqual({});
    });

    it('should update sort when sortBy is called', () => {
      (graphqlApi.usePosts as any).mockReturnValue({
        posts: [],
        loading: false,
        error: null,
        loadMore: vi.fn(),
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
    it('should initialize with empty search query and history', () => {
      (graphqlApi.useSearchPosts as any).mockReturnValue({
        search: vi.fn(),
        results: [],
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useBlogSearch());

      expect(result.current.searchQuery).toBe('');
      expect(result.current.searchHistory).toEqual([]);
    });

    it('should perform search and update history', async () => {
      const mockSearch = vi.fn().mockResolvedValue(undefined);
      (graphqlApi.useSearchPosts as any).mockReturnValue({
        search: mockSearch,
        results: [],
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useBlogSearch());

      await act(async () => {
        await result.current.performSearch('test query');
      });

      expect(mockSearch).toHaveBeenCalledWith('test query');
      expect(result.current.searchQuery).toBe('test query');
      expect(result.current.searchHistory).toEqual(['test query']);
    });

    it('should load search history from localStorage', () => {
      const history = ['query1', 'query2'];
      localStorage.setItem('blog_search_history', JSON.stringify(history));

      (graphqlApi.useSearchPosts as any).mockReturnValue({
        search: vi.fn(),
        results: [],
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useBlogSearch());

      expect(result.current.searchHistory).toEqual(history);
    });

    it('should clear search history', () => {
      const history = ['query1', 'query2'];
      localStorage.setItem('blog_search_history', JSON.stringify(history));

      (graphqlApi.useSearchPosts as any).mockReturnValue({
        search: vi.fn(),
        results: [],
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
    it('should calculate stats correctly', () => {
      const mockPosts = [
        { stats: { viewCount: 100, likeCount: 10 } },
        { stats: { viewCount: 200, likeCount: 30 } },
        { stats: { viewCount: 150, likeCount: 20 } },
      ];

      (graphqlApi.usePopularPosts as any).mockReturnValue({
        posts: mockPosts,
        loading: false,
      });

      (graphqlApi.useRecentPosts as any).mockReturnValue({
        posts: [],
        loading: false,
      });

      (graphqlApi.useTrendingTags as any).mockReturnValue({
        tags: [],
        loading: false,
      });

      const { result } = renderHook(() => useBlogDashboard());

      expect(result.current.stats.totalViews).toBe(450);
      expect(result.current.stats.totalLikes).toBe(60);
      // 计算公式: (10/100 + 30/200 + 20/150) / 3 = (0.1 + 0.15 + 0.133) / 3 ≈ 0.128
      expect(result.current.stats.avgEngagement).toBeCloseTo(0.128, 3);
    });

    it('should handle empty posts when calculating stats', () => {
      (graphqlApi.usePopularPosts as any).mockReturnValue({
        posts: [],
        loading: false,
      });

      (graphqlApi.useRecentPosts as any).mockReturnValue({
        posts: [],
        loading: false,
      });

      (graphqlApi.useTrendingTags as any).mockReturnValue({
        tags: [],
        loading: false,
      });

      const { result } = renderHook(() => useBlogDashboard());

      expect(result.current.stats.totalViews).toBe(0);
      expect(result.current.stats.totalLikes).toBe(0);
      expect(result.current.stats.avgEngagement).toBe(0);
    });
  });
});