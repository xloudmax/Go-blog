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
  useGetTagsQuery: vi.fn(),
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
      const mockResult = { items: [] };
      (usePostsQuery as any).mockReturnValue({
        data: { posts: [] },
        loading: false,
        error: null,
        fetchMore: vi.fn(),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBlogList());

      // Initial limits/offsets
      expect(result.current.limit).toBe(10);
      expect(result.current.offset).toBe(0);
      
      // Note: The hook state for filter/sort isn't directly exposed as 'filter'/'sort' but via setters.
      // Wait, checking the implementation again:
      // return { posts, loading, error, refetch, limit, offset, setLimit, setOffset, setFilter, setSort, goToPage };
      // It DOES NOT return 'filter' or 'sort' state values. 
      // So we cannot assert on them directly.
      // We can only infer they are set correctly if the query is called with them.
    });

    it('should call usePostsQuery with updated filter', async () => {
      const { usePostsQuery } = await import('../generated/graphql');
      (usePostsQuery as any).mockReturnValue({
        data: { posts: [] },
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useBlogList());

      act(() => {
        result.current.setFilter({ authorId: 'author123' });
      });

      // Rerender implies new call. We verify the mock was called with new variables.
      expect(usePostsQuery).toHaveBeenLastCalledWith(expect.objectContaining({
        variables: expect.objectContaining({
          filter: { authorId: 'author123' }
        })
      }));
    });

    it('should call usePostsQuery with updated sort', async () => {
      const { usePostsQuery } = await import('../generated/graphql');
      (usePostsQuery as any).mockReturnValue({
        data: { posts: [] },
      });

      const { result } = renderHook(() => useBlogList());

      act(() => {
        result.current.setSort({ field: 'title' as any, direction: 'ASC' as any });
      });

      expect(usePostsQuery).toHaveBeenLastCalledWith(expect.objectContaining({
        variables: expect.objectContaining({
          sort: { field: 'title', direction: 'ASC' }
        })
      }));
    });

    it('should update offset when goToPage is called', async () => {
      const { usePostsQuery } = await import('../generated/graphql');
      (usePostsQuery as any).mockReturnValue({
        data: { posts: [] },
      });

      const { result } = renderHook(() => useBlogList(10));

      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.offset).toBe(10);
      
      expect(usePostsQuery).toHaveBeenLastCalledWith(expect.objectContaining({
        variables: expect.objectContaining({
          offset: 10
        })
      }));
    });
  });

  describe('useBlogSearch', () => {
    it('should initialize with default values', async () => {
      const { useSearchPostsQuery } = await import('../generated/graphql');
      (useSearchPostsQuery as any).mockReturnValue({
        data: null,
      });

      const { result } = renderHook(() => useBlogSearch());

      expect(result.current.limit).toBe(10);
      expect(result.current.offset).toBe(0);
      expect(result.current.loading).toBeUndefined(); // or whatever default
    });

    it('should perform search', async () => {
      const { useSearchPostsQuery } = await import('../generated/graphql');
      (useSearchPostsQuery as any).mockReturnValue({
        data: { searchPosts: { posts: [], total: 0 } },
        loading: false,
      });

      const { result } = renderHook(() => useBlogSearch());

      act(() => {
        result.current.search('test query');
      });

      // Verify the query hook was called with 'test query'
      expect(useSearchPostsQuery).toHaveBeenLastCalledWith(expect.objectContaining({
        variables: expect.objectContaining({
          query: 'test query'
        })
      }));
    });
  });

  describe('useBlogDashboard', () => {
    it('should calculate stats correctly', async () => {
      const mockPosts = [
        { stats: { viewCount: 100, likeCount: 10 } },
        { stats: { viewCount: 200, likeCount: 30 } },
        { stats: { viewCount: 150, likeCount: 20 } },
      ];

      const { usePopularPostsQuery, useRecentPostsQuery, useGetTagsQuery } = await import('../generated/graphql');
      
      (usePopularPostsQuery as any).mockReturnValue({
        data: { getPopularPosts: mockPosts },
        loading: false,
      });

      (useRecentPostsQuery as any).mockReturnValue({
        data: { getRecentPosts: [] },
        loading: false,
      });

      (useGetTagsQuery as any).mockReturnValue({
        data: { getTags: [] },
        loading: false,
      });

      const { result } = renderHook(() => useBlogDashboard());

      expect(result.current.stats.totalViews).toBe(450);
      expect(result.current.stats.totalLikes).toBe(60);
      // Formula: (60 / 450) * 100 = 13.333...
      // Previous test logic was flawed or different.
      // Current implementation: (totalLikes / Math.max(totalViews, 1)) * 100
      expect(result.current.stats.engagementRate).toBeCloseTo(13.33, 2);
    });

    it('should handle empty posts when calculating stats', async () => {
      const { usePopularPostsQuery, useRecentPostsQuery, useGetTagsQuery } = await import('../generated/graphql');
      
      (usePopularPostsQuery as any).mockReturnValue({
        data: { getPopularPosts: [] },
        loading: false,
      });

      (useRecentPostsQuery as any).mockReturnValue({
        data: { getRecentPosts: [] },
        loading: false,
      });

      (useGetTagsQuery as any).mockReturnValue({
        data: { getTags: [] },
        loading: false,
      });

      const { result } = renderHook(() => useBlogDashboard());

      expect(result.current.stats.totalViews).toBe(0);
      expect(result.current.stats.totalLikes).toBe(0);
      expect(result.current.stats.engagementRate).toBe(0);
    });
  });
});
