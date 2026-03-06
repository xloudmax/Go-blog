import React, { useState, useRef, useCallback, useEffect, useId } from 'react';

export interface LiquidMagnifierProps {
  /** Width of the lens */
  width?: number;
  /** Height of the lens */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Bezel ratio (0-1) */
  bezelRatio?: number;
  /** Refraction scale for bezel */
  scale?: number;
  /** IOR / glass thickness */
  ior?: number;
  /** Specular intensity */
  specular?: number;
  /** Additional className for the outer container */
  className?: string;
}

/**
 * LiquidMagnifier — A draggable magnifying lens with dual displacement maps.
 * One map for bezel refraction, one for center zoom.
 * Must be placed inside a `position: relative` container.
 */
export const LiquidMagnifier: React.FC<LiquidMagnifierProps> = ({
  width = 200,
  height = 120,
  borderRadius = 60,
  bezelRatio = 0.5,
  scale = 9,
  ior = 1.5,
  specular = 1.0,
  className = '',
}) => {
  const filterId = useId().replace(/:/g, '');
  const lensRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Displacement map URLs
  const [refractionMapUrl, setRefractionMapUrl] = useState('');
  const [zoomMapUrl, setZoomMapUrl] = useState('');

  // Generate both displacement maps
  const generateMaps = useCallback(() => {
    const resDivider = 2;
    const w = Math.round(Math.max(10, width / resDivider));
    const h = Math.round(Math.max(10, height / resDivider));
    const rad = Math.max(0, borderRadius / resDivider);
    const boxW = Math.max(0, w / 2 - rad);
    const boxH = Math.max(0, h / 2 - rad);
    const bezelThickness = Math.min(w, h) * bezelRatio;

    // Height functions
    const solveBez = (x: number): number => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let lower = 0, upper = 1, t = 0.5;
      for (let i = 0; i < 12; i++) {
        const cx = 3*(1-t)**2*t*0.33 + 3*(1-t)*t**2*0.69 + t**3;
        if (Math.abs(cx - x) < 1e-7) break;
        if (cx < x) lower = t; else upper = t;
        t = (upper + lower) / 2;
      }
      return 3*(1-t)**2*t*1.53 + 3*(1-t)*t**2*0.99 + t**3;
    };
    const heightConvex = (x: number) =>
      x <= 0.5 ? solveBez(2*x)/2 : (2-solveBez(2*(1-x)))/2;

    const sdfRoundedRect = (px: number, py: number) => {
      const qx = Math.abs(px) - boxW;
      const qy = Math.abs(py) - boxH;
      return Math.sqrt(Math.max(0,qx)**2 + Math.max(0,qy)**2) + Math.min(Math.max(qx,qy),0) - rad;
    };

    // ---------- Map 1: Bezel Refraction ----------
    const canvas1 = document.createElement('canvas');
    canvas1.width = w; canvas1.height = h;
    const ctx1 = canvas1.getContext('2d')!;
    const img1 = ctx1.createImageData(w, h);
    const d1 = img1.data;
    const maxDisp = scale / resDivider;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const x = px - w/2, y = py - h/2;
        const sdf = sdfRoundedRect(x, y);
        const distIn = -sdf;
        let r = 128, g = 128;

        if (distIn > 0 && distIn <= bezelThickness) {
          const t = distIn / bezelThickness;
          const delta = 0.001;
          const dy1 = heightConvex(Math.max(0, t-delta));
          const dy2 = heightConvex(Math.min(1, t+delta));
          const derivative = (dy2-dy1) / (2*delta);
          const mag = derivative * maxDisp * (ior / 1.5);

          // SDF gradient
          const ds = 0.01;
          const nx = (sdfRoundedRect(x+ds,y) - sdf) / ds;
          const ny = (sdfRoundedRect(x,y+ds) - sdf) / ds;
          const nLen = Math.sqrt(nx*nx + ny*ny) || 1;
          const dx = -(nx/nLen) * mag;
          const dy = -(ny/nLen) * mag;
          r = 128 + (dx/maxDisp)*127;
          g = 128 + (dy/maxDisp)*127;
        }
        const i = (py*w+px)*4;
        d1[i] = Math.max(0, Math.min(255, r));
        d1[i+1] = Math.max(0, Math.min(255, g));
        d1[i+2] = 128;
        d1[i+3] = sdf <= 0 ? 255 : 0;
      }
    }
    ctx1.putImageData(img1, 0, 0);
    setRefractionMapUrl(canvas1.toDataURL('image/png'));

    // ---------- Map 2: Center Zoom ----------
    const canvas2 = document.createElement('canvas');
    canvas2.width = w; canvas2.height = h;
    const ctx2 = canvas2.getContext('2d')!;
    const img2 = ctx2.createImageData(w, h);
    const d2 = img2.data;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const x = px - w/2, y = py - h/2;
        const sdf = sdfRoundedRect(x, y);
        let r = 128, g = 128;

        if (sdf <= 0) {
          // Push all interior pixels inward (zoom effect)
          const cx = x / (w/2);
          const cy = y / (h/2);
          // Radial inward displacement
          r = 128 + cx * 40;
          g = 128 + cy * 40;
        }
        const i = (py*w+px)*4;
        d2[i] = Math.max(0, Math.min(255, r));
        d2[i+1] = Math.max(0, Math.min(255, g));
        d2[i+2] = 128;
        d2[i+3] = sdf <= 0 ? 255 : 0;
      }
    }
    ctx2.putImageData(img2, 0, 0);
    setZoomMapUrl(canvas2.toDataURL('image/png'));

  }, [width, height, borderRadius, bezelRatio, scale, ior]);

  useEffect(() => { generateMaps(); }, [generateMaps]);

  // --- Spring Physics for Press/Drag Animation ---
  const [springScale, setSpringScale] = useState(1);
  const targetScale = isDragging ? 1.05 : 1.0; 
  const physicsState = useRef({ position: 1, velocity: 0 });

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const stiffness = 0.04;
    const damping = 0.35; // Slight underdamping for bouncy drag start/stop

    const step = (time: number) => {
      const dt = Math.min((time - lastTime) / 16, 2); 
      lastTime = time;

      const state = physicsState.current;
      const force = (targetScale - state.position) * stiffness;
      state.velocity = (state.velocity + force) * (1 - damping);
      state.position += state.velocity * dt;

      setSpringScale(state.position);

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

  // ─── Drag handlers ───
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // For specular highlight tracking

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = lensRef.current?.parentElement?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    }
    
    // Update local mouse pos for highlight
    const lensRect = lensRef.current?.getBoundingClientRect();
    if (lensRect) {
      setMousePos({ 
        x: ((e.clientX - lensRect.left) / lensRect.width) * 100, 
        y: ((e.clientY - lensRect.top) / lensRect.height) * 100 
      });
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const parent = lensRef.current?.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const newX = Math.max(0, Math.min(parentRect.width - width, e.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(parentRect.height - height, e.clientY - dragOffset.current.y));
    setPos({ x: newX, y: newY });

    // Update highlight
    const lensRect = lensRef.current?.getBoundingClientRect();
    if (lensRect) {
      setMousePos({ 
        x: ((e.clientX - lensRect.left) / lensRect.width) * 100, 
        y: ((e.clientY - lensRect.top) / lensRect.height) * 100 
      });
    }
  }, [isDragging, width, height]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Specular highlight tracks finger/mouse when dragging, returns to center when resting
  const specularOpacity = specular * (isDragging ? 0.8 : 0.4);
  const lightX = isDragging ? mousePos.x : 30;
  const lightY = isDragging ? mousePos.y : 20;

  return (
    <>
      <div
        ref={lensRef}
        className={`absolute cursor-grab active:cursor-grabbing select-none ring-1 ring-black/10 dark:ring-white/10 ${className}`}
        style={{
          left: pos.x,
          top: pos.y,
          width,
          height,
          borderRadius,
          backdropFilter: refractionMapUrl ? `url(#magnifier-refraction-${filterId}) url(#magnifier-zoom-${filterId}) blur(0.5px)` : 'blur(10px)',
          WebkitBackdropFilter: refractionMapUrl ? `url(#magnifier-refraction-${filterId}) url(#magnifier-zoom-${filterId}) blur(0.5px)` : 'blur(10px)',
          background: 'rgba(255,255,255,0.03)',
          boxShadow: isDragging
            ? 'rgba(0, 0, 0, 0.3) 0px 15px 30px, rgba(0, 0, 0, 0.2) 0px 2px 24px inset, rgba(255, 255, 255, 0.3) 0px -2px 24px inset'
            : 'rgba(0, 0, 0, 0.16) 0px 4px 9px, rgba(0, 0, 0, 0.2) 0px 2px 24px inset, rgba(255, 255, 255, 0.2) 0px -2px 24px inset',
          transform: `scale(${springScale})`, // Physics driven scale
          transition: 'box-shadow 0.2s ease, filter 0.1s ease', // Only animate non-transform properties
          zIndex: isDragging ? 100 : 10,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Specular highlight */}
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-200"
          style={{
            background: `radial-gradient(ellipse 80% 60% at ${lightX}% ${lightY}%, rgba(255,255,255,${specularOpacity}), transparent 70%)`,
            mixBlendMode: 'screen',
            transition: 'background 0.1s ease', // Smooth out mouse tracking slightly
          }}
        />
        {/* Drag handle indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/20" />
      </div>

      {/* SVG Filters */}
      {refractionMapUrl && (
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
          <defs>
            <filter id={`magnifier-refraction-${filterId}`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
              <feImage href={refractionMapUrl} result="refrMap" preserveAspectRatio="none" />
              <feDisplacementMap in="SourceGraphic" in2="refrMap" scale={scale} xChannelSelector="R" yChannelSelector="G" />
            </filter>
            {zoomMapUrl && (
              <filter id={`magnifier-zoom-${filterId}`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                <feImage href={zoomMapUrl} result="zoomMap" preserveAspectRatio="none" />
                <feDisplacementMap in="SourceGraphic" in2="zoomMap" scale={scale * 2} xChannelSelector="R" yChannelSelector="G" />
              </filter>
            )}
          </defs>
        </svg>
      )}
    </>
  );
};
