import React from 'react';
import { Tag, Typography } from 'antd';

const { Title } = Typography;

export interface TagItem {
  name: string;
  count: number;
}

interface TagCloudProps {
  tags: TagItem[];
  onTagClick: (tag: string) => void;
}

const TagCloud: React.FC<TagCloudProps> = ({ tags, onTagClick }) => {
  // 获取所有唯一标签并按出现次数排序
  const sortedTags = [...tags]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // 只显示前20个标签

  if (sortedTags.length === 0) {
    return null;
  }

  // 计算标签大小和颜色
  const maxCount = Math.max(...sortedTags.map((tag) => tag.count));
  const minCount = Math.min(...sortedTags.map((tag) => tag.count));
  const getWeight = (count: number) => {
    if (maxCount === minCount) {
      return 0; // 避免除以0导致 NaN
    }
    return (count - minCount) / (maxCount - minCount);
  };

  return (
    <div className="mb-8">
      <Title level={4} className="mb-4 text-gray-800 dark:text-gray-200">热门标签</Title>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map((tag) => {
          // 根据出现次数计算标签大小
          const weight = getWeight(tag.count);
          const fontSize = 12 + weight * 12;
          const opacity = 0.7 + weight * 0.3;
          
          // 根据标签名称生成颜色
          const colors = [
            'blue', 'purple', 'cyan', 'green', 'magenta', 'red', 'volcano', 'orange', 'gold', 'lime'
          ];
          const colorIndex = tag.name.charCodeAt(0) % colors.length;
          const color = colors[colorIndex];
          
          return (
            <Tag
              key={tag.name}
              color={color}
              onClick={() => onTagClick(tag.name)}
              className="cursor-pointer transition-all hover:scale-110"
              style={{
                fontSize: `${fontSize}px`,
                opacity: opacity,
                borderRadius: '16px',
                padding: '4px 12px'
              }}
            >
              {tag.name}
            </Tag>
          );
        })}
      </div>
    </div>
  );
};

export default TagCloud;