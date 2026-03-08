'use client';

import React, { useRef, useLayoutEffect } from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useLiquidSurface, LiquidGlassProps } from './LiquidKit/glass';

export interface LiquidButtonProps extends 
    Omit<LiquidGlassProps, 'targetRef' | 'width' | 'height' | 'borderRadius'>,
    HTMLMotionProps<'button'> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    htmlType?: 'button' | 'submit' | 'reset';
}

/**
 * LiquidButton - A premium, physics-based refraction button.
 * Leverages the LiquidGlass engine for realistic optical effects.
 */
export const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(({
    children,
    className,
    variant = 'primary',
    size = 'medium',
    glassThickness = 0.5,
    bezelWidth = 6,
    blur = 0.4,
    refractiveIndex = 1.4,
    specularOpacity = 0.7,
    loading = false,
    htmlType = 'button',
    ...props
}, forwardedRef) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const ref = internalRef;

    // Sync forwardedRef with internalRef
    useLayoutEffect(() => {
        if (!forwardedRef) return;
        if (typeof forwardedRef === 'function') {
            forwardedRef(internalRef.current);
        } else {
            (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = internalRef.current;
        }
    }, [forwardedRef]);

    const { filterStyles, filterNode } = useLiquidSurface({
        targetRef: ref,
        glassThickness,
        bezelWidth,
        blur,
        refractiveIndex,
        specularOpacity,
    });

    const variantStyles = {
        primary: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
        secondary: 'bg-white/10 text-gray-700 dark:text-gray-200 border-white/20',
        danger: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
        ghost: 'bg-transparent text-gray-500 hover:bg-white/5 border-transparent',
    };

    const sizeStyles = {
        small: 'px-3 py-1.5 text-xs h-8',
        medium: 'px-6 py-2.5 text-sm h-11',
        large: 'px-10 py-4 text-lg h-16',
    };

    const isDisabled = loading || props.disabled;

    return (
        <>
            {filterNode}
            <motion.button
                ref={ref}
                type={htmlType}
                disabled={isDisabled}
                whileHover={isDisabled ? {} : { scale: 1.02, y: -1 }}
                whileTap={isDisabled ? {} : { scale: 0.98, y: 0.5 }}
                className={cn(
                    'relative inline-flex items-center justify-center font-bold rounded-full transition-all duration-300 overflow-hidden border backdrop-blur-sm group',
                    variantStyles[variant],
                    sizeStyles[size],
                    isDisabled ? 'opacity-60 cursor-not-allowed grayscale-[0.3]' : 'cursor-pointer',
                    className
                )}
                style={{
                    ...props.style,
                    ...filterStyles,
                    boxShadow: isDisabled ? 'none' : '0 4px 20px -5px rgba(0,0,0,0.15)',
                }}
                {...props}
            >
                {/* Gloss highlights for extra depth */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none transition-opacity duration-300" 
                     style={{ opacity: isDisabled ? 0.3 : 1 }} />
                
                {/* Shine effect on hover */}
                {!isDisabled && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />
                )}

                <span className="relative z-10 flex items-center gap-2">
                    <AnimatePresence mode="wait">
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5, x: -10 }}
                                className="flex items-center justify-center"
                            >
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.2, 1],
                                        opacity: [0.6, 1, 0.6],
                                        borderRadius: ["40%", "50%", "40%"]
                                    }}
                                    transition={{ 
                                        duration: 1.5, 
                                        repeat: Infinity,
                                        ease: "easeInOut" 
                                    }}
                                    className={cn(
                                        "w-2.5 h-2.5 bg-current mr-1",
                                        variant === 'primary' ? 'shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 
                                        variant === 'danger' ? 'shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                        'shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                                    )}
                                />
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.2, 1],
                                        opacity: [0.3, 0.7, 0.3],
                                    }}
                                    transition={{ 
                                        duration: 1.5, 
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: 0.2
                                    }}
                                    className="w-1.5 h-1.5 bg-current rounded-full opacity-50"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <motion.span 
                        animate={loading ? { opacity: 0.8 } : { opacity: 1 }}
                    >
                        {children as React.ReactNode}
                    </motion.span>
                </span>
            </motion.button>
        </>
    );
});

LiquidButton.displayName = 'LiquidButton';
