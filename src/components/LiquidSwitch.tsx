import React, { InputHTMLAttributes, useState } from "react";
import { LiquidSurface } from "./LiquidSurface";

export interface LiquidSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'width' | 'height'> {
  containerClassName?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  scale?: number;
}

export const LiquidSwitch: React.FC<LiquidSwitchProps> = ({
  containerClassName = "",
  checked,
  defaultChecked = false,
  onCheckedChange,
  scale = 20
}) => {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = isControlled ? checked : internalChecked;

  const handleToggle = () => {
    const newValue = !isChecked;
    if (!isControlled) {
      setInternalChecked(newValue);
    }
    onCheckedChange?.(newValue);
  };

  return (
    <div
      className={`relative inline-block box-border select-none transition-colors duration-300 ${containerClassName}`}
      onClick={handleToggle}
      style={{
        width: 160,
        height: 67,
        borderRadius: 33.5,
        backgroundColor: isChecked ? "rgba(59, 191, 78, 0.933)" : "rgba(120, 120, 128, 0.16)", // Apple iOS default offish color
        cursor: "pointer",
      }}
      role="switch"
      aria-checked={isChecked}
    >
      <LiquidSurface
        profile="lip"
        scale={scale} // Using the prop instead of hardcoded 50
        ior={1.0} // Ensure it doesn't shrink inside
        bezelRatio={0.5} // Lip relies on high bezel
        interactiveLighting={false}
        width={146}
        height={92}
        borderRadius={46}
        className="absolute top-1/2 -translate-y-1/2 transition-transform duration-300 pointer-events-none"
        style={{
          // Thumb offset math: 
          // Off: margin-left -21.95 on left side
          // On: translateX(57.9)
          left: 0,
          marginLeft: -21.95,
          transform: `translateX(${isChecked ? 57.9 : 0}px) translateY(-50%) scale(0.9)`,
          backgroundColor: "rgba(255, 255, 255, 0.098)",
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 22px",
          border: 'none', // Override LiquidSurface default border
          borderTop: 'none',
        }}
      >
        {/* The thumb itself has no content, it just refracts the green/grey background and drops a shadow */}
      </LiquidSurface>
      
      {/* Hidden input for forms */}
      <input
        type="checkbox"
        className="sr-only"
        checked={isChecked}
        onChange={handleToggle}
      />
    </div>
  );
};
