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
        // The index finger tip is at (11.5, 1) in the 24x30 viewBox.
        // We are scaling by 2x (width 48, height 60).
        // So the visual tip is at (11.5 * 2, 1 * 2) = (23, 2).
        transform: `translate3d(${position.x - 23}px, ${position.y - 2}px, 0) scale(${isGrabbing ? 0.9 : 1})`,
      }}
    >
      <svg
        width="48"
        height="60"
        viewBox="0 0 24 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.2))' }}
      >
        <path
          d="M11.5 1C11.5 1 9.5 1 9.5 3V12C9.5 12 6 11 4 13.5C2 16 5 19 6 20L7 25H16L17 20C18.5 19 20 17 19 14.5C18.5 13.5 17 13.5 16.5 13.5V11.5C18 11 18 9 16.5 8.5C16 8.3 15.5 8.5 15.5 8.5V6.5C17 6 17 4 15.5 3.5C15 3.3 14.5 3.5 14.5 3.5V2.5C14.5 0.5 11.5 0.5 11.5 1Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Simple detail lines */}
        <line x1="11.5" y1="20" x2="11.5" y2="24" stroke="black" strokeWidth="1" strokeLinecap="round" />
        <line x1="9" y1="20" x2="9" y2="23" stroke="black" strokeWidth="1" strokeLinecap="round" />
        <line x1="14" y1="20" x2="14" y2="23" stroke="black" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
};