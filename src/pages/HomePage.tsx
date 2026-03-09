import { useMemo, useRef, useEffect } from 'react';
import { Typography } from 'antd';
import { LiquidButton } from '@/components/LiquidButton';
import { useNavigate } from 'react-router-dom';

import { useBlogList, useBlogDashboard } from '@/hooks';
import type { PostFilter, BlogPost } from '@/types';
import { PostStatus } from '@/generated/graphql';
import ArticleListContainer from '@/components/ArticleListContainer';

import SearchAndFilter from '@/components/SearchAndFilter';
import ArticleSkeleton from '@/components/ArticleSkeleton';
import HeroCarousel from '@/components/HeroCarousel';
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
    hasMore,
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
  const handlePostAction = (action: string, post: BlogPost) => {
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
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loading, loadMore, hasMore]);

  // Detect iOS for conditional UI
  const isIOS = useMemo(() =>
    typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)
  , []);

  return (
    <div className="min-h-screen">
      {/* Background is handled globally by AppLayout transparent content */}

      <div className="w-full max-w-[2400px] mx-auto pt-2 pb-8 px-4 md:px-6">

        {/* APP STORE HEADER - Unified & Responsive */}
        <div className="mb-6 animate-fade-in-up">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 border-b border-gray-100 dark:border-white/5 pb-4 md:pb-2">
             <div className="flex flex-col">
               <Text className="block text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-xs mb-1 whitespace-nowrap">
                 {dateParts[1] || 'Today'}
               </Text>
               <Title level={1} className="!mt-0 !mb-0 !text-2xl sm:!text-3xl md:!text-5xl font-extrabold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                 {dateParts[0] || '今日阅读'}
               </Title>
             </div>

             <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-6 w-full md:w-auto">
                <SearchAndFilter
                  onSearch={handleSearch}
                  onFilter={handleFilter}
                  activeFilters={filter as PostFilter}
                  onClearFilters={clearFilters}
                  allTags={allTags}
                  className="w-full md:w-80 lg:w-96"
                />
                <ActiveFilters
                    activeFilters={filter as PostFilter}
                    onFilterChange={handleFilter}
                    onClearFilters={clearFilters}
                    className="!mt-0 !mb-0 justify-start md:justify-end pb-1 overflow-x-auto no-scrollbar"
                />
             </div>
           </div>
        </div>

        {/* HERO SECTION - Hidden on iOS as requested */}
        {!isIOS && (
          <>
            {isInitialLoading ? (
               <HeroSkeleton />
            ) : !error && posts.length > 0 && (
              <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                 <HeroCarousel
                    posts={posts.slice(0, 3)}
                    onNavigate={(slug) => handlePostAction('view', { slug } as BlogPost)}
                 />
              </div>
            )}
          </>
        )}

        {/* REMAINING POSTS GRID */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <ArticleSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 glassy-card rounded-2xl animate-fade-in-up">
            <Text className="text-red-500 block mb-4">{error.message}</Text>
          <div className="flex justify-center mt-6">
            <LiquidButton variant="primary" onClick={() => refetch()}>重新加载</LiquidButton>
          </div>
          </div>
        ) : (
          <>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                {/* Spacer between Hero and Grid */}
                {!isIOS && <div className="w-full h-4" />}

                {(isIOS ? posts : posts.slice(3)).length > 0 ? (
                  <ArticleListContainer
                    posts={isIOS ? posts : posts.slice(3)}
                    loading={false}
                    error={undefined}
                    onAction={handlePostAction}
                  />
                ) : posts.length === 0 ? (
                  <ArticleListContainer 
                    posts={[]} 
                    loading={false}
                    error={undefined}
                  />
                ) : null}
            </div>
            
            {/* Infinite Scroll Sentinel */}
            {!isInitialLoading && !error && (
              <div ref={observerTarget} className="mt-8 py-8 flex justify-center w-full min-h-[50px]">
                {!loading && !hasMore && posts.length > 0 && (
                   <div className="text-gray-400 italic">No more posts</div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
