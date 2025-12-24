import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { BlogPost } from '@/types';
import HeroArticleCard from './HeroArticleCard';

interface HeroCarouselProps {
  posts: BlogPost[];
  onNavigate: (slug: string) => void;
  autoPlayInterval?: number;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ 
  posts, 
  onNavigate,
  autoPlayInterval = 8000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = right, -1 = left

  useEffect(() => {
    if (posts.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [currentIndex, posts.length, autoPlayInterval]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  const activePost = posts[currentIndex];

  // Optimized Framer Motion variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9, // Start slightly smaller
      filter: 'blur(4px)', // Slight blur for depth
      zIndex: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      zIndex: 1,
      transition: {
        x: { type: "spring", stiffness: 200, damping: 25, mass: 1 }, // Smoother spring
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
        filter: { duration: 0.3 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9, // Shrink slightly on exit
      filter: 'blur(4px)',
      zIndex: 0,
      transition: {
        x: { type: "spring", stiffness: 200, damping: 25, mass: 1 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
        filter: { duration: 0.3 }
      }
    })
  } as any;

  if (!posts || posts.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-[24px] mb-12 group" style={{ height: '390px' }}>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
           key={activePost.id}
           custom={direction}
           variants={variants}
           initial="enter"
           animate="center"
           exit="exit"
           className="absolute inset-0 w-full h-full"
           style={{ perspective: 1000 }}
        >
           <HeroArticleCard post={activePost} onNavigate={onNavigate} />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls (Only if > 1 post) */}
      {posts.length > 1 && (
        <>
          {/* Left Arrow */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <Button 
                shape="circle" 
                icon={<LeftOutlined />} 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:text-white"
                size="large"
             />
          </div>

          {/* Right Arrow */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <Button 
                shape="circle" 
                icon={<RightOutlined />} 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:text-white"
                size="large"
             />
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {posts.map((_, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'w-6 bg-white' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroCarousel;
