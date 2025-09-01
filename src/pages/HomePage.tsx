import React, { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Button,
  Input,
  Spin,
  Alert,
  Avatar,
  Tag,
  Row,
  Col,
  List,
  Typography,
  Space,
  Skeleton,
  Dropdown,
  MenuProps,
  Statistic,
  AutoComplete} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EditOutlined,
  EyeOutlined,
  LikeOutlined,
  FireOutlined,
  FileTextOutlined,
  TagsOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  MoreOutlined,
  ShareAltOutlined,
  RiseOutlined,
  HistoryOutlined} from '@ant-design/icons';
import { useBlogList, useBlogDashboard, useBlogSearch } from '@/hooks';
import { useSearchSuggestionsHook, useTrendingSearchesHook } from '@/hooks';
import { useAppUser } from '@/hooks';
import MarkdownViewer from '../components/MarkdownViewer';

// 定义文章类型
interface BlogPost {
  __typename?: 'BlogPost';
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  coverImageUrl?: string;
  tags?: string[];
  stats?: {
    viewCount?: number;
    likeCount?: number;
  };
  author: {
    __typename?: 'User';
    id?: string;
    username: string;
    avatar?: string;
    createdAt?: string;
    email?: string;
    isVerified?: boolean;
    lastLoginAt?: string;
    role?: string;
    updatedAt?: string;
  };
  publishedAt?: string;
  createdAt: string;
  content?: string;
  accessLevel?: string;
  categories?: string[];
  lastEditedAt?: string;
  status?: string;
  updatedAt?: string;
  versions?: any[];
}

