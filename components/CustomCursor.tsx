import React from 'react';
import { Point } from '../types';

interface CustomCursorProps {
  position: Point;
  isGrabbing: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ position, isGrabbing }) => {
  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out will-change-transform"
      style={{
        left: 0,
        top: 0,
        // Center the bear face on the cursor position
        transform: `translate3d(${position.x - 16}px, ${position.y - 16}px, 0) scale(${isGrabbing ? 0.9 : 1})`,
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 32 32"
        fill="none"
        style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.3))' }}
      >
        {/* Ears */}
        <circle cx="6" cy="6" r="5" fill="#8B4513" />
        <circle cx="26" cy="6" r="5" fill="#8B4513" />
        <circle cx="6" cy="6" r="2.5" fill="#D2B48C" />
        <circle cx="26" cy="6" r="2.5" fill="#D2B48C" />
        
        {/* Head */}
        <circle cx="16" cy="17" r="13" fill="#A0522D" stroke="#5D4037" strokeWidth="1" />
        
        {/* Snout Area */}
        <ellipse cx="16" cy="21" rx="5" ry="4" fill="#D2B48C" />
        
        {/* Nose */}
        <ellipse cx="16" cy="20" rx="2" ry="1.5" fill="#2D1B10" />
        
        {/* Mouth */}
        <path d="M16 21.5V23M14.5 24Q16 25 17.5 24" stroke="#2D1B10" strokeWidth="1" strokeLinecap="round" />
        
        {/* Eyes */}
        <circle cx="11.5" cy="15" r="1.5" fill="#000" />
        <circle cx="20.5" cy="15" r="1.5" fill="#000" />
        
        {/* Shine in eyes */}
        <circle cx="12" cy="14.5" r="0.5" fill="#FFF" />
        <circle cx="21" cy="14.5" r="0.5" fill="#FFF" />
      </svg>
    </div>
  );
};