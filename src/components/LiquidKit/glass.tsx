'use client';

import { cn } from '@/utils/cn';
import { type HTMLMotionProps, motion, useMotionValue } from 'framer-motion';
import React, { useCallback, useEffect } from 'react';
import { LiquidGlassProps, useLiquidSurface } from './use-liquid-surface';
import { LiquidFilter } from './filter';

export const LiquidGlass: React.FC<LiquidGlassProps & HTMLMotionProps<'div'>> = React.memo(({
    children,
    glassThickness,
    bezelWidth,
    blur,
    bezelHeightFn,
    refractiveIndex,
    specularOpacity,
    specularSaturation,
    dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    targetRef,
    width,
    height,
    borderRadius,
    ...props
}) => {
    const { ref, filterId, finalWidth, finalHeight, finalRadius } = useLiquidSurface({
        glassThickness,
        bezelWidth,
        blur,
        bezelHeightFn,
        refractiveIndex,
        specularOpacity,
        specularSaturation,
        dpr,
        targetRef,
        width,
        height,
        borderRadius,
    });

    const filterNode = (
        <LiquidFilter 
            id={filterId} 
            width={finalWidth} 
            height={finalHeight} 
            radius={finalRadius} 
            glassThickness={glassThickness}
            bezelWidth={bezelWidth}
            blur={blur}
            bezelHeightFn={bezelHeightFn}
            refractiveIndex={refractiveIndex}
            specularOpacity={specularOpacity}
            specularSaturation={specularSaturation}
            dpr={dpr}
        />
    );

    const filterStyles: React.CSSProperties = {
        backdropFilter: `url(#${filterId})`,
        WebkitBackdropFilter: `url(#${filterId})`,
    };

    useEffect(() => {
        if (targetRef?.current) {
            targetRef.current.style.backdropFilter = `url(#${filterId})`;
        }
    }, [targetRef, filterId]);

    return (
        <>
            {filterNode}
            {!targetRef && (
                <LiquidDiv
                    {...props}
                    style={{
                        ...props.style,
                        ...filterStyles,
                    }}
                    filterId={filterId}
                    ref={ref}
                    fallbackBlur={typeof blur === 'number' ? blur : 0.3}
                >
                    {children}
                </LiquidDiv>
            )}
        </>
    );
});

const LiquidDiv = React.forwardRef<HTMLDivElement, { filterId: string; fallbackBlur?: number } & HTMLMotionProps<'div'>>(
    ({ children, filterId, fallbackBlur = 0.3, className, ...props }, ref) => {
        const isLiquidSupported = useMotionValue(false);

        const supportsSVGFilters = useCallback(() => {
            const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            const isFirefox = /Firefox/.test(navigator.userAgent);

            if (isWebkit || isFirefox) {
                return false;
            }

            const div = document.createElement('div');
            div.style.backdropFilter = `url(#${filterId})`;
            return div.style.backdropFilter !== '';
        }, [filterId]);

        useEffect(() => {
            const svgSupported = supportsSVGFilters();
            if (svgSupported && typeof document !== 'undefined') {
                isLiquidSupported.set(true);
            }
        }, [supportsSVGFilters, isLiquidSupported]);

        return (
            <motion.div
                ref={ref}
                {...props}
                className={cn('bg-white/5', isLiquidSupported.get() ? '' : 'border', className)}
                style={{
                    boxShadow: '0 3px 14px rgba(0,0,0,0.1)',
                    ...props.style,
                    ...(isLiquidSupported.get()
                        ? {}
                        : {
                                backdropFilter: `blur(${Math.max(fallbackBlur * 5, 0)}px)`,
                                WebkitBackdropFilter: `blur(${Math.max(fallbackBlur * 5, 0)}px)`,
                          }),
                }}
            >
                {children}
            </motion.div>
        );
    },
);