const { Title, Text } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAppUser();
  const searchInputRef = useRef<any>(null);

  // 获取搜索参数
  const initialSearchQuery = searchParams.get('search') || '';

  // 博客列表管理
  const {
    posts,
    loading,
    error,
    filterByTags,
    clearFilters  } = useBlogList();

  // 仪表盘数据
  const {
    popularPosts,
    recentPosts,
    trendingTags,
    loading: dashboardLoading
  } = useBlogDashboard();

  // 搜索功能
  const {
    searchQuery,
    results: searchResults,
    loading: searchLoading,
    performSearch,
    setSearchQuery,
    searchHistory
  } = useBlogSearch();

  // 搜索建议功能
  const {
    suggestions,
    fetchSuggestions
  } = useSearchSuggestionsHook();

  // 热门搜索词功能
  const {
    trendingSearches
  } = useTrendingSearchesHook(10);

  // 初始化搜索查询
  React.useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      performSearch(initialSearchQuery);
    }
  }, [initialSearchQuery, setSearchQuery, performSearch]);

  // 页面状态
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [, setDateRange] = useState<[string, string] | null>(null);
  const [, setSelectedAuthor] = useState<string | null>(null);
  const [, setAccessLevel] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 处理搜索输入变化
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (value.trim()) {
      setShowSuggestions(true);
      fetchSuggestions(value, 10);
    } else {
      setShowSuggestions(false);
    }
  };

  // 处理搜索建议选择
  const handleSuggestionSelect = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);
    performSearch(value);

    // 更新URL参数
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('search', value);
    window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
  };

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
      setShowSuggestions(false);

      // 更新URL参数
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('search', searchQuery);
      window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
    }
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery('');
    clearFilters();
    setDateRange(null);
    setSelectedAuthor(null);
    setAccessLevel(null);
    setShowSuggestions(false);

    // 清除URL参数
    window.history.replaceState(null, '', '/');
  };

  // 应用筛选条件

  // 当前显示的文章列表
  const currentPosts = searchQuery ? (searchResults?.posts || []) : (posts || []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 文章操作菜单
  const getPostMenuItems = (post: BlogPost): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: '查看文章',
      onClick: () => navigate(`/post/${post.slug}`)
    },
    {
      key: 'share',
      icon: <ShareAltOutlined />,
      label: '分享文章',
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`);
        // 这里应该使用 message.success，但为了避免引入额外的依赖，我们用 alert
        alert('链接已复制到剪贴板');
      }
    },
    ...(isAuthenticated && post.author.username === user?.username ? [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑文章',
        onClick: () => navigate(`/editor/posts/${post.slug}`)
      }
    ] : [])
  ];

  // 如果正在查看单篇文章
  if (selectedPost) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 optimized-navbar p-4 backdrop-blur-sm shadow-sm home-page-header">
          <div className="flex items-center">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => setSelectedPost(null)}
              className="optimized-button"
            >
              返回列表
            </Button>
            <Title level={4} className="ml-4 mb-0">
              {selectedPost.title}
            </Title>
            <div className="ml-auto">
              <Text type="secondary">
                {formatDate(selectedPost.publishedAt || selectedPost.createdAt)}
              </Text>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <MarkdownViewer content={selectedPost?.content || ''} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶部导航区 */}
      <header className="sticky top-0 z-10 optimized-navbar p-4 backdrop-blur-sm shadow-sm home-page-header">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Title level={3} className="mb-0 text-display-2">博客首页</Title>

          {/* 操作按钮 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 桌面端搜索框 */}
            <div className="hidden sm:block w-64">
              <AutoComplete
                ref={searchInputRef}
                value={searchQuery}
                options={(suggestions || []).map((suggestion: string) => ({
                  value: suggestion,
                  label: (
                    <div className="flex items-center">
                      <SearchOutlined className="mr-2 text-gray-400" />
                      <span>{suggestion}</span>
                    </div>
                  )
                }))}
                onSelect={handleSuggestionSelect}
                onSearch={handleSearchChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                placeholder="搜索文章..."
                className="w-full optimized-input"
              >
                <Input
                  suffix={<SearchOutlined />}
                  onPressEnter={handleSearch}
                />
              </AutoComplete>

              {/* 搜索建议下拉 */}
              {showSuggestions && suggestions.length > 0 && (
                <Card
                  className="absolute z-10 mt-1 w-full optimized-card shadow-lg"
                  size="small"
                  style={{ top: '100%', left: 0 }}
                >
                  <div className="py-1">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500">搜索建议</div>
                    {suggestions.slice(0, 8).map((suggestion: string, index: number) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <SearchOutlined className="mr-2 text-gray-400" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* 移动端搜索框 */}
            <div className="sm:hidden w-full mt-2">
              <form onSubmit={handleSearch} className="w-full">
                <Input
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  suffix={
                    <Button
                      type="text"
                      icon={<SearchOutlined />}
                      onClick={handleSearch}
                      className="p-0"
                    />
                  }
                  className="optimized-input"
                />
              </form>
            </div>

            {/* 视图切换 */}
            <Space.Compact>
              <Button
                icon={<AppstoreOutlined />}
                type={viewMode === 'grid' ? 'primary' : 'default'}
                onClick={() => setViewMode('grid')}
                className="optimized-button"
              />
              <Button
                icon={<UnorderedListOutlined />}
                type={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
                className="optimized-button"
              />
            </Space.Compact>

            {isAuthenticated && (
              <Link to="/editor">
                <Button type="primary" icon={<EditOutlined />} className="optimized-button">写文章</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">
          {/* 搜索结果标题 */}
          {searchQuery && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Title level={4} className="mb-0">
                  搜索 "{searchQuery}" 的结果 {searchResults?.total && `(${searchResults.total}条)`}
                </Title>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={handleClearSearch}
                  className="optimized-button"
                >
                  清除搜索
                </Button>
              </div>

              {/* 搜索历史 */}
              {searchHistory.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <HistoryOutlined className="text-gray-500" />
                    <span className="text-sm text-gray-500">搜索历史:</span>
                    {searchHistory.slice(0, 5).map((historyItem, index) => (
                      <Button
                        key={index}
                        type="link"
                        size="small"
                        onClick={() => {
                          setSearchQuery(historyItem);
                          performSearch(historyItem);
                        }}
                      >
                        {historyItem}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 热门搜索词 */}
          {!searchQuery && trendingSearches.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FireOutlined className="text-red-500" />
                <span className="font-medium">热门搜索</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.slice(0, 10).map((searchTerm: string, index: number) => (
                  <Button
                    key={index}
                    type="default"
                    size="small"
                    onClick={() => {
                      setSearchQuery(searchTerm);
                      performSearch(searchTerm);
                    }}
                    className="rounded-full"
                  >
                    {searchTerm}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 仪表盘区域 - 使用卡片布局 */}
          {!searchQuery && (
            <div className="mb-8">
              <Title level={4} className="mb-4 flex items-center text-display-2">
                <FireOutlined className="mr-2" />
                仪表盘
              </Title>
              <Row gutter={[16, 16]}>
                {/* 统计卡片 */}
                <Col xs={24} md={12} lg={6}>
                  <Card className="optimized-card dashboard-statistic-card">
                    <Statistic
                      title="总文章数"
                      value={posts?.length || 0}
                      prefix={<FileTextOutlined />}
                      valueStyle={{ color: '#4f46e5' }}
                    />
                  </Card>
                </Col>

                <Col xs={24} md={12} lg={6}>
                  <Card className="optimized-card dashboard-statistic-card">
                    <Statistic
                      title="热门文章"
                      value={popularPosts?.length || 0}
                      prefix={<FireOutlined />}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>

                <Col xs={24} md={12} lg={6}>
                  <Card className="optimized-card dashboard-statistic-card">
                    <Statistic
                      title="今日发布"
                      value={recentPosts?.filter((post: any) => {
                        const today = new Date();
                        const postDate = new Date(post.publishedAt || post.createdAt);
                        return postDate.toDateString() === today.toDateString();
                      }).length || 0}
                      prefix={<RiseOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>

                <Col xs={24} md={12} lg={6}>
                  <Card className="optimized-card dashboard-statistic-card">
                    <Statistic
                      title="热门标签"
                      value={trendingTags?.length || 0}
                      prefix={<TagsOutlined />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>

                {/* 热门文章 */}
                <Col xs={24} lg={8}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <FireOutlined style={{ color: '#ff4d4f' }} />
                        热门文章
                      </Space>
                    }
                    className="optimized-card h-full"
                    extra={<Link to="/popular">更多</Link>}
                  >
                    {dashboardLoading ? (
                      <Skeleton active paragraph={{ rows: 3 }} />
                    ) : (
                      <div className="space-y-3">
                        {popularPosts.slice(0, 5).map((post: BlogPost, index: number) => (
                          <div
                            key={post.id}
                            className="flex items-start cursor-pointer hover:text-blue-600 transition-colors duration-200 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => navigate(`/post/${post.slug}`)}
                          >
                            <span className="font-mono text-xs opacity-50 mr-2 mt-1">
                              {index + 1}.
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-sm line-clamp-2">
                                {post.title}
                              </div>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <EyeOutlined className="mr-1" />
                                <span>{post.stats?.viewCount || 0}</span>
                                <LikeOutlined className="ml-2 mr-1" />
                                <span>{post.stats?.likeCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </Col>

                {/* 最新文章 */}
                <Col xs={24} lg={8}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <RiseOutlined style={{ color: '#52c41a' }} />
                        最新文章
                      </Space>
                    }
                    className="optimized-card h-full"
                    extra={<Link to="/recent">更多</Link>}
                  >
                    {dashboardLoading ? (
                      <Skeleton active paragraph={{ rows: 3 }} />
                    ) : (
                      <div className="space-y-3">
                        {recentPosts.slice(0, 5).map((post: BlogPost) => (
                          <div
                            key={post.id}
                            className="flex items-start cursor-pointer hover:text-blue-600 transition-colors duration-200 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => navigate(`/post/${post.slug}`)}
                          >
                            <Avatar
                              size="small"
                              src={post.author.avatar}
                              className="mr-2 mt-0.5 flex-shrink-0"
                            >
                              {post.author.username[0]}
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium text-sm line-clamp-2">
                                {post.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDate(post.publishedAt || post.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </Col>

                {/* 热门标签 */}
                <Col xs={24} lg={8}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <TagsOutlined style={{ color: '#52c41a' }} />
                        热门标签
                      </Space>
                    }
                    className="optimized-card h-full"
                    extra={<Link to="/tags">更多</Link>}
                  >
                    {dashboardLoading ? (
                      <Skeleton active paragraph={{ rows: 2 }} />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {trendingTags.slice(0, 15).map((tag: string, index: number) => (
                          <Button
                            key={tag}
                            type="default"
                            size="small"
                            onClick={() => {
                              filterByTags([tag]);
                            }}
                            className="optimized-button rounded-full"
                            style={{
                              fontSize: `${12 + (15 - index)}px`,
                              opacity: 1 - (index * 0.05)
                            }}
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {/* 文章列表 */}
          <div>
            {loading || searchLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : error ? (
              <Alert
                message="加载失败"
                description={error.message}
                type="error"
                showIcon
                className="optimized-alert"
              />
            ) : (
              <>
                {currentPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileTextOutlined className="text-4xl text-gray-300 mb-4" />
                    <Title level={4} className="text-gray-500">
                      {searchQuery ? '没有找到相关文章' : '暂无文章'}
                    </Title>
                    <Text type="secondary" className="block mt-2">
                      {searchQuery ? '尝试使用其他关键词搜索' : '还没有发布任何文章'}
                    </Text>
                  </div>
                ) : viewMode === 'grid' ? (
                  // 网格视图
                  <Row gutter={[24, 24]}>
                    {currentPosts.map((post: BlogPost) => (
                      <Col xs={24} sm={12} lg={8} key={post.id}>
                        <Card
                          hoverable
                          className="optimized-card blog-post-card"
                          cover={
                            post.coverImageUrl ? (
                              <img
                                alt={post.title}
                                src={post.coverImageUrl}
                                className="h-48 object-cover"
                              />
                            ) : null
                          }
                          actions={[
                            <EyeOutlined key="view" />,
                            <LikeOutlined key="like" />,
                            <Dropdown
                              key="more"
                              menu={{ items: getPostMenuItems(post) }}
                              trigger={['click']}
                            >
                              <MoreOutlined />
                            </Dropdown>,
                          ]}
                        >
                          <Card.Meta
                            title={
                              <Link to={`/post/${post.slug}`} className="hover:text-blue-600">
                                {post.title}
                              </Link>
                            }
                            description={
                              <div className="mt-2">
                                <Text type="secondary" className="line-clamp-2 text-sm">
                                  {post.excerpt || '暂无摘要'}
                                </Text>
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {post.tags?.slice(0, 3).map(tag => (
                                    <Tag key={tag} className="text-xs">
                                      {tag}
                                    </Tag>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center">
                                    <Avatar
                                      size="small"
                                      src={post.author.avatar}
                                      className="mr-2"
                                    >
                                      {post.author.username[0]}
                                    </Avatar>
                                    <Text type="secondary" className="text-xs">
                                      {post.author.username}
                                    </Text>
                                  </div>
                                  <Text type="secondary" className="text-xs">
                                    {formatDate(post.publishedAt || post.createdAt)}
                                  </Text>
                                </div>
                                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                  <Space size="small">
                                    <span>
                                      <EyeOutlined className="mr-1" />
                                      {post.stats?.viewCount || 0}
                                    </span>
                                    <span>
                                      <LikeOutlined className="mr-1" />
                                      {post.stats?.likeCount || 0}
                                    </span>
                                  </Space>
                                </div>
                              </div>
                            }
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  // 列表视图
                  <List
                    itemLayout="vertical"
                    size="large"
                    dataSource={currentPosts}
                    renderItem={(post: BlogPost) => (
                      <List.Item
                        key={post.id}
                        actions={[
                          <span key="view">
                            <EyeOutlined className="mr-1" />
                            {post.stats?.viewCount || 0}
                          </span>,
                          <span key="like">
                            <LikeOutlined className="mr-1" />
                            {post.stats?.likeCount || 0}
                          </span>,
                          <Dropdown
                            key="more"
                            menu={{ items: getPostMenuItems(post) }}
                            trigger={['click']}
                          >
                            <MoreOutlined />
                          </Dropdown>,
                        ]}
                        extra={
                          post.coverImageUrl ? (
                            <img
                              alt={post.title}
                              src={post.coverImageUrl}
                              className="w-48 h-32 object-cover rounded"
                            />
                          ) : null
                        }
                      >
                        <List.Item.Meta
                          title={
                            <Link to={`/post/${post.slug}`} className="text-xl hover:text-blue-600">
                              {post.title}
                            </Link>
                          }
                          description={
                            <div>
                              <div className="flex items-center mb-2">
                                <Avatar
                                  size="small"
                                  src={post.author.avatar}
                                  className="mr-2"
                                >
                                  {post.author.username[0]}
                                </Avatar>
                                <Text type="secondary" className="text-sm">
                                  {post.author.username}
                                </Text>
                                <Text type="secondary" className="mx-2">•</Text>
                                <Text type="secondary" className="text-sm">
                                  {formatDate(post.publishedAt || post.createdAt)}
                                </Text>
                              </div>
                              <Text type="secondary" className="block mb-2">
                                {post.excerpt || '暂无摘要'}
                              </Text>
                              <div className="flex flex-wrap gap-1">
                                {post.tags?.slice(0, 5).map(tag => (
                                  <Tag key={tag} className="text-xs">
                                    {tag}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
