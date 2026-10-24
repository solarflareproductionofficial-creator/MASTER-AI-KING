import React, { useState } from 'react';

interface MascotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  isBusy?: boolean;
  onTap?: () => void;
  bubbleText?: string | null;
  interactive?: boolean;
}

export const Mascot: React.FC<MascotProps> = ({
  className = '',
  size = 'md',
  isBusy = false,
  onTap,
  bubbleText,
  interactive = true,
}) => {
  const [isHopping, setIsHopping] = useState(false);

  const handleClick = () => {
    if (!interactive) return;
    setIsHopping(true);
    setTimeout(() => setIsHopping(false), 650);
    if (onTap) onTap();
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-18',
    lg: 'w-24 h-26',
    hero: 'w-28 h-30 md:w-32 md:h-34',
  }[size];

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble popup */}
      {bubbleText && (
        <div className="absolute bottom-[calc(100%+8px)] z-30 px-3 py-2 bg-[var(--gl)] backdrop-blur-md border border-[var(--gb)] rounded-xl text-xs md:text-sm text-[var(--tx)] shadow-xl max-w-xs text-center anim-pop pointer-events-none">
          <div className="font-semibold text-[var(--ac)] mb-0.5">Master Bot:</div>
          <div>{bubbleText}</div>
          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-[var(--gl)] border-r border-b border-[var(--gb)]" />
        </div>
      )}

      {/* Robot SVG */}
      <div
        onClick={handleClick}
        className={`${sizeClasses} ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} transition-transform duration-200`}
        title={interactive ? 'Master Bot - Tap for advice!' : 'Master Bot'}
      >
        <svg
          className={`mas w-full h-full ${isBusy ? 'busy-scan' : ''} ${isHopping ? 'anim-hop' : ''}`}
          viewBox="0 0 120 130"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Antenna */}
          <g className="ant">
            <line
              x1="60"
              y1="22"
              x2="60"
              y2="10"
              stroke="url(#mg)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="60" cy="8" r="6" fill="url(#mg)" />
          </g>

          {/* Left/Right Cyber Ears */}
          <circle cx="14" cy="64" r="8" fill="url(#mg)" />
          <circle cx="106" cy="64" r="8" fill="url(#mg)" />

          {/* Head Chassis */}
          <rect x="20" y="24" width="80" height="64" rx="24" fill="url(#mg)" />

          {/* Cyber Visor Screen */}
          <rect x="30" y="38" width="60" height="36" rx="16" fill="#0d0f17" />

          {/* Glowing Eyes */}
          <rect
            className="eye"
            x="41"
            y="49"
            width="12"
            height="15"
            rx="6"
            fill="#ffffff"
          />
          <rect
            className="eye"
            x="67"
            y="49"
            width="12"
            height="15"
            rx="6"
            fill="#ffffff"
          />

          {/* Smile line */}
          <path
            d="M50 80 Q60 88 70 80"
            stroke="#0d0f17"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />

          {/* Torso */}
          <rect x="42" y="94" width="36" height="22" rx="10" fill="url(#mg)" />

          {/* Waving Right Hand */}
          <circle className="hand" cx="96" cy="104" r="8" fill="url(#mg)" />

          {/* Left Hand */}
          <circle cx="24" cy="104" r="8" fill="url(#mg)" />
        </svg>
      </div>
    </div>
  );
};
