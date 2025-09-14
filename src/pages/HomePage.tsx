import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Typography,
  notification
} from 'antd';
import {
  EditOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useBlogList } from '@/hooks';
import { useAppUser } from '@/hooks';
import type { BlogPost, PostFilter } from '@/types';
import ArticleListContainer from '@/components/ArticleListContainer';
import TagCloud from '@/components/TagCloud';
import SearchAndFilter from '@/components/SearchAndFilter';
import ArticleSkeleton from '@/components/ArticleSkeleton';

const { Title, Text } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppUser();

  // 博客列表管理
  const {
    posts,
    loading,
    error,
    refetch
  } = useBlogList();

  // 筛选状态
  const [filters, setFilters] = useState<PostFilter>({});
  const [searchQuery, setSearchQuery] = useState('');

  // 当前显示的文章列表
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // 更新筛选后的文章列表
  React.useEffect(() => {
    if (!posts) return;

    let result = [...posts];

    // 应用搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(query) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // 应用标签筛选
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(post => 
        post.tags && filters.tags?.every(tag => post.tags?.includes(tag))
      );
    }

    // 应用状态筛选
    if (filters.status) {
      result = result.filter(post => post.status === filters.status);
    }

    setFilteredPosts(result);

    // 收集所有标签
    const tags = new Set<string>();
    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => tags.add(tag));
      }
    });
    setAllTags(Array.from(tags));
  }, [posts, searchQuery, filters]);

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 处理筛选
  const handleFilter = (newFilters: PostFilter) => {
    setFilters(newFilters);
  };

  // 清除筛选器
  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  // 处理标签点击
  const handleTagClick = (tag: string) => {
    setFilters({ ...filters, tags: [tag] });
  };

  // 处理文章操作
  const handlePostAction = (action: 'view' | 'edit' | 'share', post: BlogPost) => {
    // 这里可以添加全局的操作处理逻辑
    console.log(`执行操作: ${action} on post: ${post.title}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* 标签云 */}
        {posts && posts.length > 0 && (
          <TagCloud 
            posts={posts} 
            onTagClick={handleTagClick} 
          />
        )}

        {/* 搜索和筛选 */}
        <SearchAndFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          activeFilters={filters}
          onClearFilters={handleClearFilters}
          allTags={allTags}
        />

        {/* 内容区域 */}
        {loading ? (
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
          <ArticleListContainer 
            posts={filteredPosts}
            loading={loading}
            error={error || null}
            onAction={handlePostAction}
          />
        )}
      </div>
    </div>
  );
}
