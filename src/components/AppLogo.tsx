import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick
}) => {
  const iconDimensions = {
    sm: { w: 28, h: 28, iconSize: 18, textClass: 'text-sm' },
    md: { w: 38, h: 38, iconSize: 24, textClass: 'text-base' },
    lg: { w: 50, h: 50, iconSize: 32, textClass: 'text-xl' },
    xl: { w: 64, h: 64, iconSize: 42, textClass: 'text-3xl' },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer hover:opacity-95' : ''} ${className}`}
    >
      {/* Colorful Prismatic Logo Icon */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-2xl p-[2px] bg-gradient-to-tr from-[#25F4EE] via-[#FE2C55] to-[#FFB800] shadow-lg shadow-[#FE2C55]/25 group transition-transform active:scale-95"
        style={{ width: iconDimensions.w, height: iconDimensions.h }}
      >
        {/* Inner Dark Badge with Luminous Prism R */}
        <div className="w-full h-full bg-[#0a0a0f] rounded-[14px] flex items-center justify-center overflow-hidden relative">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FE2C55]/20 via-transparent to-[#25F4EE]/25 opacity-80" />

          {/* Stylized Modern Vector 'R' Logo Mark */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: iconDimensions.iconSize, height: iconDimensions.iconSize }}
            className="relative z-10 drop-shadow-[0_2px_8px_rgba(254,44,85,0.6)]"
          >
            <defs>
              <linearGradient id="ronginGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#25F4EE" />
                <stop offset="45%" stopColor="#FE2C55" />
                <stop offset="100%" stopColor="#FFB800" />
              </linearGradient>
              <linearGradient id="ronginGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF007A" />
                <stop offset="60%" stopColor="#7928CA" />
                <stop offset="100%" stopColor="#00DFD8" />
              </linearGradient>
            </defs>

            {/* Vertical Stem with rounded pill */}
            <rect x="18" y="16" width="16" height="68" rx="8" fill="url(#ronginGrad1)" />

            {/* Upper Loop of 'R' */}
            <path
              d="M34 16H58C72 16 82 26 82 40C82 54 72 64 58 64H34V16Z"
              fill="url(#ronginGrad2)"
            />
            {/* Cutout Hole inside Loop */}
            <path
              d="M34 30H56C62 30 66 34 66 40C66 46 62 50 56 50H34V30Z"
              fill="#0a0a0f"
            />

            {/* Dynamic Leg of 'R' with music/play curve */}
            <path
              d="M50 54L76 84H60L36 56H50Z"
              fill="url(#ronginGrad1)"
            />

            {/* Small Colorful Star Accent */}
            <circle cx="82" cy="22" r="5" fill="#25F4EE" />
          </svg>
        </div>
      </div>

      {/* Brand Text in Colorful English */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5 font-black tracking-tight">
            {/* Colorful 'Rongin' Gradient Text in English */}
            <span
              className={`${iconDimensions.textClass} font-black tracking-tight bg-gradient-to-r from-[#25F4EE] via-[#FE2C55] to-[#FFB800] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(254,44,85,0.3)]`}
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                letterSpacing: '-0.03em'
              }}
            >
              Rongin
            </span>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-[#FE2C55] to-[#FF007A] text-white shadow-sm shadow-[#FE2C55]/30 tracking-wider">
              APP
            </span>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] font-bold text-zinc-400 tracking-wider">
              SHORT VIDEO PLATFORM
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
