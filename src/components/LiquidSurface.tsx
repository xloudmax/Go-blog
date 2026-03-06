import React, { HTMLAttributes, useId, useState, useRef, useEffect, useCallback } from "react";

export type LiquidGlassProfile = "convex" | "convex-circle" | "concave" | "lip" | "flat";
export type LiquidGlassFidelity = "fast" | "high";

export interface LiquidSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  profile?: LiquidGlassProfile;
  fidelity?: LiquidGlassFidelity;
  scale?: number;
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  bezelRatio?: number;
  ior?: number;
  interactiveLighting?: boolean;
  highlightColor?: string;
  specular?: number;
  containerClassName?: string;
  onMapGenerated?: (url: string) => void;
}

// Optimization 1: Global In-Memory Canvas Cache
const displacementMapCache = new Map<string, string>();

export const LiquidSurface: React.FC<LiquidSurfaceProps> = ({
  profile = "convex",
  fidelity = "fast",
  scale = 30,
  width = "100%",
  height = "100%",
  borderRadius = "24px",
  bezelRatio = 0.4,
  ior = 1.5,
  interactiveLighting = false,
  highlightColor = "rgba(255, 255, 255, 0.4)",
  specular = 1.0,
  containerClassName = "",
  className = "",
  children,
  style,
  onMouseMove,
  onMouseLeave,
  onMapGenerated,
  ...props
}) => {
  const filterId = useId().replace(/:/g, "");
  const surfaceRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for interactive light tracking
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // High fidelity mapped Image URL
  const [displacementMapUrl, setDisplacementMapUrl] = useState<string>("");
  const [specularMapUrl, setSpecularMapUrl] = useState<string>("");

  // Optimization 3: Visibility Tracking (IntersectionObserver)
  const [isVisible, setIsVisible] = useState(true);

  // State for checking backdrop-filter support
  const [isSupported, setIsSupported] = useState(true);

  // Measure true dimensions
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports) {
      const supportsBackdrop = CSS.supports("backdrop-filter", "blur(1px)") || 
                               CSS.supports("-webkit-backdrop-filter", "blur(1px)");
      setIsSupported(supportsBackdrop);
    }
  }, []);

  // Optimization 3: Intersection Observer Setup
  useEffect(() => {
    if (!surfaceRef.current) return;
    
    // We only disable heavy filters if it's completely out of view (plus a small margin)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { rootMargin: "100px" } // Load slightly before it comes into view
    );
    
    observer.observe(surfaceRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Optimization 2: Resize Observer Setup (Debounced)
  useEffect(() => {
    if (!surfaceRef.current || fidelity === "fast") return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
          
          resizeTimeoutRef.current = setTimeout(() => {
            setDimensions({
              w: Math.round(entry.contentRect.width),
              h: Math.round(entry.contentRect.height)
            });
          }, 150); // 150ms debounce
        }
      }
    });

    observer.observe(surfaceRef.current);
    
    return () => {
      observer.disconnect();
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [fidelity]);

  // Initial dimension read if string values were passed
  useEffect(() => {
    if (fidelity === "high" && surfaceRef.current) {
        setDimensions({
            w: Math.round(typeof width === "number" ? width : surfaceRef.current.offsetWidth || 200),
            h: Math.round(typeof height === "number" ? height : surfaceRef.current.offsetHeight || 200)
        });
    }
  }, [width, height, fidelity]);

  const generateMap = useCallback(() => {
    if (fidelity === "fast") {
      setDisplacementMapUrl(getSvgRadialGradient(profile));
      return;
    }

    if (dimensions.w === 0 || dimensions.h === 0) return;

    const resDivider = 2; 
    const w = Math.round(Math.max(10, dimensions.w / resDivider));
    const h = Math.round(Math.max(10, dimensions.h / resDivider));

    // Optimization 1: Cache Check
    const radStr2 = String(borderRadius).replace(/px$/, '');
    const rad2 = Number(radStr2) || 0;
    const cacheKey = `${w}x${h}_${profile}_${rad2}_${bezelRatio}_${ior}`;
    if (displacementMapCache.has(cacheKey)) {
        const cachedUrl = displacementMapCache.get(cacheKey)!;
        setDisplacementMapUrl(cachedUrl);
        onMapGenerated?.(cachedUrl);
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setDisplacementMapUrl(getSvgRadialGradient(profile)); 
      return;
    }

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    // Default bezel thickness based on shortest side
    const bezelThickness = Math.min(w, h) * bezelRatio;

    // 1D Cubic Bezier Solver (approximation via Binary Search over T)
    const cubicBezierTolerance = 1e-7;
    const getTForX = (x: number, p1x: number, p2x: number): number => {
      let lower = 0, upper = 1, t = 0.5, currentX = 0;
      for (let i = 0; i < 12; i++) {
        currentX = 3 * Math.pow(1 - t, 2) * t * p1x + 3 * (1 - t) * Math.pow(t, 2) * p2x + Math.pow(t, 3);
        if (Math.abs(currentX - x) < cubicBezierTolerance) break;
        if (currentX < x) lower = t; else upper = t;
        t = (upper + lower) / 2;
      }
      return t;
    };
    const cubicBezierY = (t: number, p1y: number, p2y: number): number => {
      return 3 * Math.pow(1 - t, 2) * t * p1y + 3 * (1 - t) * Math.pow(t, 2) * p2y + Math.pow(t, 3);
    };
    const solveBezier = (x: number, p1x: number, p1y: number, p2x: number, p2y: number): number => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      return cubicBezierY(getTForX(x, p1x, p2x), p1y, p2y);
    };

    // Height profiles f(x), where x is normalized distance inward (0=edge, 1=inner plateau)
    const heightConvex = (x: number) => {
        // Apple Squircle curve mapping: P(0.33, 1.53, 0.69, 0.99)
        return x <= 0.5 
            ? solveBezier(2 * x, 0.33, 1.53, 0.69, 0.99) / 2
            : (2 - solveBezier(2 * (1 - x), 0.33, 1.53, 0.69, 0.99)) / 2;
    };

    // Convex Circle: y = √(1 - (1-x)²) — simple circular arc (kube.io "Convex Circle")
    const heightCircle = (x: number) => {
      const clamped = Math.max(0, Math.min(1, x));
      return Math.sqrt(1 - (1 - clamped) * (1 - clamped));
    };

    const heightConcave = (x: number) => 1 - heightConvex(1 - x);

    const smootherStep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
    const heightLip = (x: number) => {
        const c1 = heightConvex(x);
        const c2 = heightConcave(x);
        const mix = smootherStep(x);
        return c1 * (1 - mix) + c2 * mix;
    };

    let getHeight = heightConvex;
    if (profile === "convex-circle") getHeight = heightCircle;
    else if (profile === "concave") getHeight = heightConcave;
    else if (profile === "lip") getHeight = heightLip;
    else if (profile === "flat") getHeight = () => 1;

    // Max displacement bounds
    const maxDisplacementPx = scale / resDivider; 

    // SDF rounded-rect box dimensions (constant per frame)
    const radStr = String(borderRadius).replace(/px$/, '');
    const rad = Number(radStr) || 0;
    const mappedRad = Math.max(0, rad / resDivider);
    const boxW = Math.max(0, w / 2 - mappedRad);
    const boxH = Math.max(0, h / 2 - mappedRad);
    
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
          
        const x = px - w / 2;
        const y = py - h / 2;
        
        const qx = Math.abs(x) - boxW;
        const qy = Math.abs(y) - boxH;
        
        const lengthQ = Math.sqrt(Math.max(0, qx) * Math.max(0, qx) + Math.max(0, qy) * Math.max(0, qy));
        const sdfDist = lengthQ + Math.min(Math.max(qx, qy), 0.0) - mappedRad;

        const distanceInward = -sdfDist;

        let r = 128, g = 128; 

        if (distanceInward > 0 && distanceInward <= bezelThickness) {
            const normalizedT = distanceInward / bezelThickness;

            // Numeric Derivative (Slope = Refraction Strength)
            const delta = 0.001;
            const y1 = getHeight(Math.max(0, normalizedT - delta));
            const y2 = getHeight(Math.min(1, normalizedT + delta));
            const derivative = (y2 - y1) / (2 * delta); 
            
            const magnitude = derivative * maxDisplacementPx * (ior / 1.5);

            // SDF Gradient (Angle of Refraction)
            const deltaSDF = 0.01;
            const qx1 = Math.abs(x + deltaSDF) - boxW;
            const qy1 = Math.abs(y) - boxH;
            const d1 = Math.sqrt(Math.max(0, qx1)**2 + Math.max(0, qy1)**2) + Math.min(Math.max(qx1, qy1), 0.0) - mappedRad;
            
            const qx2 = Math.abs(x) - boxW;
            const qy2 = Math.abs(y + deltaSDF) - boxH;
            const d2 = Math.sqrt(Math.max(0, qx2)**2 + Math.max(0, qy2)**2) + Math.min(Math.max(qx2, qy2), 0.0) - mappedRad;

            let normalX = (d1 - sdfDist) / deltaSDF;
            let normalY = (d2 - sdfDist) / deltaSDF;
            
            const gradLen = Math.sqrt(normalX * normalX + normalY * normalY);
            if (gradLen > 0) {
                normalX /= gradLen;
                normalY /= gradLen;
            }

            // Project physics vectors onto SVG red/green displacement 8-bit mapping
            const dx = -normalX * magnitude;
            const dy = -normalY * magnitude;

            const normalizedDx = dx / maxDisplacementPx;
            const normalizedDy = dy / maxDisplacementPx;

            r = 128 + normalizedDx * 127;
            g = 128 + normalizedDy * 127;
        }

        const idx = (py * w + px) * 4;
        data[idx] = Math.max(0, Math.min(255, r));     
        data[idx + 1] = Math.max(0, Math.min(255, g)); 
        data[idx + 2] = 128; 
        data[idx + 3] = (sdfDist <= 0) ? 255 : 0; 
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    
    // Generate specular highlight map (same dimensions)
    if (specular > 0) {
      const specCanvas = document.createElement("canvas");
      specCanvas.width = w;
      specCanvas.height = h;
      const specCtx = specCanvas.getContext("2d");
      if (specCtx) {
        const specData = specCtx.createImageData(w, h);
        const sd = specData.data;
        
        // Light direction (top-left, normalized)
        const lightDirX = -0.5;
        const lightDirY = -0.7;
        const lightLen = Math.sqrt(lightDirX * lightDirX + lightDirY * lightDirY);
        const ldx = lightDirX / lightLen;
        const ldy = lightDirY / lightLen;
        
        for (let py2 = 0; py2 < h; py2++) {
          for (let px2 = 0; px2 < w; px2++) {
            const x2 = px2 - w / 2;
            const y2 = py2 - h / 2;
            
            // Recompute SDF for this pixel
            const qx3 = Math.abs(x2) - boxW;
            const qy3 = Math.abs(y2) - boxH;
            const lengthQ3 = Math.sqrt(Math.max(0, qx3) ** 2 + Math.max(0, qy3) ** 2);
            const sdf3 = lengthQ3 + Math.min(Math.max(qx3, qy3), 0.0) - mappedRad;
            const distIn = -sdf3;
            
            let brightness = 0;
            
            if (distIn > 0 && distIn <= bezelThickness) {
              const t = distIn / bezelThickness;
              
              // SDF gradient as normal direction
              const ds = 0.5;
              const qxA = Math.abs(x2 + ds) - boxW;
              const qyA = Math.abs(y2) - boxH;
              const dA = Math.sqrt(Math.max(0, qxA) ** 2 + Math.max(0, qyA) ** 2) + Math.min(Math.max(qxA, qyA), 0.0) - mappedRad;
              const qxB = Math.abs(x2) - boxW;
              const qyB = Math.abs(y2 + ds) - boxH;
              const dB = Math.sqrt(Math.max(0, qxB) ** 2 + Math.max(0, qyB) ** 2) + Math.min(Math.max(qxB, qyB), 0.0) - mappedRad;
              
              let nx = (dA - sdf3) / ds;
              let ny = (dB - sdf3) / ds;
              const nLen = Math.sqrt(nx * nx + ny * ny);
              if (nLen > 0) { nx /= nLen; ny /= nLen; }
              
              // Dot product with light direction (rim light)
              const dot = Math.max(0, -(nx * ldx + ny * ldy));
              
              // Rim falloff: stronger at edges, fading inward
              const rimFactor = 1 - smootherStep(t);
              brightness = dot * rimFactor * specular * 255;
            }
            
            const si = (py2 * w + px2) * 4;
            const bVal = Math.max(0, Math.min(255, brightness));
            sd[si] = bVal;
            sd[si + 1] = bVal;
            sd[si + 2] = bVal;
            sd[si + 3] = (sdf3 <= 0) ? 255 : 0;
          }
        }
        specCtx.putImageData(specData, 0, 0);
        setSpecularMapUrl(specCanvas.toDataURL("image/png"));
      }
    } else {
      setSpecularMapUrl("");
    }
    
    // Save to Cache
    displacementMapCache.set(cacheKey, dataUrl);
    setDisplacementMapUrl(dataUrl);
    onMapGenerated?.(dataUrl);
    
  }, [profile, fidelity, dimensions, borderRadius, scale, bezelRatio, ior, specular, onMapGenerated]);


  useEffect(() => {
    generateMap();
  }, [generateMap]);


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactiveLighting && surfaceRef.current && isVisible) {
      const rect = surfaceRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setLightPos({ x, y });
    }
    onMouseMove?.(e);
  };

  const handleMouseEnter = () => setIsHovering(true);
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovering(false);
    setIsPressed(false);
    setLightPos({ x: 20, y: 20 });
    onMouseLeave?.(e);
  };

  const handlePointerDown = () => setIsPressed(true);

  // Listen for global mouseup/touchend so press releases even if cursor leaves the element
  useEffect(() => {
    if (!isPressed) return;
    const up = () => setIsPressed(false);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [isPressed]);

  // --- Spring Physics for Press Animation ---
  const [springScale, setSpringScale] = useState(1);
  const targetScale = isPressed ? 0.94 : 1; 
  // Use refs to track physics state across frames without triggering effect re-runs
  const physicsState = useRef({ position: 1, velocity: 0 });

  // Simplified critically damped spring
  // F = -k*x - c*v
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const stiffness = 0.04;
    const damping = 0.35; // Slight underdamping for that nice Apple bounce

    const step = (time: number) => {
      // 16ms constraint for stability
      const dt = Math.min((time - lastTime) / 16, 2); 
      lastTime = time;

      const state = physicsState.current;
      const force = (targetScale - state.position) * stiffness;
      state.velocity = (state.velocity + force) * (1 - damping);
      state.position += state.velocity * dt;

      setSpringScale(state.position);

      // Stop animating if we're very close to target and hardly moving
      if (Math.abs(state.velocity) > 0.0001 || Math.abs(targetScale - state.position) > 0.0001) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        state.position = targetScale;
        state.velocity = 0;
        setSpringScale(targetScale);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetScale]);

  const highlightOverlay = interactiveLighting && isVisible ? (
    <div 
      className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-[inherit]"
      style={{
        opacity: isHovering ? 1 : 0.4,
        background: `radial-gradient(circle 80px at ${lightPos.x}% ${lightPos.y}%, ${highlightColor}, transparent 100%)`,
        mixBlendMode: "screen",
        zIndex: 2,
      }}
    />
  ) : null;

  // Render logic based on visibility and support
  let filterStyle = "blur(20px)"; // Default fallback
  if (isSupported) {
      if (isVisible) {
          // Blur is now handled INSIDE the SVG filter for better compositing
          filterStyle = `url(#liquid-glass-filter-${filterId})`;
      } else {
          // Optimization 3: Heavily degrade filter when out of view
          filterStyle = `blur(10px)`; 
      }
  }

  // Press animation values using Spring Physics instead of static CSS
  const pressFilterScale = scale * (1 + (1 - springScale) * 5); // Refraction increases dramatically as you press
  const isPressing = springScale < 0.99;
  
  const pressShadow = isPressing
    ? "inset 0 4px 30px rgba(0, 0, 0, 0.4), inset 0 -2px 8px rgba(255, 255, 255, 0.15), 0 2px 10px rgba(0, 0, 0, 0.3)"
    : (isSupported && isVisible)
      ? "inset 0 4px 15px rgba(255, 255, 255, 0.3), inset 0 -4px 10px rgba(0, 0, 0, 0.1), 0 10px 40px rgba(0, 0, 0, 0.15)"
      : "0 10px 40px rgba(0, 0, 0, 0.1)";

  return (
    <>
      <div
        ref={surfaceRef}
        className={`relative flex items-center box-border ${containerClassName} ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        style={{
          width,
          height,
          borderRadius,
          backdropFilter: filterStyle,
          WebkitBackdropFilter: filterStyle,
          background: isSupported && isVisible
            ? (isPressing ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.05)")
            : "rgba(255, 255, 255, 0.15)",
          border: isPressing ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(255, 255, 255, 0.3)",
          borderTop: isPressing ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: pressShadow,
          transform: `scale(${springScale})`,
          transition: 'box-shadow 0.1s ease, border 0.1s ease, background 0.1s ease', // Only animate non-transform props
          willChange: isVisible ? "transform, filter" : "auto",
          ...style
        }}
        {...props}
      >
        {highlightOverlay}
        <div className="relative z-10 w-full h-full rounded-[inherit] flex items-center">
            {children}
        </div>
      </div>

      {isSupported && isVisible && displacementMapUrl && (
        <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
          <defs>
            <filter
              id={`liquid-glass-filter-${filterId}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              {/* 1. Background Blur (replaces CSS blur for better pipeline integration) */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blurredBg" />

              {/* 2. Color tint & slight desaturation for the glass material feel */}
              {/* Desaturate by ~20%, add slight warm tint (R+ G+) */}
              <feColorMatrix 
                in="blurredBg" 
                type="matrix" 
                values="0.8  0.1  0.1  0  0.03
                        0.1  0.8  0.1  0  0.02
                        0.1  0.1  0.8  0  0.00
                        0    0    0    1  0" 
                result="tintedBg" 
              />

              {/* 3. Refraction using Displacement Map */}
              <feImage href={displacementMapUrl} result="displacementMap" preserveAspectRatio="none" />
              <feDisplacementMap
                in="tintedBg"
                in2="displacementMap"
                scale={pressFilterScale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="refracted"
              />

              {/* 4. Specular Highlight Addition */}
              {specularMapUrl ? (
                <>
                  <feImage href={specularMapUrl} result="specularMap" preserveAspectRatio="none" />
                  <feBlend in="refracted" in2="specularMap" mode="screen" result="glassWithHighlight" />
                </>
              ) : (
                <feMerge result="glassWithHighlight">
                  <feMergeNode in="refracted" />
                </feMerge>
              )}

              {/* 5. Edge Masking / Feathering */}
              {/* Extract the alpha channel of the displacement map to mask the final effect */}
              {/* The displacement map already has alpha=0 where sdf > 0 */}
              <feColorMatrix 
                in="displacementMap" 
                type="matrix" 
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0" 
                result="hardEdgeMask" 
              />
              <feGaussianBlur in="hardEdgeMask" stdDeviation="0.75" result="softEdgeMask" />
              
              <feComposite 
                in="glassWithHighlight" 
                in2="softEdgeMask" 
                operator="in" 
                result="finalGlass" 
              />

              {/* Also composite back original graphic with lower opacity just for mixing */}
              <feMerge>
                <feMergeNode in="finalGlass" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      )}
    </>
  );
};

