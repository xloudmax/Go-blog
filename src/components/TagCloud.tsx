import React from 'react';
import { Tag, Typography } from 'antd';
import type { BlogPost } from '@/types';

const { Title } = Typography;

interface TagCloudProps {
  posts: BlogPost[];
  onTagClick: (tag: string) => void;
}

const TagCloud: React.FC<TagCloudProps> = ({ posts, onTagClick }) => {
  // 统计标签出现次数
  const tagCounts: Record<string, number> = {};
  
  posts.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  // 获取所有唯一标签并按出现次数排序
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20); // 只显示前20个标签

  if (sortedTags.length === 0) {
    return null;
  }

  // 计算标签大小和颜色
  const maxCount = Math.max(...sortedTags.map(([_, count]) => count));
  const minCount = Math.min(...sortedTags.map(([_, count]) => count));

  return (
    <div className="mb-8">
      <Title level={4} className="mb-4 text-gray-800 dark:text-gray-200">热门标签</Title>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map(([tag, count]) => {
          // 根据出现次数计算标签大小
          const fontSize = 12 + ((count - minCount) / (maxCount - minCount)) * 12;
          const opacity = 0.7 + ((count - minCount) / (maxCount - minCount)) * 0.3;
          
          // 根据标签名称生成颜色
          const colors = [
            'blue', 'purple', 'cyan', 'green', 'magenta', 'red', 'volcano', 'orange', 'gold', 'lime'
          ];
          const colorIndex = tag.charCodeAt(0) % colors.length;
          const color = colors[colorIndex];
          
          return (
            <Tag
              key={tag}
              color={color}
              onClick={() => onTagClick(tag)}
              className="cursor-pointer transition-all hover:scale-110"
              style={{
                fontSize: `${fontSize}px`,
                opacity: opacity,
                borderRadius: '16px',
                padding: '4px 12px'
              }}
            >
              {tag}
            </Tag>
          );
        })}
      </div>
    </div>
  );
};

export default TagCloud;