import React, { useState } from 'react';
import { Select, Popover, ConfigProvider, Grid } from 'antd';
import { LiquidButton } from './LiquidButton';
import { FilterOutlined } from '@ant-design/icons';
import { LiquidSearchBox } from './LiquidSearchBox';
import type { PostFilter } from '@/types';

const { Option } = Select;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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
        height={isMobile ? 44 : 52}
        bezelWidth={isMobile ? 10 : 12}
        scale={isMobile ? 15 : 20}
        className="w-full"
        inputClassName={isMobile ? "text-sm font-medium" : "text-base font-medium"}
      >
        {/* Unified Filter Trigger inside Search Box */}
        <Popover
           placement={isMobile ? "bottom" : "bottomRight"}
           trigger="click"
           overlayStyle={{ width: isMobile ? 'calc(100vw - 32px)' : 'auto' }}
           styles={{ 
             body: {
               borderRadius: '16px', 
               padding: isMobile ? '12px' : '16px', 
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
             <div className={isMobile ? "w-full" : "w-64"}>
                <div className="mb-4">
                   <div className="text-[10px] md:text-xs font-bold text-gray-500 mb-2 whitespace-nowrap">TAGS</div>
                   <Select
                      mode="multiple"
                      placeholder="Select tags"
                      value={selectedTags}
                      onChange={handleTagChange}
                      style={{ width: '100%' }}
                      maxTagCount="responsive"
                      size={isMobile ? 'middle' : 'middle'}
                   >
                     {allTags.map(tag => (
                       <Option key={tag} value={tag}>{tag}</Option>
                     ))}
                   </Select>
                </div>
                <div>
                   <div className="text-[10px] md:text-xs font-bold text-gray-500 mb-2 whitespace-nowrap">STATUS</div>
                   <Select
                      placeholder="Status"
                      value={activeFilters.status}
                      onChange={handleStatusChange}
                      style={{ width: '100%' }}
                      allowClear
                      size={isMobile ? 'middle' : 'middle'}
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
             className={`!w-8 md:!w-10 !h-8 md:!h-10 !p-0 flex items-center justify-center rounded-full transition-all
               ${selectedTags.length > 0 || activeFilters.status 
                 ? '!text-blue-600 !bg-blue-500/10' 
                 : '!text-gray-400 hover:!bg-black/5 hover:!text-black'}`}
           >
             <FilterOutlined className="text-sm md:text-base" />
           </LiquidButton>
        </Popover>
      </LiquidSearchBox>
    </div>
  );
};

export default SearchAndFilter;
