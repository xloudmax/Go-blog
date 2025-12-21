import React, { useState } from 'react';
import { Select, Button, Popover, ConfigProvider } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
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
  const [isFocused, setIsFocused] = useState(false);

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
    <div className={`flex flex-col ${className}`}>
      {/* Search Bar Container */}
      <div 
        className={`flex items-center backdrop-blur-xl rounded-full !pl-4 pr-4 py-2 transition-all duration-300 ${isFocused ? 'bg-white/40 shadow-xl' : 'bg-white/25 shadow-lg hover:bg-white/30'}`}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <SearchOutlined className={`text-lg !mr-4 ${isFocused ? 'text-blue-500' : 'text-gray-400'}`} />
        
        <input
          placeholder="Search topics..." 
          className="flex-grow bg-transparent border-none outline-none text-lg font-medium text-gray-800 placeholder-gray-500 min-w-0"
          value={searchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch((e.target as HTMLInputElement).value);
            }
          }}
        />

        {/* Divider */}
        <div className="h-6 w-px bg-gray-400/20 mx-3"></div>

        {/* Filter Button */}
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
           <Button 
             type="text" 
             className={`flex items-center rounded-full px-4 h-10 ${selectedTags.length > 0 || activeFilters.status ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-black/5 hover:text-black'}`}
           >
             <FilterOutlined className="text-lg" />
           </Button>
        </Popover>
      </div>
    </div>
  );
};

export default SearchAndFilter;
