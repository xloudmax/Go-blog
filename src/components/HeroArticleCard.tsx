import React from 'react';
import { Typography, Avatar } from 'antd';
import { ClockCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { BlogPost } from '@/types';

const { Title, Paragraph } = Typography;

interface HeroArticleCardProps {
  post: BlogPost;
  onNavigate: (slug: string) => void;
}

const HeroArticleCard: React.FC<HeroArticleCardProps> = ({ post, onNavigate }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div 
      className="group relative w-full overflow-hidden rounded-[32px] cursor-pointer transition-all duration-500 ease-out hover:shadow-2xl"
      style={{ 
        height: '500px', 
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)', // Softer initial shadow
        transform: 'translateZ(0)' // Hardware acceleration
      }}
      onClick={() => onNavigate(post.slug)}
    >
      {/* Background Image with Zoom Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110" // Apple-style smooth easing
        style={{ 
          backgroundImage: post.coverImageUrl ? `url(${post.coverImageUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
        }}
      />

      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col justify-end h-full">
        <div className="transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
          
          {/* Top Label */}
          <div className="mb-4 flex items-center space-x-3">
             <span className="text-blue-400 font-bold tracking-wider uppercase text-xs">FEATURED STORY</span>
             <span className="text-gray-400 text-xs flex items-center">
                <ClockCircleOutlined className="mr-1" />
                {formatDate(post.publishedAt || post.createdAt)}
             </span>
          </div>

          {/* Title */}
          <Title level={1} className="!text-white !mb-4 !text-4xl md:!text-5xl font-bold leading-tight drop-shadow-lg" style={{ fontFamily: 'var(--font-display, inherit)' }}>
            {post.title}
          </Title>

          {/* Excerpt */}
          <Paragraph className="!text-gray-200 text-lg line-clamp-2 max-w-2xl mb-6 backdrop-blur-sm bg-black/10 rounded-lg p-2">
            {post.excerpt}
          </Paragraph>

          {/* Footer: User & Tags */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar src={post.author.avatar} size="large" className="border-2 border-white/50">
                {post.author.username?.[0]?.toUpperCase()}
              </Avatar>
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm">{post.author.username}</span>
                <span className="text-gray-400 text-xs">Author</span>
              </div>
            </div>

            {/* Read More Button (Visual only) */}
            <div className="hidden md:flex items-center space-x-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-semibold transition-all group-hover:bg-white group-hover:text-black">
              <span>阅读全文</span>
              <ArrowRightOutlined />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroArticleCard;
