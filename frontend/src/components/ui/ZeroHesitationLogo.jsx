import React from 'react';
import { BRAND } from '@/lib/brand';

/**
 * Daily Commit mark: four heatmap cells, the newest one lit in the brand blue.
 * It is the same cell the product uses to mark a solved day.
 */
export const ZeroHesitationEmblem = ({ size = 20, className = '' }) => (
  <svg
    viewBox="0 0 20 20"
    width={size}
    height={size}
    fill="none"
    aria-hidden
    className={`flex-shrink-0 ${className}`}
  >
    <rect x="1" y="1" width="8" height="8" rx="2" fill="currentColor" opacity="0.22" />
    <rect x="11" y="1" width="8" height="8" rx="2" fill="currentColor" opacity="0.45" />
    <rect x="1" y="11" width="8" height="8" rx="2" fill="currentColor" opacity="0.7" />
    <rect x="11" y="11" width="8" height="8" rx="2" fill="#0066FF" />
  </svg>
);

export default function ZeroHesitationLogo({
  className = '',
  size = 20,
  showText = true,
  textSize = 'text-[17px]',
  textColor = 'text-slate-900 dark:text-white',
  badge = null,
  subtitle = null,
}) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${textColor} ${className}`}>
      {size > 0 && <ZeroHesitationEmblem size={Math.min(size, 22)} />}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-2 leading-none">
            <span className={`font-medium font-sans ${textSize}`}>{BRAND.name}</span>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-none hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
