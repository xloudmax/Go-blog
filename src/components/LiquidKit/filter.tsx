import React, { useEffect, useState } from 'react';
import { MotionValue, motion, useTransform } from 'framer-motion';
import { CONVEX, calculateRefractionSpecular, getDisplacementData, getValueOrMotion } from './liquid-lib';

function imageDataToUrl(imageData: ImageData): string {
    if (typeof document === 'undefined') {
        return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

export type LiquidFilterProps = {
    id: string;
    filterOnly?: boolean;
    scaleRatio?: MotionValue<number>;
    canvasWidth?: number | MotionValue<number>;
    canvasHeight?: number | MotionValue<number>;
    width: number | MotionValue<number>;
    height: number | MotionValue<number>;
    radius: number | MotionValue<number>;
    blur?: number | MotionValue<number>;
    glassThickness?: number | MotionValue<number>;
    bezelWidth?: number | MotionValue<number>;
    refractiveIndex?: number | MotionValue<number>;
    specularOpacity?: number | MotionValue<number>;
    specularSaturation?: number | MotionValue<number>;
    dpr?: number | MotionValue<number>;
    bezelHeightFn?: (x: number) => number;
};

export const LiquidFilter: React.FC<LiquidFilterProps> = React.memo(({
    id,
    filterOnly = false,
    canvasWidth,
    canvasHeight,
    width,
    height,
    radius,
    blur = 0.2,
    glassThickness = 40,
    bezelWidth: bezelWidthProp = 20,
    refractiveIndex = 1.5,
    scaleRatio,
    specularOpacity = 1,
    specularSaturation = 4,
    bezelHeightFn = CONVEX.fn,
    dpr,
}) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const displacementData = useTransform(() => {
        const canvasW = Math.round(canvasWidth ? getValueOrMotion(canvasWidth) : getValueOrMotion(width));
        const canvasH = Math.round(canvasHeight ? getValueOrMotion(canvasHeight) : getValueOrMotion(height));
        const devicePixelRatio = dpr ? getValueOrMotion(dpr) : 1;
        const radiusVal = Math.round(getValueOrMotion(radius));
        const clampedBezelWidth = Math.max(
            Math.min(getValueOrMotion(bezelWidthProp), 2 * radiusVal - 1),
            0,
        );

        return getDisplacementData({
            glassThickness: getValueOrMotion(glassThickness),
            bezelWidth: clampedBezelWidth,
            bezelHeightFn,
            refractiveIndex: getValueOrMotion(refractiveIndex),
            canvasWidth: canvasW,
            canvasHeight: canvasH,
            objectWidth: Math.round(getValueOrMotion(width)),
            objectHeight: Math.round(getValueOrMotion(height)),
            radius: radiusVal,
            dpr: devicePixelRatio,
        });
    });

    const specularLayer = useTransform(() => {
        const devicePixelRatio = dpr ? getValueOrMotion(dpr) : 1;
        const radiusVal = Math.round(getValueOrMotion(radius));
        const clampedBezelWidth = Math.max(
            Math.min(getValueOrMotion(bezelWidthProp), 2 * radiusVal - 1),
            0,
        );

        return calculateRefractionSpecular(
            getValueOrMotion(width),
            getValueOrMotion(height),
            radiusVal,
            50,
            clampedBezelWidth,
            devicePixelRatio,
        );
    });

    const displacementMapDataUrl = useTransform(() => {
        const data = displacementData.get();
        return data ? imageDataToUrl(data.displacementMap) : '';
    });
    
    const specularLayerDataUrl = useTransform(() => {
        const layer = specularLayer.get();
        return layer ? imageDataToUrl(layer) : '';
    });
    
    const baseScale = useTransform(() => {
        const data = displacementData.get();
        return (data ? data.maximumDisplacement : 0) * (scaleRatio?.get() ?? 1);
    });

    // Chromatic Aberration scales
    const scaleR = useTransform(baseScale, (s) => s * 1.0);
    const scaleG = useTransform(baseScale, (s) => s * 1.02);
    const scaleB = useTransform(baseScale, (s) => s * 1.04);

    // Unconditionally call useTransform to comply with Rules of Hooks
    const staticBlurTransform = useTransform(() => (typeof blur === 'number' ? blur : 0));
    const blurDeviation = typeof blur === 'object' && 'get' in blur ? blur : staticBlurTransform;
    
    const filterWidth = useTransform(() => (canvasWidth ? getValueOrMotion(canvasWidth) : getValueOrMotion(width)));
    const filterHeight = useTransform(() => (canvasHeight ? getValueOrMotion(canvasHeight) : getValueOrMotion(height)));

    const content = (
        <filter id={id} colorInterpolationFilters="sRGB">
            <motion.feGaussianBlur
                in={'SourceGraphic'}
                stdDeviation={blurDeviation}
                result={`blurred_source_${id}`}
            />

            <motion.feImage
                href={displacementMapDataUrl}
                x={0}
                y={0}
                width={filterWidth}
                height={filterHeight}
                result={`raw_displacement_map_${id}`}
            />
            <feGaussianBlur in={`raw_displacement_map_${id}`} stdDeviation="0.5" result={`displacement_map_${id}`} />

            <feColorMatrix 
                in={`blurred_source_${id}`} 
                type="matrix" 
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" 
                result={`r_channel_${id}`} 
            />
            <feColorMatrix 
                in={`blurred_source_${id}`} 
                type="matrix" 
                values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" 
                result={`g_channel_${id}`} 
            />
            <feColorMatrix 
                in={`blurred_source_${id}`} 
                type="matrix" 
                values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" 
                result={`b_channel_${id}`} 
            />

            <motion.feDisplacementMap
                in={`r_channel_${id}`}
                in2={`displacement_map_${id}`}
                scale={scaleR}
                xChannelSelector="R"
                yChannelSelector="G"
                result={`displaced_r_${id}`}
            />
            <motion.feDisplacementMap
                in={`g_channel_${id}`}
                in2={`displacement_map_${id}`}
                scale={scaleG}
                xChannelSelector="R"
                yChannelSelector="G"
                result={`displaced_g_${id}`}
            />
            <motion.feDisplacementMap
                in={`b_channel_${id}`}
                in2={`displacement_map_${id}`}
                scale={scaleB}
                xChannelSelector="R"
                yChannelSelector="G"
                result={`displaced_b_${id}`}
            />

            <feBlend in={`displaced_r_${id}`} in2={`displaced_g_${id}`} mode="screen" result={`rg_${id}`} />
            <feBlend in={`rg_${id}`} in2={`displaced_b_${id}`} mode="screen" result={`displaced_${id}`} />

            {/* 1. 生成一张全局极其鲜艳的变体图 (吸取饱和度参数) */}
            <motion.feColorMatrix
                in={`displaced_${id}`}
                type="saturate"
                values={specularSaturation as any} 
                result={`super_saturated_bg_${id}`}
            />

            {/* 2. 加载你的白色高光蒙版 */}
            <motion.feImage
                href={specularLayerDataUrl}
                x={0}
                y={0}
                width={useTransform(() => (canvasWidth ? getValueOrMotion(canvasWidth) : getValueOrMotion(width)))}
                height={useTransform(() => (canvasHeight ? getValueOrMotion(canvasHeight) : getValueOrMotion(height)))}
                result={`raw_specular_layer_${id}`}
            />
            
            {/* 让他稍微柔和一点点 */}
            <feGaussianBlur in={`raw_specular_layer_${id}`} stdDeviation="0.5" result={`specular_layer_${id}`} />

            {/* 3. 灵魂核心：用高光的形状，把那张超高饱和度的图抠出来 (operator="in") */}
            <feComposite 
                in={`super_saturated_bg_${id}`} 
                in2={`specular_layer_${id}`} 
                operator="in" 
                result={`colored_edge_glow_${id}`} 
            />

            {/* 4. 降低纯白色高光的透明度 */}
            <feComponentTransfer in={`specular_layer_${id}`} result={`specular_white_faded_${id}`}>
                <motion.feFuncA type="linear" slope={specularOpacity} />
            </feComponentTransfer>

            {/* 5. 将鲜艳的边缘色带，盖在正常玻璃的上方 */}
            <feBlend 
                in={`colored_edge_glow_${id}`} 
                in2={`displaced_${id}`} 
                mode="screen" 
                result={`glass_with_colored_edges_${id}`} 
            />

            {/* 6. 最后，把半透明的物理白光高光叠加在最顶层 */}
            <feBlend 
                in={`specular_white_faded_${id}`} 
                in2={`glass_with_colored_edges_${id}`} 
                mode="screen" 
            />
        </filter>
    );

    if (!isMounted) {
        return null;
    }

    return filterOnly ? (
        content
    ) : (
        <svg colorInterpolationFilters="sRGB" style={{ display: 'none' }}>
            <defs>{content}</defs>
        </svg>
    );
});
