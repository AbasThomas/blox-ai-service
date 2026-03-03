import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  iconClassName?: string;
  textClassName?: string;
}

const sizeMap = {
  sm: { icon: 'h-6 w-6', text: 'text-lg' },
  md: { icon: 'h-8 w-8', text: 'text-xl' },
  lg: { icon: 'h-12 w-12', text: 'text-3xl' },
  xl: { icon: 'h-16 w-16', text: 'text-4xl' },
  custom: { icon: '', text: '' }
};

export function Logo({ 
  className = '', 
  iconOnly = false, 
  layout = 'horizontal',
  size = 'md',
  iconClassName = '',
  textClassName = ''
}: LogoProps) {
  const isCol = layout === 'vertical';
  const currentSize = size === 'custom' ? { icon: iconClassName, text: textClassName } : sizeMap[size];
  
  return (
    <div className={`flex ${isCol ? 'flex-col justify-center' : 'flex-row'} items-center ${isCol ? 'gap-2' : 'gap-3'} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${currentSize.icon} ${size !== 'custom' ? iconClassName : ''}`}
      >
        {/* Top-Left Glowing Block */}
        <rect
          x="12"
          y="12"
          width="34"
          height="34"
          rx="10"
          fill="#1ECEFA"
        />
        {/* Top-Right Dark Block */}
        <rect
          x="54"
          y="12"
          width="34"
          height="34"
          rx="10"
          fill="#0B121C"
          stroke="#1A2634"
          strokeWidth="3.5"
        />
        {/* Bottom-Left Dark Block */}
        <rect
          x="12"
          y="54"
          width="34"
          height="34"
          rx="10"
          fill="#0B121C"
          stroke="#1A2634"
          strokeWidth="3.5"
        />
        {/* Bottom-Right Dark Block */}
        <rect
          x="54"
          y="54"
          width="34"
          height="34"
          rx="10"
          fill="#0B121C"
          stroke="#1A2634"
          strokeWidth="3.5"
        />
      </svg>
      {!iconOnly && (
        <span
          className={`text-white font-bold tracking-tight leading-none lowercase ${currentSize.text} ${size !== 'custom' ? textClassName : ''}`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          blox
        </span>
      )}
    </div>
  );
}
