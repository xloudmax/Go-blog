import React, { useMemo } from 'react';
import {
  Button,
  Typography,
} from 'antd';

import { useBlogList, useBlogDashboard } from '@/hooks';
import type { PostFilter, BlogPost } from '@/types';
import { PostStatus } from '@/generated/graphql';
import ArticleListContainer from '@/components/ArticleListContainer';
import TagCloud from '@/components/TagCloud';
import SearchAndFilter from '@/components/SearchAndFilter';
import ArticleSkeleton from '@/components/ArticleSkeleton';
import HeroArticleCard from '@/components/HeroArticleCard';
import HeroSkeleton from '@/components/HeroSkeleton';

const { Text, Title } = Typography;

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

  // 格式化当前日期
  const today = new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' });
  const dateParts = today.split(' '); // "X月X日 星期X"

  return (
    <div className="min-h-screen"> 
      {/* Background is handled globally by AppLayout transparent content */}
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* APP STORE HEADER */}
        <div className="mb-8 animate-fade-in-up">
           <Text className="block text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-sm mb-1">
             {dateParts[1] || 'Today'}
           </Text>
           <div className="flex justify-between items-end">
             <Title level={1} className="!mb-0 !text-5xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
               {dateParts[0] || '今日阅读'}
             </Title>
             <div className="hidden sm:block">
                <Button shape="circle" size="large" icon={<span className="text-xl">👤</span>} className="!border-0 !shadow-none !bg-transparent" />
             </div>
           </div>
        </div>

        {/* HERO SECTION */}
        {isInitialLoading ? (
           <HeroSkeleton />
        ) : !error && posts.length > 0 && (
          <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
             <HeroArticleCard post={posts[0]} onNavigate={(slug) => handlePostAction('view', { slug } as BlogPost)} />
          </div>
        )}

        {/* TAGS RIBBON */}
        {trendingTags && trendingTags.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <TagCloud 
              tags={trendingTags} 
              onTagClick={handleTagClick} 
            />
          </div>
        )}

        {/* Search Bar (Floating Glass) */}
        <div className="mb-8 sticky top-4 z-40 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
           <SearchAndFilter
             onSearch={handleSearch}
             onFilter={handleFilter}
             activeFilters={filter as PostFilter}
             onClearFilters={clearFilters}
             allTags={allTags}
           />
        </div>

        {/* REMAINING POSTS GRID */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <ArticleSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 glassy-card rounded-2xl">
            <Text className="text-red-500">{error.message}</Text>
            <div className="mt-4">
              <Button onClick={() => refetch()}>重新加载</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <Title level={3} className="mb-6 font-bold">更多好文</Title>
                <ArticleListContainer 
                  posts={posts.slice(1)} // Skip the first one as it's the Hero
                  loading={false}
                  error={null}
                  onAction={handlePostAction}
                />
            </div>
            
            {/* 加载更多按钮 */}
            {posts.length > 1 && (
              <div className="mt-12 text-center pb-12">
                <Button 
                  onClick={() => loadMore()} 
                  loading={loading}
                  disabled={loading}
                  className="px-8 py-6 h-auto rounded-full text-lg font-medium hover:scale-105 transition-transform shadow-lg border-0"
                  style={{
                      background: 'var(--glass-bg)',
                      backdropFilter: 'blur(10px)',
                      color: 'var(--color-primary)'
                  }}
                >
                  {loading ? '加载中...' : '浏览更多往期内容'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
