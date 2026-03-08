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

// Helper for smootherstep interpolation as used in the article's LIP profile
function smootherstep(edge0: number, edge1: number, x: number): number {
    x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return x * x * x * (x * (x * 6 - 15) + 10);
}

// --- Profiles from the article ---

export const CONVEX_CIRCLE = {
    fn: (x: number) => Math.sqrt(1 - Math.pow(1 - x, 2)),
};

export const CONVEX_SQUIRCLE = {
    // y = (1 - (1-x)^4)^(1/4)
    fn: (x: number) => Math.pow(1 - Math.pow(Math.max(0, 1 - x), 4), 0.25),
};

export const CONCAVE = {
    fn: (x: number) => 1 - Math.sqrt(1 - Math.pow(1 - x, 2)),
};

export const LIP = {
    // y = mix(Convex(x), Concave(x), Smootherstep(x))
    fn: (x: number) => {
        const cv = CONVEX_CIRCLE.fn(x);
        const cc = CONCAVE.fn(x);
        const t = smootherstep(0, 1, x);
        return cv * (1 - t) + cc * t;
    }
};

export const CONVEX = CONVEX_SQUIRCLE;

// --- Core Math ---

export function getRoundedDistance(x: number, y: number, w: number, h: number, r: number): number {
    const px = Math.abs(x - w / 2) - (w / 2 - r);
    const py = Math.abs(y - h / 2) - (h / 2 - r);
    const dx = Math.max(px, 0);
    const dy = Math.max(py, 0);
    const distToCorner = Math.sqrt(dx * dx + dy * dy);
    const outsideDist = distToCorner - r;
    const insideDist = Math.min(Math.max(px, py), 0);
    return -(outsideDist + insideDist);
}

/**
 * Advanced physical refraction simulation based on Snell's Law
 */
export function getDisplacementData(config: any): DisplacementData | null {
    if (typeof window === 'undefined') return null;
    const { canvasWidth, canvasHeight, glassThickness = 40, bezelWidth = 20, radius, bezelHeightFn = CONVEX.fn, dpr = 1 } = config;
    const w = Math.floor(canvasWidth * dpr);
    const h = Math.floor(canvasHeight * dpr);
    const r = radius * dpr;
    const b = bezelWidth * dpr;
    const n = 1.5; // Index of refraction
    
    if (w <= 0 || h <= 0) return null;

    const data = new Uint8ClampedArray(w * h * 4);
    const step = 1;
    let maxDispMagnitude = 0;

    // First pass: Calculate physical displacements and store them
    // We'll normalize them later to fit in the 8-bit SVG map
    const displacements = new Float32Array(w * h * 2);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 2;
            
            const dist = getRoundedDistance(x, y, w, h, r);
            const normDist = Math.max(0, Math.min(1, dist / b));
            
            // 1. Get height and gradient
            const h0 = bezelHeightFn(normDist);
            const distR = getRoundedDistance(x + step, y, w, h, r);
            const distD = getRoundedDistance(x, y + step, w, h, r);
            const hR = bezelHeightFn(Math.max(0, Math.min(1, distR / b)));
            const hD = bezelHeightFn(Math.max(0, Math.min(1, distD / b)));

            const slopeX = (hR - h0) / step;
            const slopeY = (hD - h0) / step;

            // 2. Physical Refraction Math (Simplified Snell's Law Ray Tracing)
            // theta1 = angle of incidence relative to surface normal
            const theta1X = Math.atan(slopeX);
            const theta1Y = Math.atan(slopeY);

            // n1 sin(theta1) = n2 sin(theta2) -> sin(theta2) = sin(theta1) / n
            const theta2X = Math.asin(Math.sin(theta1X) / n);
            const theta2Y = Math.asin(Math.sin(theta1Y) / n);

            // Refraction displacement angle: alpha = theta1 - theta2
            const alphaX = theta1X - theta2X;
            const alphaY = theta1Y - theta2Y;

            // Horizontal displacement = Height * tan(alpha)
            // Height at this point is the glass volume height
            const heightAtPoint = h0 * glassThickness;
            const dispX = heightAtPoint * Math.tan(alphaX);
            const dispY = heightAtPoint * Math.tan(alphaY);

            displacements[idx] = dispX;
            displacements[idx + 1] = dispY;

            const mag = Math.sqrt(dispX * dispX + dispY * dispY);
            if (mag > maxDispMagnitude) maxDispMagnitude = mag;
        }
    }

    // Second pass: Normalize and pack into ImageData
    // SVG feDisplacementMap scale attribute will do the final multiplication
    const finalScale = maxDispMagnitude || 1;
    for (let i = 0; i < w * h; i++) {
        const dIdx = i * 2;
        const cIdx = i * 4;
        
        // Map [-1, 1] range to [0, 255]
        // (val / finalScale) is in [-1, 1]
        data[cIdx]     = 128 + (displacements[dIdx] / finalScale) * 127;
        data[cIdx + 1] = 128 + (displacements[dIdx + 1] / finalScale) * 127;
        data[cIdx + 2] = 128;
        data[cIdx + 3] = 255;
    }

    return {
        displacementMap: new ImageData(data, w, h),
        maximumDisplacement: finalScale,
    };
}

/**
 * Directional Specular with Fresnel approximation
 */
export function calculateRefractionSpecular(
    width: number,
    height: number,
    radius: number,
    intensity: number = 50,
    bezelWidth: number = 20,
    dpr: number = 1
): ImageData | null {
    if (typeof window === 'undefined') return null;
    const w = Math.floor(width * dpr);
    const h = Math.floor(height * dpr);
    const r = radius * dpr;
    const b = bezelWidth * dpr;
    const lightDir = { x: -0.707, y: -0.707 }; // Top-Left
    
    if (w <= 0 || h <= 0) return null;

    const data = new Uint8ClampedArray(w * h * 4);
    
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            
            const dist = getRoundedDistance(x, y, w, h, r);
            if (dist > b || dist < 0) continue;

            const distL = getRoundedDistance(x - 1, y, w, h, r);
            const distR = getRoundedDistance(x + 1, y, w, h, r);
            const distU = getRoundedDistance(x, y - 1, w, h, r);
            const distD = getRoundedDistance(x, y + 1, w, h, r);

            const nx = (distR - distL) / 2;
            const ny = (distD - distU) / 2;
            const len = Math.sqrt(nx * nx + ny * ny) || 0.001;
            
            const dot = (nx / len) * lightDir.x + (ny / len) * lightDir.y;
            
            // Fresnel effect: reflectivity increases at glancing angles
            const viewDirZ = 1.0; 
            const cosTheta = Math.abs(ny / len); // Very simple approximation
            const fresnel = Math.pow(1.0 - cosTheta, 3);
            
            const edgeMask = Math.pow(1 - dist / b, 1.5);
            const val = Math.max(0, dot) * edgeMask * (1.0 + fresnel * 2.0);
            
            const finalAlpha = Math.min(255, val * 255 * (intensity / 100));
            
            data[idx] = 255;
            data[idx + 1] = 255;
            data[idx + 2] = 255;
            data[idx + 3] = finalAlpha;
        }
    }
    
    return new ImageData(data, w, h);
}
