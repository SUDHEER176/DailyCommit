import React from 'react';

/**
 * High-quality, authentic multi-color vector brand logos for tech giants
 * 100% standalone SVG icons - zero external CDN dependency
 */

export const GoogleLogo = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export const MicrosoftLogo = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="1" y="1" width="10" height="10" rx="0.5" fill="#F25022"/>
    <rect x="13" y="1" width="10" height="10" rx="0.5" fill="#7FBA00"/>
    <rect x="1" y="13" width="10" height="10" rx="0.5" fill="#00A4EF"/>
    <rect x="13" y="13" width="10" height="10" rx="0.5" fill="#FFB900"/>
  </svg>
);

export const AmazonLogo = ({ size = 20, className = "" }) => (
  <svg width={size * 1.2} height={size} viewBox="0 0 28 24" fill="none" className={className}>
    {/* Clean bold white 'a' */}
    <path d="M12.8 12.5c-.7 0-1.2-.2-1.6-.4-.3-.3-.5-.7-.5-1.3 0-.6.2-1.1.7-1.4.4-.3 1-.5 1.7-.5.6 0 1.2.1 1.6.3v.6c-.4-.2-.9-.3-1.4-.3-.4 0-.8.1-1 .2-.2.1-.3.4-.3.7 0 .3.1.5.3.7.2.2.6.2.9.2.5 0 .9-.2 1.3-.4v.7c-.4.4-1 .6-1.7.6zm2.8 0h-.7V7h.7v5.5z" fill="#FFFFFF"/>
    {/* Vibrant curved Amazon smile arrow */}
    <path d="M23.5 16.2c-5.5 3.2-13.8 2.5-19.2-.6-.2-.1-.2-.5 0-.6.2-.2.6-.1.8.1 4.9 2.8 12.6 3.5 17.8.6.3-.2.7.1.9.4.1.2 0 .4-.3.5z" fill="#FF9900"/>
    <path d="M24.8 14.8c-.2-.2-1.4-.1-1.9 0-.2.1-.2-.2 0-.3.7-.5 2.2-.5 2.5-.2.2.2.1 1.7-.5 2.4-.2.2-.3.1-.4 0-.1-.5.1-1.6.3-1.9z" fill="#FF9900"/>
  </svg>
);

export const MetaLogo = ({ size = 20, className = "" }) => (
  <svg width={size * 1.2} height={size} viewBox="0 0 28 24" fill="none" className={className}>
    <path d="M14 13.8c-1.3-2.1-2.9-4.3-5-4.3C5.9 9.5 4 11.7 4 14.5c0 3.3 2.6 5.5 5.5 5.5 2.5 0 4.2-2.1 5.5-4.2zm0 0c1.3-2.1 2.9-4.3 5-4.3 3.1 0 5 2.2 5 5 0 3.3-2.6 5.5-5.5 5.5-2.5 0-4.2-2.1-5.5-4.2z" stroke="#0081FB" strokeWidth="3" strokeLinecap="round"/>
    <path d="M14 13.8c1.3-2.1 2.9-4.3 5-4.3 3.1 0 5 2.2 5 5 0 3.3-2.6 5.5-5.5 5.5-2.5 0-4.2-2.1-5.5-4.2z" stroke="#0668E1" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export const AppleLogo = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFFFF" className={className}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.64 1.35-.57.66-1.06 1.73-.93 2.76 1 .08 2.03-.51 2.65-1.26z"/>
  </svg>
);

export const NetflixLogo = ({ size = 18, className = "" }) => (
  <svg width={size * 0.75} height={size} viewBox="0 0 18 24" fill="none" className={className}>
    <path d="M0 0h4.2l6 16.5V0H14v24h-4.2L3.8 7.5V24H0V0z" fill="#E50914"/>
  </svg>
);

export const StripeLogo = ({ size = 20, className = "" }) => (
  <svg width={size * 1.1} height={size} viewBox="0 0 26 24" fill="none" className={className}>
    <rect width="26" height="24" rx="6" fill="#635BFF"/>
    <path d="M14.8 9.5c0-.9-.8-1.3-2-1.3-1.4 0-2.8.5-3.8 1.1V6.5c1.2-.5 2.6-.8 4-.8 3.2 0 5.3 1.6 5.3 4.5 0 4.4-6 3.7-6 5.6 0 1.1 1 1.5 2.4 1.5 1.6 0 3.2-.6 4.3-1.3v2.8c-1.3.6-2.9.9-4.5.9-3.4 0-5.7-1.7-5.7-4.6 0-4.7 6-3.9 6-5.6z" fill="#FFFFFF"/>
  </svg>
);

