import React, { useState, useRef, MouseEvent, TouchEvent } from "react";
import { LiquidSurface } from "./LiquidSurface";

export interface LiquidSliderProps {
  containerClassName?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  width?: number | string;
  height?: number | string;
  scale?: number;
}

export const LiquidSlider: React.FC<LiquidSliderProps> = ({
  containerClassName = "",
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  width = 300,
  height = 40,
  scale = 20,
}) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value : internalValue;
  
  const trackRef = useRef<HTMLDivElement>(null);

  const handleUpdate = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let newValue = min + percent * (max - min);
    
    // Snapping to steps
    if (step > 0) {
      newValue = Math.round(newValue / step) * step;
    }
    newValue = Math.max(min, Math.min(max, newValue));

    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const handleMouseDown = (e: MouseEvent) => {
    handleUpdate(e.clientX);
    
    const handleMouseMove = (mouseEvent: globalThis.MouseEvent) => {
      handleUpdate(mouseEvent.clientX);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: TouchEvent) => {
    handleUpdate(e.touches[0].clientX);
    
    const handleTouchMove = (touchEvent: globalThis.TouchEvent) => {
      handleUpdate(touchEvent.touches[0].clientX);
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const fillPercentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <LiquidSurface
      profile="convex"
      scale={scale}
      width={width}
      height={height}
      borderRadius={typeof height === "number" ? height / 2 : "20px"}
      containerClassName={`cursor-pointer transition-transform duration-200 hover:scale-[1.02] ${containerClassName}`}
      className="overflow-hidden block"
      interactiveLighting={false} // Sliders look better without the interactive highlight overriding the track color usually
    >
      <div
          ref={trackRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
      >
        {/* Active fill track */}
        <div 
            className="absolute top-0 left-0 h-full bg-white/40 shadow-[inset_0_-2px_10px_rgba(255,255,255,0.5)] transition-all duration-75"
            style={{ width: `${fillPercentage}%` }}
        />
        
        {/* Thumb indicator (Subtle) */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border border-gray-200/50 flex justify-center items-center pointer-events-none transition-all duration-75"
            style={{ left: `calc(${fillPercentage}% - 12px)` }}
        >
            <div className="w-2 h-2 rounded-full bg-slate-400" />
        </div>
      </div>
    </LiquidSurface>
  );
};
