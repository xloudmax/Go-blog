import React, { useState } from 'react';
import { Select, Popover, ConfigProvider } from 'antd';
import { LiquidButton } from './LiquidButton';
import { FilterOutlined } from '@ant-design/icons';
import { LiquidSearchBox } from './LiquidSearchBox';
import type { PostFilter } from '@/types';

const { Option } = Select;

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filter: PostFilter) => void;
  activeFilters: PostFilter;
  onClearFilters: () => void;
  allTags: string[];
  className?: string;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ 
  onSearch, 
  onFilter, 
  activeFilters,
  allTags,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Derive selected tags from props
  const selectedTags = activeFilters?.tags || [];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleTagChange = (tags: string[]) => {
    onFilter({ ...activeFilters, tags });
  };

  const handleStatusChange = (value: string) => {
    onFilter({ ...activeFilters, status: value as never });
  };

  return (
    <div className={`${className}`}>
      <LiquidSearchBox
        placeholder="Search topics..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onSearch={handleSearch}
        blur={0}
        height={52}
        className="w-full"
        inputClassName="text-base font-medium"
      >
        {/* Unified Filter Trigger inside Search Box */}
        <Popover
           placement="bottomRight"
           trigger="click"
           styles={{ 
             body: {
               borderRadius: '16px', 
               padding: '16px', 
               background: 'rgba(255, 255, 255, 0.8)', 
               backdropFilter: 'blur(20px)',
               boxShadow: '0 20px 40px rgba(0,0,0,0.1)' 
             }
           }}
           content={
             <ConfigProvider
                theme={{
                  components: {
                    Select: {
                      optionSelectedBg: 'rgba(24, 144, 255, 0.1)',
                      optionSelectedColor: '#1890ff',
                      colorBgContainer: '#ffffff',
                      colorText: '#333333',
                      colorTextPlaceholder: '#999999',
                    }
                  }
                }}
             >
             <div className="w-64">
                <div className="mb-4">
                   <div className="text-xs font-bold text-gray-500 mb-2">TAGS</div>
                   <Select
                      mode="multiple"
                      placeholder="Select tags"
                      value={selectedTags}
                      onChange={handleTagChange}
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                   >
                     {allTags.map(tag => (
                       <Option key={tag} value={tag}>{tag}</Option>
                     ))}
                   </Select>
                </div>
                <div>
                   <div className="text-xs font-bold text-gray-500 mb-2">STATUS</div>
                   <Select
                      placeholder="Status"
                      value={activeFilters.status}
                      onChange={handleStatusChange}
                      style={{ width: '100%' }}
                      allowClear
                   >
                     <Option value="PUBLISHED">Published</Option>
                     <Option value="DRAFT">Draft</Option>
                     <Option value="ARCHIVED">Archived</Option>
                   </Select>
                </div>
             </div>
             </ConfigProvider>
           }
        >
           <LiquidButton 
             variant="ghost"
             className={`!w-10 !h-10 !p-0 flex items-center justify-center rounded-full transition-all
               ${selectedTags.length > 0 || activeFilters.status 
                 ? '!text-blue-600 !bg-blue-500/10' 
                 : '!text-gray-400 hover:!bg-black/5 hover:!text-black'}`}
           >
             <FilterOutlined className="text-base" />
           </LiquidButton>
        </Popover>
      </LiquidSearchBox>
    </div>
  );
};

export default SearchAndFilter;