export const LeetCodeLogo = ({ size = 19, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.755-1.796.755s-1.33-.288-1.796-.755L4.437 15.16a2.546 2.546 0 010-3.593l5.376-5.377c.466-.466 1.111-.754 1.796-.754s1.33.288 1.796.754l2.697 2.608a.728.728 0 001.03-.024.729.729 0 00-.024-1.03l-2.697-2.608A3.996 3.996 0 0011.609 4c-1.071 0-2.078.417-2.836 1.175L3.397 10.552a4.004 4.004 0 000 5.648l5.376 5.377A3.99 3.99 0 0011.609 22.75c1.071 0 2.078-.417 2.836-1.175l2.697-2.608a.728.728 0 00-.024-1.03.729.729 0 00-1.016-.007z" fill="#FFA116"/>
    <path d="M10.838 12.727h7.828c.403 0 .728-.325.728-.727s-.325-.728-.728-.728h-7.828c-.403 0-.728.326-.728.728s.325.727.728.727z" fill="#FFFFFF"/>
  </svg>
);

export const OpenAILogo = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#10A37F" className={className}>
    <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0010.596.5a6.05 6.05 0 00-5.772 3.99A6.035 6.035 0 001.077 7.7a6.046 6.046 0 00.744 7.086 5.98 5.98 0 00.51 4.91 6.05 6.05 0 006.515 2.9A5.985 5.985 0 0013.404 23.5a6.055 6.055 0 005.772-3.99 6.03 6.03 0 003.747-3.21 6.046 6.046 0 00-.641-6.479zM13.404 22a4.57 4.57 0 01-2.73-1.03l.11-.063 4.542-2.622a.77.77 0 00.384-.666v-6.398l1.921 1.11a.07.07 0 01.039.055v5.044A4.58 4.58 0 0113.404 22zm-7.6-3.155a4.57 4.57 0 01-.623-2.851l.111.066 4.542 2.622a.77.77 0 00.768 0l5.541-3.2v2.22a.07.07 0 01-.027.061l-4.368 2.522a4.584 4.584 0 01-5.944-1.44zm-1.89-8.435a4.57 4.57 0 012.107-1.821v5.372a.77.77 0 00.384.666l5.541 3.2-1.921 1.11a.07.07 0 01-.067.006L5.59 16.42a4.584 4.584 0 01-1.676-5.879zM10.596 2a4.57 4.57 0 012.73 1.03l-.11.063-4.542 2.622a.77.77 0 00-.384.666v6.398L6.37 11.669a.07.07 0 01-.039-.055V6.57A4.58 4.58 0 0110.596 2zm7.6 3.155a4.57 4.57 0 01.623 2.851l-.111-.066-4.542-2.622a.77.77 0 00-.768 0L7.857 8.518V6.298a.07.07 0 01.027-.061l4.368-2.522a4.584 4.584 0 015.944 1.44zm1.89 8.435a4.57 4.57 0 01-2.107 1.821V10.04a.77.77 0 00-.384-.666L12.054 6.175l1.921-1.11a.07.07 0 01.067-.006l4.368 2.522a4.584 4.584 0 011.676 5.879zM8.868 13.5l2.42-1.397 2.42 1.397v2.795L11.288 17.7l-2.42-1.398v-2.802z"/>
  </svg>
);

export const AirbnbLogo = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF5A5F" className={className}>
    <path d="M12 1.5C8.4 1.5 6 4.3 6 7.4c0 3.8 3.5 8.1 6 12.1 2.5-4 6-8.3 6-12.1 0-3.1-2.4-5.9-6-5.9zm0 8.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 5 12 5s2.5 1.1 2.5 2.5S13.4 10 12 10z"/>
  </svg>
);

export const SpotifyLogo = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1ED760" className={className}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

export const AdobeLogo = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000" className={className}>
    <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM19.52 2.376H24v20.248zM0 2.376h4.48L0 13.064z"/>
  </svg>
);

export const UberLogo = ({ size = 18, className = "" }) => (
  <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-white px-1.5 py-0.5 rounded bg-white/10 border border-white/20">
    UBER
  </span>
);

