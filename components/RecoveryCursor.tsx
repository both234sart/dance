import React from 'react';
import { Point } from '../types';

interface RecoveryCursorProps {
  position: Point;
}

export const RecoveryCursor: React.FC<RecoveryCursorProps> = ({ position }) => {
  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out will-change-transform"
      style={{
        left: 0,
        top: 0,
        // Centered hand
        transform: `translate3d(${position.x - 24}px, ${position.y - 24}px, 0)`,
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.2))' }}
      >
        {/* Open Hand / Grabbing shape */}
        <path
          d="M12 2C13.1 2 14 2.9 14 4V11H15V5C15 3.9 15.9 3 17 3C18.1 3 19 3.9 19 5V13.5C19 16.5 16.5 20 12 22C8 20 5 17 5 13V6C5 4.9 5.9 4 7 4C8.1 4 9 4.9 9 6V11H10V4C10 2.9 10.9 2 12 2Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {/* Label for clarity on mobile */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
        Grab it!
      </div>
    </div>
  );
};