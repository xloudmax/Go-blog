import React, { useMemo } from 'react';
import {
  Button,
  Typography
} from 'antd';

import { useBlogList, useBlogDashboard } from '@/hooks';
import type { PostFilter, BlogPost } from '@/types';
import { PostStatus } from '@/generated/graphql';
import ArticleListContainer from '@/components/ArticleListContainer';
import TagCloud from '@/components/TagCloud';
import SearchAndFilter from '@/components/SearchAndFilter';
import ArticleSkeleton from '@/components/ArticleSkeleton';

const { Text } = Typography;

export default function HomePage() {

  // 博客列表管理 - 使用服务端过滤和分页
  const {
    posts,
    loading,
    error,
    refetch,
    loadMore,
    filter,
    filterBySearch,
    filterByTags,
    filterByStatus,
    clearFilters
  } = useBlogList();

  // 获取热门标签（带计数）
  const { tags: trendingTags } = useBlogDashboard();

  // 适配 SearchAndFilter 的 allTags (只传名称)
  const allTags = useMemo(() => trendingTags.map(t => t.name), [trendingTags]);

  // 处理搜索
  const handleSearch = (query: string) => {
    filterBySearch(query);
  };

  // 处理筛选
  const handleFilter = (newFilters: PostFilter) => {
    if (newFilters.tags !== undefined) {
      filterByTags(newFilters.tags);
    }
    if (newFilters.status) {
      filterByStatus(newFilters.status as unknown as PostStatus);
    }
    // TODO: 支持其他筛选条件
  };

  // 处理标签点击
  const handleTagClick = (tag: string) => {
    filterByTags([tag]);
  };

  // 处理文章操作
  const handlePostAction = (_action: 'view' | 'edit' | 'share', _post: BlogPost) => {
    // 这里可以添加全局的操作处理逻辑
  };

  // 是否正在进行初始加载（没有数据且正在加载）
  const isInitialLoading = loading && posts.length === 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* 标签云 - 使用全局热门标签 */}
        {trendingTags && trendingTags.length > 0 && (
          <TagCloud 
            tags={trendingTags} 
            onTagClick={handleTagClick} 
          />
        )}

        {/* 搜索和筛选 */}
        <SearchAndFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          activeFilters={filter as PostFilter}
          onClearFilters={clearFilters}
          allTags={allTags}
        />

        {/* 内容区域 */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <ArticleSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Text className="text-red-500">{error.message}</Text>
            <div className="mt-4">
              <Button onClick={() => refetch()}>重新加载</Button>
            </div>
          </div>
        ) : (
          <>
            <ArticleListContainer 
              posts={posts}
              loading={false} // Container 内部只负责显示列表，loading 状态由外部控制
              error={null}
              onAction={handlePostAction}
            />
            
            {/* 加载更多按钮 */}
            {posts.length > 0 && (
              <div className="mt-8 text-center">
                <Button 
                  onClick={() => loadMore()} 
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? '加载中...' : '加载更多'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}