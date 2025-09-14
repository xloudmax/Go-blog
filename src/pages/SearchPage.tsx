import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Input, 
  Select, 
  Tag, 
  Card, 
  List, 
  Spin, 
  Alert, 
  Typography, 
  Divider,
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
  useBlogSearch, 
  useTrendingSearchesHook,
  useEnhancedSearchHook
} from '@/hooks';
import type { SearchFilters, SearchSortBy } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<SearchSortBy>('RELEVANCE');
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  
  // 使用修复后的搜索功能（基于searchPosts查询）
  const { results: enhancedResults, loading: enhancedLoading, search: performEnhancedSearch } = useEnhancedSearchHook();
  
  // 本地状态用于搜索历史
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('blog_search_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  // 搜索功能
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    performEnhancedSearch({
      query,
      limit,
      offset
    });
    
    // 添加到搜索历史
    setSearchHistory(prevHistory => {
      const newHistory = [query, ...prevHistory.filter(h => h !== query)].slice(0, 10);
      localStorage.setItem('blog_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, [performEnhancedSearch, limit, offset]);
  
  // 清除搜索历史
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('blog_search_history');
  }, []);
  
  // 当前搜索结果
  const results = enhancedResults?.posts || [];
  const loading = enhancedLoading;
  const error = null; // 简化错误处理
  
  // 暂时禁用热门搜索功能，因为后端不支持getTrendingSearches
  const trendingSearches: string[] = []; // 临时空数组

  // 添加防抖计时器引用
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 处理搜索 - 使用简化参数
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    // 使用简化的搜索功能
    await performEnhancedSearch({
      query: searchQuery,
      limit,
      offset
    });
  }, [searchQuery, limit, offset, performEnhancedSearch]);

  // 处理搜索建议变化 - 使用简化的搜索参数
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // 清除之前的计时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // 500ms 后执行实际搜索（防抖） - 使用简化参数
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performEnhancedSearch({
          query: value,
          limit,
          offset: 0
        });
      }, 500);
    }
  }, [performEnhancedSearch, limit]);


  // 处理过滤器变化
  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      handleFilterChange('dateFrom', dateStrings[0]);
      handleFilterChange('dateTo', dateStrings[1]);
    } else {
      handleFilterChange('dateFrom', undefined);
      handleFilterChange('dateTo', undefined);
    }
  };

  // 加载更多
  const loadMore = () => {
    setOffset(prev => prev + limit);
  };

  // 重置过滤器
  const resetFilters = () => {
    setFilters({});
    setSortBy('RELEVANCE');
  };

  // 处理热门搜索词点击 - 使用简化参数
  const handleTrendingSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    // 立即执行搜索
    performEnhancedSearch({
      query,
      limit,
      offset: 0
    });
  }, [performEnhancedSearch, limit]);

  // 当过滤器或排序方式变化时自动搜索 - 删除自动搜索避免无限循环
  // 用户需要手动执行搜索

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900" style={{ padding: '0 40px', boxSizing: 'border-box' }}>
      <div className="max-w-7xl mx-auto py-12">
        {/* 标准页面标题 */}
        <div className="mb-6">
          <Title level={2} className="mb-4">
            <SearchOutlined /> 搜索博客
          </Title>
          <Paragraph type="secondary" className="mb-0">
            快速找到感兴趣的内容和话题
          </Paragraph>
        </div>
      
      {/* 搜索框 */}
      <div className="mb-6">
        <Input
          size="large"
          placeholder="输入关键词搜索博客文章..."
          value={searchQuery}
          onChange={handleSearchChange}
          onPressEnter={handleSearch}
          suffix={<SearchOutlined />}
          className="w-full max-w-2xl"
        />
        
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
                    onClick={() => {
                      setSearchQuery(history);
                    }}
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
          {trendingSearches.length > 0 && (
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
          {error && (
            <Alert 
              message="搜索出错" 
              description={error.message} 
              type="error" 
              showIcon 
              className="mb-6"
            />
          )}
          
          {(loading || enhancedLoading) ? (
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
              </div>
              
              {/* 搜索结果列表 */}
              <List
                dataSource={enhancedResults.posts}
                renderItem={(post: any) => (
                  <List.Item>
                    <Card className="w-full mx-8">
                      <div className="flex">
                        {post.coverImageUrl && (
                          <img 
                            src={post.coverImageUrl} 
                            alt={post.title}
                            className="w-32 h-24 object-cover rounded mr-4"
                          />
                        )}
                        <div className="flex-1">
                          <Link to={`/post/${post.slug}`}>
                            <Title level={4} className="mb-2 hover:text-blue-600">
                              {post.title}
                            </Title>
                          </Link>
                          
                          {post.excerpt && (
                            <Text type="secondary" className="block mb-2">
                              {post.excerpt}
                            </Text>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {post.tags.map((tag: string, index: number) => (
                              <Tag key={index} color="blue">
                                {tag}
                              </Tag>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Space>
                              <Text type="secondary">
                                作者: {post.author.username}
                              </Text>
                              {post.publishedAt && (
                                <Text type="secondary">
                                  发布于: {dayjs(post.publishedAt).format('YYYY-MM-DD')}
                                </Text>
                              )}
                            </Space>
                            
                            <Space>
                              <Text type="secondary">
                                <EyeOutlined /> {post.stats.viewCount}
                              </Text>
                              <Text type="secondary">
                                <LikeOutlined /> {post.stats.likeCount}
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
                    setOffset((page - 1) * limit);
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
