import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  className?: string;
}

export default function SmartShambaLogo({
  variant = 'full',
  size = 'md',
  theme = 'light',
  className = '',
}: LogoProps) {
  // Size dimensions
  const dimensions = {
    sm: variant === 'full' ? { width: 160, height: 40 } : { width: 36, height: 36 },
    md: variant === 'full' ? { width: 210, height: 52 } : { width: 48, height: 48 },
    lg: variant === 'full' ? { width: 280, height: 70 } : { width: 64, height: 64 },
  }[size];

  const textColor = theme === 'dark' ? '#FAFAFA' : '#00381E';

  if (variant === 'icon') {
    return (
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="ss-leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#00703C" />
          </linearGradient>
          <linearGradient id="ss-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Outer Tech Shield / Leaf Arc */}
        <path
          d="M50 8C26.8 8 8 26.8 8 50C8 73.2 26.8 92 50 92C55.2 92 60.2 91 64.8 89.2C61.2 84.8 59 79.2 59 73C59 60.3 69.3 50 82 50C88.2 50 93.8 52.2 98.2 55.8C100 51.2 100 46.2 100 41C100 17.8 73.2 8 50 8Z"
          fill="url(#ss-leaf-grad)"
          opacity="0.15"
        />

        {/* Left Primary Leaf Blade */}
        <path
          d="M50 12C28 12 16 32 16 56C16 76 32 88 50 88C42 74 42 38 50 12Z"
          fill="url(#ss-leaf-grad)"
        />

        {/* Right Tech Signal Leaf */}
        <path
          d="M50 12C58 38 58 74 50 88C68 88 84 76 84 56C84 32 72 12 50 12Z"
          fill="#00703C"
        />

        {/* Circuit Tech Nodes */}
        <path
          d="M50 25V75 M32 42L68 42 M24 58L76 58"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Center Golden Maize Kernel Node */}
        <circle cx="50" cy="50" r="10" fill="url(#ss-gold-grad)" />
        <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
      </svg>
    );
  }

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 320 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="ss-full-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#00703C" />
        </linearGradient>
        <linearGradient id="ss-full-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Emblem Section */}
      <g transform="translate(10, 8)">
        {/* Left Leaf */}
        <path
          d="M32 4C16 4 8 20 8 38C8 52 18 64 32 64C26 52 26 24 32 4Z"
          fill="url(#ss-full-leaf)"
        />
        {/* Right Tech Leaf */}
        <path
          d="M32 4C38 24 38 52 32 64C46 64 56 52 56 38C56 20 48 4 32 4Z"
          fill="#00703C"
        />
        {/* Circuit Lines */}
        <path
          d="M32 14V54 M20 28H44 M15 40H49"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* Golden Center Node */}
        <circle cx="32" cy="34" r="7" fill="url(#ss-full-gold)" />
        <circle cx="32" cy="34" r="3" fill="#FFFFFF" />
      </g>

      {/* Typography */}
      <text
        x="82"
        y="50"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="31"
        letterSpacing="-0.03em"
        fill={textColor}
      >
        Smart
        <tspan fill="#00703C">Shamba</tspan>
      </text>

      {/* Subtitle Badge */}
      <rect x="83" y="57" width="128" height="15" rx="3.5" fill="#00703C" fillOpacity="0.1" />
      <text
        x="88"
        y="68"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="8.5"
        letterSpacing="0.08em"
        fill="#00703C"
      >
        AGRI-TRADE NETWORK
      </text>
    </svg>
  );
}