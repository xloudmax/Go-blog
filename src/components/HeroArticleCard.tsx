import React, { useMemo } from 'react';
import { Avatar } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import type { BlogPost } from '@/types';
import { getGradientByString } from '@/utils/gradients';

interface HeroArticleCardProps {
  post: BlogPost;
  onNavigate: (slug: string) => void;
}

const HeroArticleCard: React.FC<HeroArticleCardProps> = ({ post, onNavigate }) => {
  // Stable random gradient based on post slug
  const activeGradient = useMemo(() => {
    return getGradientByString(post.slug);
  }, [post.slug]);

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
      className="group relative w-full overflow-hidden rounded-[24px] cursor-pointer transition-all duration-500 ease-out hover:shadow-2xl hover:scale-[1.01]"
      style={{ 
        height: '390px', 
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.25)',
        transform: 'translateZ(0)'
      }}
      onClick={() => onNavigate(post.slug)}
    >
      {/* Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
        style={{ 
          backgroundImage: post.coverImageUrl ? `url(${post.coverImageUrl})` : activeGradient,
          backgroundColor: '#3b82f6'
        }}
      >
         {/* Noise Texture Overlay for texture */}
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Dark Gradient Overlay for Text Readability - Stronger at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

      {/* Content Layer */}
      <div className="absolute bottom-0 inset-x-0 h-full flex flex-col justify-end !p-6 !md:p-10 z-10 transition-all duration-500">
        <div className="transform transition-transform duration-500 translate-y-0 flex flex-col gap-0.5">
          
          {/* Badge & Date */}
          <div className="flex items-center gap-3">
             <span className="bg-white/20 backdrop-blur-md !px-1.5 !py-0.5 rounded-full text-white font-bold tracking-wider text-[10px] border border-white/10 shadow-sm">
                {post.tags && post.tags.length > 0 ? `#${post.tags[0]}` : 'FEATURED'}
             </span>
             <span className="text-gray-300 text-xs flex items-center font-medium drop-shadow-md">
                <ClockCircleOutlined className="mr-1" />
                {formatDate(post.publishedAt || post.createdAt)}
             </span>
          </div>

          {/* Title - Using h1 for absolute color control */}
          <h1 className="text-white !mb-0 text-4xl md:text-5xl lg:text-7xl font-extrabold leading-none tracking-tight drop-shadow-2xl max-w-4xl" style={{ fontFamily: 'var(--font-display, inherit)' }}>
            {post.title}
          </h1>

          {/* Excerpt - Using p for absolute color control */}
          <p className="text-gray-100 text-lg md:text-xl lg:text-2xl line-clamp-3 max-w-3xl font-light tracking-wide opacity-90 mix-blend-plus-lighter text-shadow-sm">
            {post.excerpt || 'No summary available for this post.'}
          </p>

          {/* Footer: User & Read More */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              <Avatar src={post.author.avatar} size="default" className="border-2 border-white/80 bg-gray-600">
                {post.author.username?.[0]?.toUpperCase()}
              </Avatar>
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm drop-shadow-md">{post.author.username}</span>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroArticleCard;
