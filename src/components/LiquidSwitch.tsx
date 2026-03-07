import React, { InputHTMLAttributes, useState } from "react";
import { LiquidSwitch as UILiquidSwitch } from "./LiquidKit/switch";

export interface LiquidSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'width' | 'height' | 'size' | 'className'> {
  containerClassName?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  scale?: number;
}

export const LiquidSwitch: React.FC<LiquidSwitchProps> = React.memo(({
  containerClassName = "",
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  ...rest
}) => {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = isControlled ? checked : internalChecked;

  const handleCheckedChange = (newValue: boolean) => {
    if (!isControlled) {
      setInternalChecked(newValue);
    }
    onCheckedChange?.(newValue);
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${containerClassName}`}>
      <UILiquidSwitch
        checked={isChecked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        slider={{ width: 160, height: 67 }}
        thumb={{ width: 146, height: 92 }}
        refractiveIndex={1.2}
      />
      
      {/* Hidden input for forms */}
      <input
        type="checkbox"
        className="sr-only"
        checked={isChecked}
        disabled={disabled}
        onChange={(e) => handleCheckedChange(e.target.checked)}
        {...rest}
      />
    </div>
  );
});
