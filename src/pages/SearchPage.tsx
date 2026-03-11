import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import {
  Select,
  Tag,
  Card,
  List,
  Spin,
  Alert,
  Typography,
  Space,
  Row,
  Col,
  Collapse,
  DatePicker,
  Slider,
  Drawer,
  Empty,
  Grid
} from 'antd';
// ... rest of imports
import { LiquidButton } from '@/components/LiquidButton';
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  LikeOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import {
  useTrendingSearchesHook,
  useEnhancedSearchHook
} from '@/hooks';
import type { SearchFilters, SearchSortBy } from '@/types';
import dayjs from 'dayjs';
import { ThemeContext } from '@/components/ThemeProvider';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

import { LiquidSearchBox } from '@/components/LiquidSearchBox';
import { PageHeader } from '@/components/PageHeader';
import { PageContainer } from '@/components/PageContainer';

const SearchPage: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const isDarkMode = theme === 'dark';
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [searchQuery, setSearchQuery] = useState('');
  // ... rest of state
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<SearchSortBy>('RELEVANCE');
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // ... (keeping existing logic)
  // 使用增强搜索功能
  const { results: enhancedResults, loading: enhancedLoading, search: performEnhancedSearch, error: enhancedError } = useEnhancedSearchHook();

  // 使用热门搜索词
  const { trendingSearches, loading: trendingLoading } = useTrendingSearchesHook(10);

  // 本地状态用于搜索历史
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('blog_search_history');
    return saved ? JSON.parse(saved) : [];
  });

  // 添加防抖计时器引用
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 处理搜索 - 只在用户点击搜索按钮时触发
  const handleSearch = useCallback(async (query: string) => {
    const currentQuery = query || searchQuery;
    if (!currentQuery.trim()) return;

    try {
      await performEnhancedSearch({
        query: currentQuery,
        limit,
        offset,
        filters,
        sortBy
      });

      // 添加到搜索历史
      setSearchHistory(prevHistory => {
        const newHistory = [currentQuery, ...prevHistory.filter(h => h !== currentQuery)].slice(0, 10);
        localStorage.setItem('blog_search_history', JSON.stringify(newHistory));
        return newHistory;
      });
      
      // 搜索后可以自动关闭抽屉
      setIsFilterDrawerOpen(false);
    } catch{ /* empty */ }
  }, [searchQuery, limit, offset, filters, sortBy, performEnhancedSearch]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  const handleFilterChange = (filterType: keyof SearchFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleDateRangeChange = (dates: unknown, dateStrings: [string, string]) => {
    if (dates) {
      handleFilterChange('dateFrom', dateStrings[0]);
      handleFilterChange('dateTo', dateStrings[1]);
    } else {
      handleFilterChange('dateFrom', undefined);
      handleFilterChange('dateTo', undefined);
    }
  };

  const resetFilters = () => {
    setFilters({});
    setSortBy('RELEVANCE');
  };

  const handleTrendingSearch = useCallback((query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  }, [handleSearch]);

  const handleHistorySearch = useCallback((query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  }, [handleSearch]);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('blog_search_history');
  }, []);

  useEffect(() => {
    const timeout = searchTimeoutRef.current;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  const renderFilterContent = () => (
    <div className="flex flex-col gap-6">
      <Collapse 
        defaultActiveKey={['1', '2', '3']} 
        ghost
        expandIconPosition="end"
        items={[{
          key: '1',
          label: <Text className="font-bold">排序方式</Text>,
          children: (
            <Select
              value={sortBy}
              onChange={setSortBy}
              className="w-full"
            >
              <Option value="RELEVANCE">相关性优先</Option>
              <Option value="CREATED_AT">最新创建</Option>
              <Option value="UPDATED_AT">最近更新</Option>
              <Option value="VIEW_COUNT">热度优先 (浏览)</Option>
              <Option value="LIKE_COUNT">热度优先 (点赞)</Option>
            </Select>
          )
        }, {
          key: '2',
          label: <Text className="font-bold">日期范围</Text>,
          children: (
            <RangePicker
              className="w-full"
              onChange={handleDateRangeChange}
              placeholder={['开始日期', '结束日期']}
            />
          )
        }, {
          key: '3',
          label: <Text className="font-bold">浏览量筛选</Text>,
          children: (
            <div className="px-2">
              <Slider
                min={0}
                max={1000}
                step={10}
                value={filters.minViews as number}
                onChange={(value) => handleFilterChange('minViews', value)}
                tooltip={{ formatter: (value) => `${value} 次浏览` }}
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0</span>
                <span>1000+</span>
              </div>
            </div>
          )
        }, {
          key: '4',
          label: <Text className="font-bold">点赞数筛选</Text>,
          children: (
            <div className="px-2">
              <Slider
                min={0}
                max={100}
                step={1}
                value={filters.minLikes as number}
                onChange={(value) => handleFilterChange('minLikes', value)}
                tooltip={{ formatter: (value) => `${value} 个点赞` }}
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0</span>
                <span>100+</span>
              </div>
            </div>
          )
        }]}
      />
      
      <LiquidButton 
        variant="danger"
        onClick={resetFilters}
        className="w-full !rounded-full !h-10 flex items-center justify-center gap-2"
      >
        <CloseOutlined /> 重置所有筛选
      </LiquidButton>
    </div>
  );

  return (
    <PageContainer className="pb-32">
        
        <PageHeader 
          title="全局搜索"
          icon={<SearchOutlined />}
          extra={
            <LiquidButton 
              variant="secondary"
              className="lg:hidden !rounded-full flex items-center gap-2 !h-10 px-5 shadow-sm border-gray-200 dark:border-white/10 dark:bg-white/5 backdrop-blur-md"
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <FilterOutlined /> 筛选选项
            </LiquidButton>
          }
        />
      
        {/* MAIN SEARCH BOX */}
        <div className="mb-8 lg:mb-12 sticky top-4 z-20">
          <LiquidSearchBox
            placeholder="输入关键词，开启液态化搜索体验..."
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={() => handleSearch(searchQuery)}
            blur={isMobile ? 0 : 10}
            height={isMobile ? 50 : 60}
            width={isMobile ? '100% ' : '100%'}
            scale={isMobile ? 15 : 20}
            bezelWidth={isMobile ? 10 : 15}
            className="w-full shadow-lg"
            inputClassName={isMobile ? "text-base font-medium" : "text-base md:text-xl font-semibold"}
          />
        </div>
      
        <Row gutter={[24, 24]}>
          {/* DESKTOP SIDEBAR */}
          <Col xs={0} lg={6}>
             <Card title={<Space><FilterOutlined className="text-blue-500" /> 高级筛选</Space>} className="glassy-card border-0 rounded-2xl shadow-sm mb-6">
                {renderFilterContent()}
             </Card>

             {/* HISTORY & TRENDING */}
             <div className="space-y-6">
               {searchHistory.length > 0 && (
                 <Card title="最近搜索" extra={<LiquidButton variant="ghost" className="!h-auto !p-0 text-[10px] text-gray-400 hover:text-red-400" onClick={clearSearchHistory}>清除</LiquidButton>} className="glassy-card border-0 rounded-2xl shadow-sm">
                   <div className="flex flex-wrap gap-2">
                     {searchHistory.map((history, index) => (
                       <Tag key={index} color="blue" onClick={() => handleHistorySearch(history)} className="cursor-pointer m-0 px-3 py-1 rounded-full border-blue-100 hover:border-blue-300 transition-colors">
                         {history}
                       </Tag>
                     ))}
                   </div>
                 </Card>
               )}

               {!trendingLoading && (
                 <Card title="热门趋势" className="glassy-card border-0 rounded-2xl shadow-sm">
                   <div className="flex flex-wrap gap-2">
                     {(trendingSearches || []).map((term, index) => (
                       <Tag key={index} color={index < 3 ? 'red' : 'orange'} onClick={() => handleTrendingSearch(term)} className="cursor-pointer m-0 px-3 py-1 rounded-full border-transparent hover:opacity-80 transition-opacity">
                         {term}
                       </Tag>
                     ))}
                   </div>
                 </Card>
               )}
             </div>
          </Col>
          
          {/* SEARCH RESULTS */}
          <Col xs={24} lg={18}>
            {enhancedError && (
              <Alert message="搜索服务暂不可用" description={enhancedError.message} type="error" showIcon className="mb-6 rounded-xl" />
            )}

            {enhancedLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Spin size="large" />
                <Text type="secondary" className="animate-pulse">正在深度挖掘相关内容...</Text>
              </div>
            ) : enhancedResults && enhancedResults.total > 0 ? (
              <div className="space-y-6">
                <div className="px-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <Text className="text-gray-400 text-xs">
                    共找到 <span className="text-gray-800 dark:text-gray-200 font-bold">{enhancedResults.total}</span> 篇匹配结果，耗时 {enhancedResults.took}
                  </Text>
                  
                  {enhancedResults.suggestions && enhancedResults.suggestions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Text type="secondary" className="text-xs">你是不是在找: </Text>
                      {enhancedResults.suggestions.map((suggestion, index) => (
                        <Tag key={index} color="orange" onClick={() => handleTrendingSearch(suggestion)} className="cursor-pointer rounded-full text-[10px]">
                          {suggestion}
                        </Tag>
                      ))}
                      <div className="flex justify-center mt-6">
                        <LiquidButton variant="primary" onClick={() => handleSearch(searchQuery)}>重新加载</LiquidButton>
                      </div>
                    </div>
                  )}
                </div>

                <List
                  dataSource={enhancedResults.posts}
                  grid={{ gutter: 24, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
                  renderItem={(post: Record<string, unknown>) => (
                    <List.Item className="!mb-6">
                      <Card className="glassy-card border-0 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row gap-6">
                          {post.coverImageUrl ? (
                            <div className="w-full md:w-48 lg:w-64 h-48 md:h-auto overflow-hidden rounded-xl">
                              <img
                                src={post.coverImageUrl as string}
                                alt={post.title as string}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          ) : null}
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <Link to={`/post/${post.slug}`}>
                                <Title level={3} className="!mb-3 !text-xl md:!text-2xl font-bold group-hover:text-blue-600 transition-colors">
                                  {post.title as string}
                                </Title>
                              </Link>

                              {post.excerpt ? (
                                <Text type="secondary" className="line-clamp-2 md:line-clamp-3 mb-4 text-sm md:text-base leading-relaxed">
                                  {post.excerpt as string}
                                </Text>
                              ) : null}

                              <div className="flex flex-wrap gap-2 mb-4">
                                {(post.tags as string[])?.map((tag: string, index: number) => (
                                  <Tag key={index} className="rounded-full bg-gray-100 dark:bg-white/5 border-0 px-3 py-0.5 text-xs text-gray-500">
                                    #{tag}
                                  </Tag>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-50 dark:border-white/5 pt-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs">
                                    {String(((post.author as Record<string, unknown>)?.username || 'U')).charAt(0).toUpperCase()}
                                  </div>
                                <div className="flex flex-col">
                                  <Text className="text-xs font-medium">{((post.author as Record<string, unknown>)?.username as string) || 'Unknown'}</Text>
                                  {!!post.publishedAt && <Text className="text-[10px] text-gray-400">{dayjs(post.publishedAt as string).format('MMM D, YYYY')}</Text>}
                                </div>
                              </div>

                              <Space size={16} className="text-gray-400">
                                <span className="flex items-center gap-1.5 text-xs">
                                  <EyeOutlined /> {String((post.stats as Record<string, unknown>)?.viewCount ?? 0)}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs">
                                  <LikeOutlined /> {String((post.stats as Record<string, unknown>)?.likeCount ?? 0)}
                                </span>
                              </Space>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                  pagination={{
                    current: Math.floor(offset / limit) + 1,
                    pageSize: limit,
                    total: enhancedResults.total,
                    className: "pt-8 !text-center",
                    onChange: (page) => {
                      const newOffset = (page - 1) * limit;
                      setOffset(newOffset);
                      if (searchQuery.trim()) {
                        performEnhancedSearch({ query: searchQuery, limit, offset: newOffset, filters, sortBy });
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    },
                  }}
                />
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="space-y-4">
                      <Text type="secondary" className="text-lg block">找不到匹配的文章</Text>
                      <LiquidButton variant="primary" className="!rounded-full px-8" onClick={resetFilters}>清除所有筛选再试</LiquidButton>
                    </div>
                  }
                />
              </div>
            )}
          </Col>
      </Row>
      
      {/* MOBILE FILTER DRAWER */}
      <Drawer
        title={<span className="font-bold text-lg dark:text-white">高级筛选</span>}
        placement="bottom"
        height="75vh"
        onClose={() => setIsFilterDrawerOpen(false)}
        open={isFilterDrawerOpen}
        className="rounded-t-[32px] overflow-hidden"
        styles={{ 
          mask: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.3)' },
          content: { 
            background: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          },
          body: { padding: '24px 20px' } 
        }}
      >
        {renderFilterContent()}
        
        <div className="mt-12 space-y-8">
           {searchHistory.length > 0 && (
              <div>
                <Title level={5} className="mb-4">最近搜索词</Title>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((history, index) => (
                    <Tag key={index} color="blue" onClick={() => handleHistorySearch(history)} className="cursor-pointer px-4 py-1.5 rounded-full">
                      {history}
                    </Tag>
                  ))}
                </div>
              </div>
           )}
           
           {!trendingLoading && (
              <div>
                <Title level={5} className="mb-4">热门趋势</Title>
                <div className="flex flex-wrap gap-2">
                  {(trendingSearches || []).map((term, index) => (
                    <Tag key={index} color={index < 3 ? 'red' : 'orange'} onClick={() => handleTrendingSearch(term)} className="cursor-pointer px-4 py-1.5 rounded-full">
                      {term}
                    </Tag>
                  ))}
                </div>
              </div>
           )}
        </div>
      </Drawer>
    </PageContainer>
  );
};

export default SearchPage;
