'use client';

import { cn } from '@/utils/cn';
import { type HTMLMotionProps, MotionValue, motion, useMotionValue, useSpring } from 'framer-motion';
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react';
import { LiquidFilter, LiquidFilterProps } from './filter';

/**
 * Safely parse border radius from computed styles, handling edge cases like
 * scientific notation (from rounded-full), percentages, and invalid values.
 * For very large values or scientific notation, returns half of the smallest dimension.
 */
const getBorderRadius = (element: HTMLElement, rect: DOMRect): number => {
    const computedStyle = getComputedStyle(element);
    const rawRadius = computedStyle.borderRadius;

    if (!rawRadius || rawRadius === '0px') {
        return 0;
    }

    const parsedRadius = parseFloat(rawRadius);

    if (Number.isNaN(parsedRadius)) {
        return 0;
    }

    // Handle scientific notation (e.g., '1.67772e+07px' from rounded-full) or very large values
    if (parsedRadius > 9999 || rawRadius.includes('e+') || rawRadius.includes('E+')) {
        // For very large values (like rounded-full), return half of smallest dimension
        return Math.min(rect.width, rect.height) / 2;
    }

    return parsedRadius;
};

const useMotionSizeObservers = <T extends HTMLElement = HTMLDivElement>(
    containerRef: React.RefObject<T | null>,
    disabled: boolean = false,
) => {
    // Use motion values with built-in spring animations and safe initial values
    // Lower stiffness and higher damping to prevent oscillations
    const width = useSpring(1, { stiffness: 200, damping: 40 });
    const height = useSpring(1, { stiffness: 200, damping: 40 });
    const borderRadius = useSpring(0, { stiffness: 200, damping: 40 });

    // Ref to prevent infinite update loops and handle initial measurement
    const isUpdating = useRef(false);
    const isFirstUpdate = useRef(true);

    // Update dimensions and border radius
    const updateDimensions = () => {
        if (!containerRef.current || disabled || isUpdating.current) return;

        isUpdating.current = true;

        const rect = containerRef.current.getBoundingClientRect();
        const borderRadiusValue = getBorderRadius(containerRef.current, rect);

        // Only update if values have actually changed or if it's the first update
        const newWidth = Math.max(rect.width, 1);
        const newHeight = Math.max(rect.height, 1);
        const newRadius = Math.max(borderRadiusValue, 0);

        const shouldForceJump = isFirstUpdate.current && newWidth > 1 && newHeight > 1;

        if (shouldForceJump) {
            width.jump(newWidth);
            height.jump(newHeight);
            borderRadius.jump(newRadius);
            isFirstUpdate.current = false;
        } else {
            if (Math.abs(width.get() - newWidth) > 0.5) {
                width.set(newWidth);
            }
            if (Math.abs(height.get() - newHeight) > 0.5) {
                height.set(newHeight);
            }
            if (Math.abs(borderRadius.get() - newRadius) > 0.5) {
                borderRadius.set(newRadius);
            }
        }

        // Reset the updating flag after a short delay
        setTimeout(() => {
            isUpdating.current = false;
        }, 16);
    };

    // Observe size changes
    useLayoutEffect(() => {
        if (!containerRef.current || disabled) return;

        const resizeObserver = new ResizeObserver(() => {
            updateDimensions();
        });

        resizeObserver.observe(containerRef.current);

        // Initial measurement
        updateDimensions();

        return () => {
            resizeObserver.disconnect();
        };
    }, [disabled]);

    // Watch for border radius changes through MutationObserver
    useEffect(() => {
        if (!containerRef.current || disabled) return;

        let timeoutId: ReturnType<typeof setTimeout>;
        const mutationObserver = new MutationObserver(() => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(updateDimensions, 150); // Increased debounce for stability
        });

        mutationObserver.observe(containerRef.current, {
            attributes: true,
            attributeFilter: ['style', 'class'],
        });

        return () => {
            clearTimeout(timeoutId);
            mutationObserver.disconnect();
        };
    }, [disabled]);

    return {
        width,
        height,
        borderRadius,
    };
};

export interface LiquidGlassProps<T extends HTMLElement = HTMLDivElement>
    extends Pick<
        LiquidFilterProps,
        | 'glassThickness'
        | 'bezelWidth'
        | 'blur'
        | 'bezelHeightFn'
        | 'refractiveIndex'
        | 'specularOpacity'
        | 'specularSaturation'
        | 'dpr'
    > {
    targetRef?: React.RefObject<T | null>;
    width?: MotionValue<number>;
    height?: MotionValue<number>;
    borderRadius?: MotionValue<number>;
}

export const useLiquidSurface = <T extends HTMLElement = HTMLDivElement>({
    targetRef,
    width: widthProp,
    height: heightProp,
    borderRadius: borderRadiusProp,
    ...props
}: LiquidGlassProps<T>) => {
    const rawId = useId().replace(/:/g, '');
    const filterId = `glass-${rawId}`;
    const rawRef = useRef<T>(null);
    const ref = targetRef ?? rawRef;

    // Use motion value props if provided, otherwise fall back to size observers
    const usePropValues = widthProp && heightProp && borderRadiusProp;
    const {
        width: observedWidth,
        height: observedHeight,
        borderRadius: observedRadius,
    } = useMotionSizeObservers(ref, Boolean(usePropValues));

    // Use the provided motion values or the observed ones
    const finalWidth = usePropValues ? widthProp : observedWidth;
    const finalHeight = usePropValues ? heightProp : observedHeight;
    const finalRadius = usePropValues ? borderRadiusProp : observedRadius;

    const filterNode = (
        <LiquidFilter id={filterId} width={finalWidth} height={finalHeight} radius={finalRadius} {...props} />
    );

    const filterStyles: React.CSSProperties = {
        backdropFilter: `url(#${filterId})`,
        WebkitBackdropFilter: `url(#${filterId})`,
    };

    return { filterId, filterStyles, ref, filterNode };
};

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
    const { filterStyles, filterId, filterNode, ref } = useLiquidSurface({
        glassThickness: glassThickness,
        bezelWidth: bezelWidth,
        blur: blur,
        bezelHeightFn: bezelHeightFn,
        refractiveIndex: refractiveIndex,
        specularOpacity: specularOpacity,
        specularSaturation: specularSaturation,
        dpr: dpr,
        targetRef,
        width,
        height,
        borderRadius,
    });

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
        }, []);

        return (
            <motion.div
                ref={ref}
                {...props}
                className={cn('bg-white/5', isLiquidSupported ? '' : 'border', className)}
                style={{
                    boxShadow: '0 3px 14px rgba(0,0,0,0.1)',
                    ...props.style,
                    ...(isLiquidSupported
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
