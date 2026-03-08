import React, { useEffect, useState } from 'react';
import { MotionValue, motion, useTransform } from 'framer-motion';
import { CONVEX, calculateRefractionSpecular, getDisplacementData, getValueOrMotion } from './liquid-lib';

// function getBezier (bezelType: "convex_circle" | "convex_squircle" | "concave" | "lip") {
//   let surfaceFn;
//   switch (bezelType) {
//     case "convex_circle":
//       surfaceFn = CONVEX_CIRCLE.fn;
//       break;
//     case "convex_squircle":
//       surfaceFn = CONVEX.fn;
//       break;
//     case "concave":
//       surfaceFn = CONCAVE.fn;
//       break;
//     case "lip":
//       surfaceFn = LIP.fn;
//       break;
//     default:
//       surfaceFn = CONVEX.fn;
//   }
//   return surfaceFn;
// }

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
    /**
     * SVG Gauss gradient applied
     * @default 0.2
     */
    blur?: number | MotionValue<number>;
    /**
     * Glass tickess.
     * Bigger this value is, longer will be the translations.
     * @default 40
     */
    glassThickness?: number | MotionValue<number>;
    /**
     * Width of the non-flat glass surface at the boundaries.
     * @default 20
     */
    bezelWidth?: number | MotionValue<number>;
    /**
     * Value used in the snell law: n1 sin(θ1) = n2 sin(θ2)
     * Water is 1.33
     *
     * @default 1.5
     */
    refractiveIndex?: number | MotionValue<number>;
    /**
     * Opacity of the border
     * @default 0.4
     */
    specularOpacity?: number | MotionValue<number>;
    /**
     * @default 4
     */
    specularSaturation?: number | MotionValue<number>;
    dpr?: number | MotionValue<number>;
    /**
     * Set the profile of the edges.
     * @default CONVEX.fn
     */
    bezelHeightFn?: (x: number) => number;
    // bezelType?: 'convex_circle' | 'convex_squircle' | 'concave' | 'lip';
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
    // Hydration fix: only render on client to avoid SSR/client mismatch with dynamic canvas data
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

    const content = (
        <filter id={id} colorInterpolationFilters="sRGB">
            <motion.feGaussianBlur
                in={'SourceGraphic'}
                stdDeviation={typeof blur === 'object' && 'get' in blur ? blur : useTransform(() => blur as number)}
                result={`blurred_source_${id}`}
            />

            {/* Displacement Map Processing: Blur it slightly to avoid 8-bit banding */}
            <motion.feImage
                href={displacementMapDataUrl}
                x={0}
                y={0}
                width={useTransform(() => (canvasWidth ? getValueOrMotion(canvasWidth) : getValueOrMotion(width)))}
                height={useTransform(() => (canvasHeight ? getValueOrMotion(canvasHeight) : getValueOrMotion(height)))}
                result={`raw_displacement_map_${id}`}
            />
            <feGaussianBlur in={`raw_displacement_map_${id}`} stdDeviation="0.5" result={`displacement_map_${id}`} />

            {/* Split RGB channels for chromatic aberration */}
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

            {/* JUICY SATURATION: Real glass looks more saturated due to refraction depth */}
            <feColorMatrix
                in={`displaced_${id}`}
                type="saturate"
                values="3" 
                result={`displaced_saturated_${id}`}
            />

            <motion.feImage
                href={specularLayerDataUrl}
                x={0}
                y={0}
                width={useTransform(() => (canvasWidth ? getValueOrMotion(canvasWidth) : getValueOrMotion(width)))}
                height={useTransform(() => (canvasHeight ? getValueOrMotion(canvasHeight) : getValueOrMotion(height)))}
                result={`raw_specular_layer_${id}`}
            />
            
            {/* Smooth specular to make it look like light diffraction */}
            <feGaussianBlur in={`raw_specular_layer_${id}`} stdDeviation="0.8" result={`specular_layer_${id}`} />

            <feComposite in={`displaced_saturated_${id}`} in2={`specular_layer_${id}`} operator="in" result={`specular_saturated_${id}`} />

            <feComponentTransfer in={`specular_layer_${id}`} result={`specular_faded_${id}`}>
                <motion.feFuncA type="linear" slope={useTransform(() => getValueOrMotion(specularOpacity))} />
            </feComponentTransfer>

            <feComponentTransfer in={`specular_saturated_${id}`} result={`specular_saturated_faded_${id}`}>
                <motion.feFuncA type="linear" slope={useTransform(() => getValueOrMotion(specularOpacity))} />
            </feComponentTransfer>

            <motion.feBlend in={`specular_saturated_faded_${id}`} in2={`displaced_saturated_${id}`} mode="normal" result={`withSaturation_${id}`} />
            <motion.feBlend in={`specular_faded_${id}`} in2={`withSaturation_${id}`} mode="normal" />
        </filter>
    );

    // Return null during SSR to prevent hydration mismatch
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
