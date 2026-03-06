import React, { InputHTMLAttributes } from "react";
import { LiquidSurface } from "./LiquidSurface";

export interface LiquidSearchBoxProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  width?: number | string;
  height?: number | string;
  scale?: number;
}

export const LiquidSearchBox: React.FC<LiquidSearchBoxProps> = ({
  containerClassName = "",
  width = 400,
  height = 70,
  scale = 30, // Default refraction scale. Increase for more distortion!
  className = "",
  ...props
}) => {
  const borderRadius = typeof height === "number" ? height / 2 : "35px";

  return (
    <LiquidSurface
      profile="convex"
      fidelity="high"
      scale={scale}
      width={width}
      height={height}
      borderRadius={borderRadius}
      interactiveLighting={true}
      highlightColor="rgba(255, 255, 255, 0.35)"
      containerClassName={`transition-transform duration-200 hover:scale-[1.02] ${containerClassName}`}
      className="flex items-center box-border px-5"
    >
      <input
        type="text"
        className={`flex-1 bg-transparent border-none outline-none text-lg text-gray-800 font-bold placeholder:text-gray-800/40 drop-shadow-sm w-full ${className}`}
        style={{ textShadow: "0 1px 2px rgba(255,255,255,0.8)", zIndex: 10 }}
        placeholder="Search with Liquid Glass..."
        {...props}
      />
    </LiquidSurface>
  );
};
