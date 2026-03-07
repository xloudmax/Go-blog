'use client';

import React, { useRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
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
    const ref = (forwardedRef as React.RefObject<HTMLButtonElement>) || internalRef;

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

    return (
        <>
            {filterNode}
            <motion.button
                ref={ref}
                type={htmlType}
                disabled={loading || props.disabled}
                whileHover={loading ? {} : { scale: 1.02, y: -1 }}
                whileTap={loading ? {} : { scale: 0.98, y: 0.5 }}
                className={cn(
                    'relative inline-flex items-center justify-center font-bold rounded-full transition-colors overflow-hidden border backdrop-blur-sm',
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                style={{
                    ...props.style,
                    ...filterStyles,
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.15)',
                }}
                {...props}
            >
                {/* Gloss highlights for extra depth */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <span className="relative z-10 flex items-center gap-2">
                    {loading && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {children as React.ReactNode}
                </span>
            </motion.button>
        </>
    );
});

LiquidButton.displayName = 'LiquidButton';
