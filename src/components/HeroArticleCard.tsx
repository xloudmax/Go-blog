import React, { useMemo } from 'react';
import { Avatar } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import type { BlogPost } from '@/types';
import { getGradientByString } from '@/utils/gradients';
import { LiquidGlass } from './LiquidKit/glass';

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
    <motion.div 
      className="group relative w-full h-full overflow-hidden rounded-[32px] cursor-pointer transition-all duration-500 ease-out border border-white/5"
      style={{ 
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3)',
        willChange: 'transform',
      }}
      onClick={() => onNavigate(post.slug)}
    >
      {/* Base Background Layer - Image or Gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
        style={{ 
          backgroundImage: post.coverImageUrl ? `url(${post.coverImageUrl})` : activeGradient,
          backgroundColor: '#1a1a1e',
        }}
      >
         {/* Noise Texture for visual richness */}
         <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Core Liquid Glass Refraction Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LiquidGlass
          glassThickness={70} 
          blur={0.15} 
          bezelWidth={50} 
          refractiveIndex={1.5} 
          specularOpacity={0} // Removed specular for a cleaner look
          specularSaturation={0}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 32,
          }}
          className="w-full h-full"
        />
      </div>

      {/* Dynamic Overlay for Depth and Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-[2]" />

      {/* Content Layer */}
      <div className="absolute bottom-0 inset-x-0 h-full flex flex-col justify-end !p-8 !md:p-12 z-10 transition-all duration-500">
        <div className="flex flex-col gap-2">
          
          {/* Badge & Date - Premium chips */}
          <div className="flex items-center gap-3">
             <span className="bg-white/10 backdrop-blur-xl !px-3 !py-1 rounded-full text-white font-bold tracking-widest text-[10px] border border-white/20 shadow-lg uppercase">
                {post.tags && post.tags.length > 0 ? post.tags[0] : 'Featured'}
             </span>
             <span className="text-white/60 text-xs flex items-center font-medium drop-shadow-md">
                <ClockCircleOutlined className="mr-1.5 opacity-70" />
                {formatDate(post.publishedAt || post.createdAt)}
             </span>
          </div>

          {/* Title - Large and Impactful */}
          <h2 className="text-white !mb-0 text-3xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] max-w-4xl" style={{ fontFamily: 'var(--font-display, inherit)' }}>
            {post.title}
          </h2>

          {/* Excerpt - Optimized for readability */}
          <p className="text-gray-200 text-base md:text-lg lg:text-xl line-clamp-2 max-w-2xl font-medium tracking-wide opacity-80 leading-relaxed">
            {post.excerpt || 'Discover the latest thoughts and insights from our team.'}
          </p>

          {/* Footer: User Profile */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2.5">
              <Avatar src={post.author.avatar} size={32} className="border border-white/40 ring-4 ring-white/5 shadow-xl">
                {post.author.username?.[0]?.toUpperCase()}
              </Avatar>
              <div className="flex flex-col">
                <span className="text-white/90 font-bold text-xs tracking-wide drop-shadow-md">{post.author.username}</span>
                <span className="text-white/40 text-[10px] font-medium uppercase tracking-[0.1em]">Author</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroArticleCard;
