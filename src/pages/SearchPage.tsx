import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import {
  Input,
  Select,
  Tag,
  Card,
  List,
  Spin,
  Alert,
  Typography,
  Space,
  Button,
  Row,
  Col,
  Collapse,
  DatePicker,
  Slider
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  LikeOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import {
  useTrendingSearchesHook,
  useEnhancedSearchHook
} from '@/hooks';
import type { SearchFilters, SearchSortBy } from '@/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SearchPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<SearchSortBy>('RELEVANCE');
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

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
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      await performEnhancedSearch({
        query: searchQuery,
        limit,
        offset,
        filters,
        sortBy
      });

      // 添加到搜索历史
      setSearchHistory(prevHistory => {
        const newHistory = [searchQuery, ...prevHistory.filter(h => h !== searchQuery)].slice(0, 10);
        localStorage.setItem('blog_search_history', JSON.stringify(newHistory));
        return newHistory;
      });
    } catch{ /* empty */ }
  }, [searchQuery, limit, offset, filters, sortBy, performEnhancedSearch]);

  // 处理搜索输入变化 - 只更新状态，不自动搜索
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // 清除之前的计时器（如果有的话）
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // 处理过滤器变化
  const handleFilterChange = (filterType: keyof SearchFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates: unknown, dateStrings: [string, string]) => {
    if (dates) {
      handleFilterChange('dateFrom', dateStrings[0]);
      handleFilterChange('dateTo', dateStrings[1]);
    } else {
      handleFilterChange('dateFrom', undefined);
      handleFilterChange('dateTo', undefined);
    }
  };

  // 重置过滤器
  const resetFilters = () => {
    setFilters({});
    setSortBy('RELEVANCE');
  };

  // 处理热门搜索词点击
  const handleTrendingSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // 不自动搜索，等用户点击搜索按钮
  }, []);

  // 处理搜索历史点击
  const handleHistorySearch = useCallback((query: string) => {
    setSearchQuery(query);
    // 不自动搜索，等用户点击搜索按钮
  }, []);

  // 清除搜索历史
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('blog_search_history');
  }, []);

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        padding: '0 12px', 
        boxSizing: 'border-box',
        backgroundColor: isDarkMode ? '#111827' : '#f9fafb'
      }}
    >
      <div className="w-full max-w-[2400px] mx-auto py-8">
        {/* 标准页面标题 */}
        <div className="mb-6">
          <Title level={2} className="mb-4">
            <SearchOutlined /> 搜索博客
          </Title>
        </div>
      
      {/* 搜索框 */}
      <div className="mb-6">
        <div className="flex gap-2 w-full">
          <Input
            size="large"
            placeholder="输入关键词搜索博客文章..."
            value={searchQuery}
            onChange={handleSearchChange}
            onPressEnter={handleSearch}
            suffix={<SearchOutlined />}
            className="flex-1"
          />

        </div>
      </div>
      
      <Row gutter={24}>
        {/* 左侧过滤器 */}
        <Col xs={24} lg={6}>
          <Card title={<><FilterOutlined /> 过滤器</>} className="mb-6 mx-8">
            <Collapse 
              defaultActiveKey={['1', '2', '3']} 
              ghost
              items={[{
                key: '1',
                label: '排序',
                children: (
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    className="w-full"
                  >
                    <Option value="RELEVANCE">相关性</Option>
                    <Option value="CREATED_AT">创建时间</Option>
                    <Option value="UPDATED_AT">更新时间</Option>
                    <Option value="VIEW_COUNT">浏览量</Option>
                    <Option value="LIKE_COUNT">点赞数</Option>
                  </Select>
                )
              }, {
                key: '2',
                label: '日期范围',
                children: (
                  <RangePicker
                    className="w-full"
                    onChange={handleDateRangeChange}
                    placeholder={['开始日期', '结束日期']}
                  />
                )
              }, {
                key: '3',
                label: '最小浏览量',
                children: (
                  <Slider
                    min={0}
                    max={1000}
                    step={10}
                    onChange={(value) => handleFilterChange('minViews', value)}
                    tooltip={{ formatter: (value) => `${value} 次浏览` }}
                  />
                )
              }, {
                key: '4',
                label: '最小点赞数',
                children: (
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    onChange={(value) => handleFilterChange('minLikes', value)}
                    tooltip={{ formatter: (value) => `${value} 个点赞` }}
                  />
                )
              }]}
            />
            
            <Button 
              type="primary" 
              danger 
              onClick={resetFilters}
              className="w-full mt-4"
            >
              重置过滤器
            </Button>
          </Card>
          
          {/* 搜索历史 */}
          {searchHistory.length > 0 && (
            <Card title="搜索历史" className="mb-6 mx-8">
              <Space wrap>
                {searchHistory.map((history, index) => (
                  <Tag
                    key={index}
                    color="blue"
                    onClick={() => handleHistorySearch(history)}
                    className="cursor-pointer"
                  >
                    {history}
                  </Tag>
                ))}
              </Space>
              <Button
                type="link"
                size="small"
                onClick={clearSearchHistory}
                className="mt-2"
              >
                清除历史
              </Button>
            </Card>
          )}
          
          {/* 热门搜索 */}
          {!trendingLoading && trendingSearches && trendingSearches.length > 0 && (
            <Card title="热门搜索" className="mx-8">
              <Space wrap>
                {trendingSearches.map((term, index) => (
                  <Tag
                    key={index}
                    color={index < 3 ? 'red' : 'orange'}
                    onClick={() => handleTrendingSearch(term)}
                    className="cursor-pointer"
                  >
                    {term}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}
        </Col>
        
        {/* 右侧搜索结果 */}
        <Col xs={24} lg={18}>
          {enhancedError && (
            <Alert
              message="搜索出错"
              description={enhancedError.message}
              type="error"
              showIcon
              className="mb-6"
            />
          )}

          {enhancedLoading ? (
            <div className="text-center py-12">
              <Spin size="large" />
              <Text className="block mt-2">正在搜索...</Text>
            </div>
          ) : enhancedResults ? (
            <>
              <div className="mb-4 flex justify-between items-center">
                <Text>
                  找到 {enhancedResults.total} 篇文章，耗时 {enhancedResults.took}
                </Text>
                {enhancedResults.suggestions && enhancedResults.suggestions.length > 0 && (
                  <div>
                    <Text type="secondary">建议: </Text>
                    {enhancedResults.suggestions.map((suggestion, index) => (
                      <Tag
                        key={index}
                        color="orange"
                        onClick={() => handleTrendingSearch(suggestion)}
                        className="cursor-pointer ml-1"
                      >
                        {suggestion}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>

              {/* 搜索结果列表 */}
              <List
                dataSource={enhancedResults.posts}
                renderItem={(post: Record<string, unknown>) => (
                  <List.Item>
                    <Card className="w-full mx-8">
                      <div className="flex">
                        {post.coverImageUrl ? (
                          <img
                            src={post.coverImageUrl as string}
                            alt={post.title as string}
                            className="w-32 h-24 object-cover rounded mr-4"
                          />
                        ) : null}
                        <div className="flex-1">
                          <Link to={`/post/${post.slug}`}>
                            <Title level={4} className="mb-2 hover:text-blue-600">
                              {post.title as string}
                            </Title>
                          </Link>

                          {post.excerpt ? (
                            <Text type="secondary" className="block mb-2">
                              {post.excerpt as string}
                            </Text>
                          ) : null}

                          <div className="flex flex-wrap gap-2 mb-2">
                            {(post.tags as string[])?.map((tag: string, index: number) => (
                              <Tag key={index} color="blue">
                                {tag}
                              </Tag>
                            ))}
                          </div>

                          <div className="flex justify-between items-center">
                            <Space>
                              <Text type="secondary">
                                作者: {(post.author as Record<string, unknown>)?.username as string}
                              </Text>
                              {post.publishedAt ? (
                                <Text type="secondary">
                                  发布于: {dayjs(post.publishedAt as string).format('YYYY-MM-DD')}
                                </Text>
                              ) : null}
                            </Space>

                            <Space>
                              <Text type="secondary">
                                <EyeOutlined /> {String((post.stats as Record<string, unknown>)?.viewCount ?? 0)}
                              </Text>
                              <Text type="secondary">
                                <LikeOutlined /> {String((post.stats as Record<string, unknown>)?.likeCount ?? 0)}
                              </Text>
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
                  onChange: (page) => {
                    const newOffset = (page - 1) * limit;
                    setOffset(newOffset);
                    if (searchQuery.trim()) {
                      performEnhancedSearch({
                        query: searchQuery,
                        limit,
                        offset: newOffset,
                        filters,
                        sortBy
                      });
                    }
                  },
                }}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <Text type="secondary">请输入关键词开始搜索</Text>
            </div>
          )}
        </Col>
      </Row>
      </div>
    </div>
  );
};

export default SearchPage;
