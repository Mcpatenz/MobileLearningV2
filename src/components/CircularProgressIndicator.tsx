import React from 'react';
import { Check } from 'lucide-react';

export interface CircularProgressIndicatorProps {
  percentage: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showLabel?: boolean;
  colorMode?: 'dynamic' | 'emerald' | 'teal' | 'indigo' | 'amber';
  sublabel?: string;
  className?: string;
}

export const CircularProgressIndicator: React.FC<CircularProgressIndicatorProps> = ({
  percentage,
  size = 'md',
  strokeWidth,
  showLabel = true,
  colorMode = 'dynamic',
  sublabel,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));

  // Size configurations (pixels)
  const sizeMap = {
    xs: { dim: 28, stroke: strokeWidth ?? 3, text: 'text-[9px]', sub: 'text-[7px]' },
    sm: { dim: 36, stroke: strokeWidth ?? 3.5, text: 'text-[10px]', sub: 'text-[8px]' },
    md: { dim: 48, stroke: strokeWidth ?? 4, text: 'text-xs', sub: 'text-[9px]' },
    lg: { dim: 64, stroke: strokeWidth ?? 5, text: 'text-sm font-bold', sub: 'text-[10px]' },
    xl: { dim: 80, stroke: strokeWidth ?? 6, text: 'text-base font-bold', sub: 'text-xs' },
  };

  const config = sizeMap[size];
  const radius = (config.dim - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  // Determine stroke color
  const getColorClass = () => {
    if (colorMode !== 'dynamic') {
      const map = {
        emerald: 'text-emerald-500 dark:text-emerald-400',
        teal: 'text-teal-500 dark:text-teal-400',
        indigo: 'text-indigo-500 dark:text-indigo-400',
        amber: 'text-amber-500 dark:text-amber-400',
      };
      return map[colorMode] || 'text-emerald-500';
    }

    if (clamped >= 100) return 'text-emerald-600 dark:text-emerald-400';
    if (clamped >= 75) return 'text-emerald-500 dark:text-emerald-400';
    if (clamped >= 40) return 'text-teal-500 dark:text-teal-400';
    if (clamped > 0) return 'text-amber-500 dark:text-amber-400';
    return 'text-slate-300 dark:text-slate-700';
  };

  return (
    <div
      className={`inline-flex flex-col items-center justify-center shrink-0 ${className}`}
      title={`${clamped}% completed`}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: config.dim, height: config.dim }}
      >
        <svg
          className="w-full h-full -rotate-90"
          viewBox={`0 0 ${config.dim} ${config.dim}`}
        >
          {/* Track Background */}
          <circle
            className="text-slate-200/80 dark:text-slate-800"
            strokeWidth={config.stroke}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={config.dim / 2}
            cy={config.dim / 2}
          />
          {/* Animated Progress Ring */}
          <circle
            className={`${getColorClass()} transition-all duration-700 ease-out`}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={config.dim / 2}
            cy={config.dim / 2}
          />
        </svg>

        {showLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {clamped === 100 && (size === 'md' || size === 'lg' || size === 'xl') ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
            ) : (
              <span
                className={`font-mono font-bold leading-none ${config.text} text-slate-800 dark:text-white`}
              >
                {clamped}%
              </span>
            )}
            {sublabel && (
              <span className={`font-mono text-slate-400 leading-none mt-0.5 ${config.sub}`}>
                {sublabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
