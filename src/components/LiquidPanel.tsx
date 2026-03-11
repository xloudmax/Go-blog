import React, { HTMLAttributes, useRef } from "react";
import { LiquidGlass } from "./LiquidKit/glass";

export interface LiquidPanelProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  scale?: number;
  borderRadius?: number | string;
}

export const LiquidPanel: React.FC<LiquidPanelProps> = ({
  width = '100%',
  height = '100%',
  scale = 35, // Stronger refraction for panels typically
  borderRadius = "24px",
  className = "",
  children,
  ...props
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // LiquidGlass from the UI kit automatically observes dimensions if targetRef is provided
  // or it works as a wrapper perfectly well.
  const { 
    onAnimationStart: _as, 
    onDrag: _d, 
    onDragStart: _ds, 
    onDragEnd: _de, 
    // @ts-expect-error - onPan is not a standard HTML attribute but often passed via framer-motion props
    onPan: _p, 
    // @ts-expect-error - onPanStart is not a standard HTML attribute
    onPanStart: _ps, 
    // @ts-expect-error - onPanEnd is not a standard HTML attribute
    onPanEnd: _pe, 
    ...safeProps 
  } = props as any;

  return (
    <LiquidGlass
      ref={panelRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...props.style
      }}
      blur={0.2}
      glassThickness={scale}
      refractiveIndex={1.5}
      bezelWidth={20}
      specularOpacity={0.4}
      specularSaturation={4}
      {...safeProps}
    >
        {children}
    </LiquidGlass>
  );
};
