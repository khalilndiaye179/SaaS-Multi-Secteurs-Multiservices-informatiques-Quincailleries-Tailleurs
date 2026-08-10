import React from 'react';

interface BogolanPatternProps {
  className?: string;
}

export const BogolanMotifPattern: React.FC<BogolanPatternProps> = ({ className = '' }) => (
  <svg
    className={`absolute inset-0 w-full h-full pointer-events-none opacity-[0.06] ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M0 40L40 0L80 40L40 80Z" />
    <path d="M20 40L40 20L60 40L40 60Z" />
    <circle cx="40" cy="40" r="4" fill="currentColor" />
    <path d="M0 0l20 20M80 0L60 20M0 80l20-20M80 80L60 60" />
  </svg>
);
