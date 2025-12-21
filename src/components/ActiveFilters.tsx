import React from 'react';
import { Tag } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { PostFilter } from '@/types';

interface ActiveFiltersProps {
  activeFilters: PostFilter;
  onFilterChange: (filter: PostFilter) => void;
  onClearFilters: () => void;
  className?: string;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  activeFilters,
  onFilterChange,
  onClearFilters,
  className = '',
}) => {
  const selectedTags = activeFilters.tags || [];

  if (selectedTags.length === 0 && !activeFilters.status) {
    return null;
  }

  const handleTagClose = (tagToRemove: string) => {
    onFilterChange({
      ...activeFilters,
      tags: selectedTags.filter(t => t !== tagToRemove)
    });
  };

  const handleStatusClose = () => {
    onFilterChange({
      ...activeFilters,
      status: undefined
    });
  };

  return (
    <div className={`mt-4 mb-8 flex flex-wrap gap-2 animate-fade-in items-center justify-center ${className}`}>
      {selectedTags.map(tag => (
        <Tag 
          key={tag} 
          closable 
          onClose={() => handleTagClose(tag)}
          className="rounded-full !px-1.5 !py-0.5 border-0 bg-blue-500/10 text-blue-600 backdrop-blur-md shadow-sm transition-all hover:bg-blue-500/20"
          closeIcon={<CloseOutlined className="text-blue-500 hover:text-blue-700 font-bold" style={{ fontSize: '10px' }} />}
        >
          #{tag}
        </Tag>
      ))}
      
      {activeFilters.status && (
        <Tag 
          closable 
          onClose={handleStatusClose}
          className={`rounded-full !px-1.5 !py-0.5 border-0 backdrop-blur-md shadow-sm transition-all flex items-center
            ${activeFilters.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-600' : 
              activeFilters.status === 'DRAFT' ? 'bg-orange-500/10 text-orange-600' : 
              'bg-gray-500/10 text-gray-600'}`}
          closeIcon={<CloseOutlined className="ml-1 opacity-60 hover:opacity-100" style={{ fontSize: '10px' }} />}
        >
          <span className={`w-1.5 h-1.5 rounded-full mr-2 
            ${activeFilters.status === 'PUBLISHED' ? 'bg-green-500' : 
              activeFilters.status === 'DRAFT' ? 'bg-orange-500' : 'bg-gray-500'}`} 
          />
          <span className="text-xs font-semibold tracking-wide">{activeFilters.status}</span>
        </Tag>
      )}

      <div 
        onClick={onClearFilters} 
        className="cursor-pointer text-gray-400 hover:text-red-500 text-[10px] font-medium tracking-wider ml-2 transition-colors uppercase"
      >
         Clear
      </div>
    </div>
  );
};

export default ActiveFilters;
