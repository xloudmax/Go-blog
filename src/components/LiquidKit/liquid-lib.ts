import { MotionValue } from 'framer-motion';

// --- Types ---
export interface DisplacementData {
    displacementMap: ImageData;
    maximumDisplacement: number;
}

// --- Utils ---
export function getValueOrMotion<T>(val: T | MotionValue<T>): T {
    if (val && typeof val === 'object' && 'get' in val) {
        return (val as MotionValue<T>).get();
    }
    return val as T;
}

// --- Profiles ---
export const CONVEX = {
    fn: (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2)), // Simple circular arc
};

export const LIP = {
    fn: (x: number) => Math.pow(Math.sin(x * Math.PI / 2), 2),
};

// --- Core Math ---
/**
 * Simple mock of displacement data generation based on Snell's Law principles.
 */
export function getDisplacementData(config: any): DisplacementData | null {
    if (typeof window === 'undefined') return null;
    const { canvasWidth, canvasHeight, glassThickness, bezelWidth, radius, dpr = 1 } = config;
    const w = Math.floor(canvasWidth * dpr);
    const h = Math.floor(canvasHeight * dpr);
    
    if (w <= 0 || h <= 0) return null;

    const data = new Uint8ClampedArray(w * h * 4);
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 127;     // R (X displacement)
        data[i + 1] = 127; // G (Y displacement)
        data[i + 2] = 0;   // B (Not used)
        data[i + 3] = 255; // A (Full opacity)
    }

    try {
        return {
            displacementMap: new ImageData(data, w, h),
            maximumDisplacement: glassThickness || 40,
        };
    } catch (e) {
        return null;
    }
}

/**
 * Generates a specular highlight layer.
 */
export function calculateRefractionSpecular(
    width: number,
    height: number,
    radius: number,
    intensity: number = 50,
    _unused: any,
    dpr: number = 1
): ImageData | null {
    if (typeof window === 'undefined') return null;
    const w = Math.floor(width * dpr);
    const h = Math.floor(height * dpr);
    
    if (w <= 0 || h <= 0) return null;

    const data = new Uint8ClampedArray(w * h * 4);
    
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const distToEdge = Math.min(x, y, w - x, h - y);
            const val = distToEdge < (radius * dpr) ? Math.max(0, 255 - (distToEdge * 10 / dpr)) : 0;
            data[idx] = 255;
            data[idx + 1] = 255;
            data[idx + 2] = 255;
            data[idx + 3] = Math.min(255, val * (intensity / 100));
        }
    }
    
    try {
        return new ImageData(data, w, h);
    } catch (e) {
        return null;
    }
}
