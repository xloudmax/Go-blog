import React, { useState } from 'react';
import { Input, Select, Button, Space, Tag } from 'antd';
import { SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons';
import type { PostFilter } from '@/types';

const { Search } = Input;
const { Option } = Select;

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filter: PostFilter) => void;
  activeFilters: PostFilter;
  onClearFilters: () => void;
  allTags: string[];
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ 
  onSearch, 
  onFilter, 
  activeFilters,
  onClearFilters,
  allTags
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(activeFilters?.tags || []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags);
    onFilter({ ...activeFilters, tags });
  };

  const handleStatusChange = (value: string) => {
    onFilter({ ...activeFilters, status: value as never });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    onClearFilters();
  };

  // 检查是否有活动的筛选器
  const hasActiveFilters = selectedTags.length > 0 || activeFilters.status;

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* 搜索框 */}
      <div className="mb-4">
        <Search
          placeholder="搜索文章标题、内容或标签"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg focus:outline-none focus:ring-0 focus:shadow-none"
          style={{ 
            borderRadius: '0.5rem',
          }}
        />
      </div>

      {/* 筛选器 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Space wrap>
          <div className="flex items-center">
            <FilterOutlined className="mr-2 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">筛选:</span>
          </div>
          
          {/* 标签筛选 */}
          <Select
            mode="multiple"
            placeholder="选择标签"
            value={selectedTags}
            onChange={handleTagChange}
            style={{ minWidth: 150 }}
            className="rounded-lg focus:outline-none focus:ring-0 focus:shadow-none"
            styles={{ popup: { root: { borderRadius: '0.5rem' } } }}
          >
            {allTags.map(tag => (
              <Option key={tag} value={tag}>{tag}</Option>
            ))}
          </Select>
          
          {/* 状态筛选 */}
          <Select
            placeholder="文章状态"
            value={activeFilters.status}
            onChange={handleStatusChange}
            style={{ minWidth: 120 }}
            className="rounded-lg focus:outline-none focus:ring-0 focus:shadow-none"
            styles={{ popup: { root: { borderRadius: '0.5rem' } } }}
          >
            <Option value="PUBLISHED">已发布</Option>
            <Option value="DRAFT">草稿</Option>
            <Option value="ARCHIVED">已归档</Option>
          </Select>
        </Space>

        {/* 清除筛选器按钮 */}
        {hasActiveFilters && (
          <Button 
            icon={<CloseOutlined />} 
            onClick={clearAllFilters}
            className="flex items-center rounded-lg focus:outline-none focus:ring-0 focus:shadow-none"
          >
            清除筛选
          </Button>
        )}
      </div>

      {/* 活动的筛选标签 */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <Tag 
              key={tag} 
              closable 
              onClose={() => handleTagChange(selectedTags.filter(t => t !== tag))}
              className="rounded-full focus:outline-none focus:ring-0 focus:shadow-none"
            >
              {tag}
            </Tag>
          ))}
          {activeFilters.status && (
            <Tag 
              closable 
              onClose={() => handleStatusChange('')}
              className="rounded-full focus:outline-none focus:ring-0 focus:shadow-none"
            >
              状态: {activeFilters.status === 'PUBLISHED' ? '已发布' : activeFilters.status === 'DRAFT' ? '草稿' : '已归档'}
            </Tag>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
