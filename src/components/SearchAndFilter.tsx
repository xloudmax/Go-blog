import React, { useState } from 'react';
import { Input, Select, Button, Tag, Popover, ConfigProvider } from 'antd';
import { SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons';
import type { PostFilter } from '@/types';

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
  const [isFocused, setIsFocused] = useState(false);

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

  return (
    <div className="w-full flex flex-col items-center">
      {/* Search Bar Container */}
      <div 
        className={`flex items-center w-full max-w-3xl backdrop-blur-xl rounded-full px-4 py-2 transition-all duration-300 ${isFocused ? 'bg-white/40 shadow-xl' : 'bg-white/25 shadow-lg hover:bg-white/30'}`}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.3)',
          height: '56px'
        }}
      >
        <SearchOutlined className={`text-xl mr-3 ${isFocused ? 'text-blue-600' : 'text-gray-500'}`} />
        
        {/* Transparent Ant Design Input */}
        <ConfigProvider
           theme={{
             components: {
               Input: {
                 colorBgContainer: 'transparent',
                 activeBorderColor: 'transparent',
                 hoverBorderColor: 'transparent',
               }
             }
           }}
        >
          <Input 
            placeholder="Search topics..." 
            variant="borderless"
            className="flex-grow !bg-transparent text-lg font-medium text-gray-800 placeholder-gray-500"
            style={{ backgroundColor: 'transparent', boxShadow: 'none' }}
            value={searchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
          />
        </ConfigProvider>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-400/20 mx-3"></div>

        {/* Filter Button */}
        <Popover
           placement="bottomRight"
           trigger="click"
           overlayInnerStyle={{ 
             borderRadius: '16px', 
             padding: '16px', 
             background: 'rgba(255, 255, 255, 0.8)', 
             backdropFilter: 'blur(20px)',
             boxShadow: '0 20px 40px rgba(0,0,0,0.1)' 
           }}
           content={
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

      {/* Active Filter Pills (Minimal) */}
      {(selectedTags.length > 0 || activeFilters.status) && (
        <div className="mt-4 flex flex-wrap gap-2 animate-fade-in">
          {selectedTags.map(tag => (
            <Tag key={tag} closable onClose={() => handleTagChange(selectedTags.filter(t => t !== tag))} className="rounded-full px-3 py-1 border-0 bg-white/40 backdrop-blur-md">
              #{tag}
            </Tag>
          ))}
          {activeFilters.status && (
            <Tag closable onClose={() => handleStatusChange('')} className="rounded-full px-3 py-1 border-0 bg-blue-100/50 text-blue-600 backdrop-blur-md">
              {activeFilters.status}
            </Tag>
          )}
          <Button type="link" size="small" onClick={clearAllFilters} className="text-gray-500 hover:text-black">
             Clear
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;