export const PalantirLogo = ({ size = 19, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFFFF" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
  </svg>
);

export const DatabricksLogo = ({ size = 19, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF3621" className={className}>
    <path d="M1.5 5.5l10.5-5 10.5 5-10.5 5-10.5-5zm0 6.5l10.5 5 10.5-5-10.5-5-10.5 5zm0 6.5l10.5 5 10.5-5-10.5-5-10.5 5z"/>
  </svg>
);

export const ByteDanceLogo = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 3v18l6-4.5V7.5L6 3z" fill="#3C8CFF"/>
    <path d="M12 7.5v9l6-4.5V7.5L12 7.5z" fill="#00C4FF"/>
  </svg>
);

export const CoinbaseLogo = ({ size = 19, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0052FF" className={className}>
    <circle cx="12" cy="12" r="11"/>
    <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill="#FFFFFF"/>
  </svg>
);

export const CppLogo = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" className={className}>
    {/* Official C++ Blue Hexagon */}
    <path fill="#00599C" d="M117.5 35.5l-49.8-29a7.6 7.6 0 0 0-7.4 0l-49.8 29A7.5 7.5 0 0 0 6.8 42v58a7.5 7.5 0 0 0 3.7 6.5l49.8 29a7.6 7.6 0 0 0 7.4 0l49.8-29a7.5 7.5 0 0 0 3.7-6.5V42a7.5 7.5 0 0 0-3.7-6.5z"/>
    {/* Dark lower facet */}
    <path fill="#004482" d="M64 125.5a7.6 7.6 0 0 0 3.7-1l49.8-29a7.5 7.5 0 0 0 3.7-6.5V42a7.5 7.5 0 0 0-1.2-4.1L64 64v61.5z"/>
    {/* Light upper facet */}
    <path fill="#659AD2" d="M64 6.5a7.6 7.6 0 0 0-3.7 1l-49.8 29A7.5 7.5 0 0 0 6.8 42v47.9L64 64V6.5z"/>
    {/* Center 'C' */}
    <path fill="#FFFFFF" d="M64 36.4c-15.2 0-27.6 12.4-27.6 27.6S48.8 91.6 64 91.6c9.8 0 18.4-5.1 23.3-12.8l-11.7-6.8c-2.7 4.3-7.5 7.2-11.6 7.2-8.4 0-15.2-6.8-15.2-15.2s6.8-15.2 15.2-15.2c4.1 0 8.9 2.9 11.6 7.2l11.7-6.8C82.4 41.5 73.8 36.4 64 36.4z"/>
    {/* First '+' */}
    <path fill="#FFFFFF" d="M89.3 57.3h-4.6v-4.6c0-1.1-.9-2-2-2s-2 .9-2 2v4.6H76c-1.1 0-2 .9-2 2s.9 2 2 2h4.7v4.6c0 1.1.9 2 2 2s2-.9 2-2v-4.6h4.6c1.1 0 2-.9 2-2s-.9-2-2-2z"/>
    {/* Second '+' */}
    <path fill="#FFFFFF" d="M106.7 57.3h-4.6v-4.6c0-1.1-.9-2-2-2s-2 .9-2 2v4.6h-4.7c-1.1 0-2 .9-2 2s.9 2 2 2h4.7v4.6c0 1.1.9 2 2 2s2-.9 2-2v-4.6h4.6c1.1 0 2-.9 2-2s-.9-2-2-2z"/>
  </svg>
);

export const PythonLogo = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 110 110" fill="none" className={className}>
    {/* Official Python Top Blue Snake */}
    <path
      fill="#3776AB"
      d="M55.05 0C47.98 0 41.21 2.37 36.14 6.78C29.58 12.49 28.51 20.31 28.51 31.06v8.78h27.93v3.99H17.56C8.24 43.83 0 51.68 0 63.48c0 10.97 8.73 18.87 17.56 18.87h7.47V70.83c0-11.38 9.59-20.64 21.09-20.64h27.93c9.32 0 16.88-7.7 16.88-16.88V17.72C90.93 8.39 83.37 0 74.05 0H55.05z"
    />
    <circle cx="41.5" cy="13.5" r="4.5" fill="#FFFFFF" />
    {/* Official Python Bottom Yellow Snake */}
    <path
      fill="#FFD43B"
      d="M55.05 110c7.07 0 13.84-2.37 18.91-6.78 6.56-5.71 7.63-13.53 7.63-24.28v-8.78H53.66v-3.99h38.88c9.32 0 17.56-7.85 17.56-19.65 0-10.97-8.73-18.87-17.56-18.87h-7.47v11.52c0 11.38-9.59 20.64-21.09 20.64H36.05c-9.32 0-16.88 7.7-16.88 16.88v15.59C19.17 101.61 26.73 110 36.05 110h19z"
    />
    <circle cx="68.5" cy="96.5" r="4.5" fill="#FFFFFF" />
  </svg>
);

import ZeroHesitationLogo, { ZeroHesitationEmblem } from './ZeroHesitationLogo';

export { ZeroHesitationLogo, ZeroHesitationEmblem };

// Map of brand names to their colorful components
export const BRAND_COMPONENT_MAP = {
  ZeroHesitation: ZeroHesitationEmblem,
  Google: GoogleLogo,
  Microsoft: MicrosoftLogo,
  Amazon: AmazonLogo,
  Meta: MetaLogo,
  Apple: AppleLogo,
  Netflix: NetflixLogo,
  Stripe: StripeLogo,
  LeetCode: LeetCodeLogo,
  OpenAI: OpenAILogo,
  Airbnb: AirbnbLogo,
  Spotify: SpotifyLogo,
  Adobe: AdobeLogo,
  Uber: UberLogo,
  Palantir: PalantirLogo,
  Databricks: DatabricksLogo,
  ByteDance: ByteDanceLogo,
  Coinbase: CoinbaseLogo,
  Cpp: CppLogo,
  CPlusPlus: CppLogo,
  Python: PythonLogo,
};

