import { useMemo, useRef, useEffect } from 'react';
import {
  Button,
  Typography,
} from 'antd';
import { useNavigate } from 'react-router-dom';

import { useBlogList, useBlogDashboard } from '@/hooks';
import type { PostFilter, BlogPost } from '@/types';
import { PostStatus } from '@/generated/graphql';
import ArticleListContainer from '@/components/ArticleListContainer';

import SearchAndFilter from '@/components/SearchAndFilter';
import ArticleSkeleton from '@/components/ArticleSkeleton';
import HeroArticleCard from '@/components/HeroArticleCard';
import HeroSkeleton from '@/components/HeroSkeleton';
import ActiveFilters from '@/components/ActiveFilters';

const { Text, Title } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  const observerTarget = useRef<HTMLDivElement>(null);

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



  // 处理文章操作
  const handlePostAction = (action: 'view' | 'edit' | 'share', post: BlogPost) => {
    if (action === 'view') {
      navigate(`/post/${post.slug}`);
    }
    // TODO: implement edit/share
  };

  // 是否正在进行初始加载（没有数据且正在加载）
  const isInitialLoading = loading && posts.length === 0;

  // 格式化当前日期
  const today = new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' });
  const dateParts = today.split(' '); // "X月X日 星期X"

  // 无限滚动监听
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loading, loadMore]);

  return (
    <div className="min-h-screen"> 
      {/* Background is handled globally by AppLayout transparent content */}
      
      <div className="w-full max-w-[2400px] mx-auto py-8 px-2 md:px-6">
        
        {/* APP STORE HEADER */}
        <div className="!mb-5 animate-fade-in-up">
           <div className="flex justify-between items-start mb-0">
           <Text className="block text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-sm mb-0">
             {dateParts[1] || 'Today'}
           </Text>
           <div className="flex items-center gap-4">
              <SearchAndFilter
                onSearch={handleSearch}
                onFilter={handleFilter}
                activeFilters={filter as PostFilter}
                onClearFilters={clearFilters}
                allTags={allTags}
                className="w-96"
              />
              <ActiveFilters 
                  activeFilters={filter as PostFilter}
                  onFilterChange={handleFilter}
                  onClearFilters={clearFilters}
                  className="!mt-0 !mb-0 !justify-end"
              />
           </div>
           </div>
             <div className="flex justify-between items-end">
               <Title level={1} className="!mb-0 !text-5xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                 {dateParts[0] || '今日阅读'}
               </Title>
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
                {/* Spacer between Hero and Grid */}
                <div className="w-full h-4" />

                {posts.length > 1 ? (
                  <ArticleListContainer 
                    posts={posts.slice(1)} 
                    loading={false}
                    error={null}
                    onAction={handlePostAction}
                  />
                ) : (
                  <div className="py-10 text-center text-gray-400 italic">
                    {/* Only show this if we have posts (handled by !error && posts.length > 0 check above) but only 1 post */}
                     Stay tuned for more!
                  </div>
                )}
            </div>
            
            {/* Infinite Scroll Sentinel */}
            {!isInitialLoading && !error && (
              <div ref={observerTarget} className="mt-8 py-8 flex justify-center w-full">
                {loading && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <span className="text-gray-400 text-sm">加载更多内容...</span>
                    </div>
                )}
                {!loading && (
                   <div className="h-4 w-full" /> /* Invisible trigger zone */
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
