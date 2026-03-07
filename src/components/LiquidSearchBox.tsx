import React, { InputHTMLAttributes } from "react";
import { LiquidGlass } from "./LiquidKit/glass";

export interface LiquidSearchBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'width' | 'height' | 'size'> {
  containerClassName?: string;
  inputClassName?: string;
  onSearch?: (value: string) => void;
  width?: number | string;
  height?: number | string;
  scale?: number;
  bezelWidth?: number;
  refractiveIndex?: number;
  specularOpacity?: number;
  blur?: number;
  children?: React.ReactNode;
}

export const LiquidSearchBox: React.FC<LiquidSearchBoxProps> = React.memo(({
  containerClassName = "",
  inputClassName = "",
  width = 400,
  height = 70,
  scale = 20, // Reduced from 30
  bezelWidth = 12, // Reduced from 25
  refractiveIndex = 1.2, // Reduced from 1.5
  specularOpacity = 0.4, // Reduced from 1.0
  blur = 0.3,
  className = "",
  children,
  ...props
}) => {
  const borderRadius = typeof height === "number" ? height / 2 : "35px";

  return (
    <div className={`transition-transform duration-200 ${containerClassName}`}>
      <LiquidGlass
        blur={blur}
        glassThickness={scale}
        refractiveIndex={refractiveIndex}
        bezelWidth={bezelWidth}
        specularOpacity={specularOpacity}
        specularSaturation={specularOpacity > 0 ? 5 : 0}
        style={{
          width,
          height,
          borderRadius
        }}
        className={`flex items-center box-border px-5 gap-2 ${className}`}
      >
        <input
          type="text"
          className={`flex-1 bg-transparent border-none outline-none text-lg font-bold w-full text-black dark:text-white placeholder-slate-500 dark:placeholder-white/40 ${inputClassName}`}
          style={{ zIndex: 10 }}
          placeholder="Search with Liquid Glass..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && props.onSearch) {
              props.onSearch(String(props.value || ''));
            }
          }}
          {...props}
        />
        {children && <div style={{ zIndex: 20 }}>{children}</div>}
      </LiquidGlass>
    </div>
  );
});
