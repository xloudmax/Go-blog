import React, { HTMLAttributes } from "react";
import { LiquidSurface } from "./LiquidSurface";

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
  return (
    <LiquidSurface
      profile="convex"
      fidelity="high"
      scale={scale}
      width={width}
      height={height}
      borderRadius={borderRadius}
      interactiveLighting={true}
      highlightColor="rgba(255, 255, 255, 0.4)"
      className={className}
      {...props}
    >
        {children}
    </LiquidSurface>
  );
};