// Extracted legacy fallback logic
const getSvgRadialGradient = (profile: LiquidGlassProfile) => {
  let stops = "";
  switch (profile) {
    case "convex":
      stops = `%3Cstop offset='0%25' stop-color='rgb(128,128,128)'/%3E` +
              `%3Cstop offset='100%25' stop-color='rgb(255,255,255)'/%3E`;
      break;
    case "concave":
      stops = `%3Cstop offset='0%25' stop-color='rgb(0,0,0)'/%3E` +
              `%3Cstop offset='100%25' stop-color='rgb(128,128,128)'/%3E`;
      break;
    case "lip":
      stops = `%3Cstop offset='0%25' stop-color='rgb(0,0,0)'/%3E` +
              `%3Cstop offset='60%25' stop-color='rgb(128,128,128)'/%3E` +
              `%3Cstop offset='100%25' stop-color='rgb(255,255,255)'/%3E`;
      break;
    case "flat":
    default:
      stops = `%3Cstop offset='0%25' stop-color='rgb(128,128,128)'/%3E` +
              `%3Cstop offset='100%25' stop-color='rgb(128,128,128)'/%3E`;
      break;
  }
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E` +
         `%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='50%25' r='50%25'%3E` +
         stops +
         `%3C/radialGradient%3E%3C/defs%3E` +
         `%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E`;
};
