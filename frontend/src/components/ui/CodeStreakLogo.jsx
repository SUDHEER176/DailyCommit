import React from 'react';
import ZeroHesitationLogo, { ZeroHesitationEmblem } from './ZeroHesitationLogo';

/**
 * Brand logo (Daily Commit). Kept under this name so existing imports keep working.
 */
export default function CodeStreakLogo({
  className = '',
  size = 20,
  showText = true,
  textSize = 'text-[17px]',
  textColor,
  badge = null,
  subtitle = null,
}) {
  return (
    <ZeroHesitationLogo
      className={className}
      size={size}
      showText={showText}
      textSize={textSize}
      textColor={textColor}
      badge={badge}
      subtitle={subtitle}
    />
  );
}

export { ZeroHesitationLogo, ZeroHesitationEmblem };
