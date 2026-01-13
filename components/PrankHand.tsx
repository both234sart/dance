import React from 'react';
import { Point, PrankState } from '../types';

interface PrankHandProps {
  position: Point;
  state: PrankState;
}

export const PrankHand: React.FC<PrankHandProps> = ({ position, state }) => {
  const isVisible = state !== PrankState.IDLE && state !== PrankState.COOLDOWN;
  const isGrabbing = state === PrankState.GRABBING || state === PrankState.DRAGGING;

  // The bear paw comes from the side
  
  return (
    <div
      className="fixed pointer-events-none z-40 transition-opacity duration-300 will-change-transform"
      style={{
        left: 0,
        top: 0,
        opacity: isVisible ? 1 : 0,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`, 
      }}
    >
      <div 
        className={`transform transition-transform duration-500 ease-in-out origin-center`}
        style={{
            // When grabbing, we scale down slightly to simulate grip pressure
            // We translate to center the paw on the cursor (x-50%, y-50% roughly)
            transform: `translate(-50%, -40%) rotate(-25deg) scale(${isGrabbing ? 0.9 : 1})`
        }}
      >
        {/* Bear Paw SVG */}
        <svg
          width="180"
          height="180"
          viewBox="0 0 100 100"
          fill="none"
          className="drop-shadow-2xl"
        >
            {/* Claws (hidden behind fingers normally, but visible here for cuteness) */}
            <path d="M20 35Q18 25 22 20" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
            <path d="M40 25Q40 15 44 10" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
            <path d="M65 25Q68 15 64 10" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
            <path d="M85 35Q88 25 84 20" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />

            {/* Arm/Hand Base */}
            <path 
                d="M15 100 L15 60 Q15 40 30 35 L80 35 Q95 40 95 60 L95 100 Z" 
                fill="#8B4513" 
                stroke="#5D4037" 
                strokeWidth="2"
            />

            {/* Main Paw Pad */}
            <ellipse cx="55" cy="70" rx="25" ry="18" fill="#D2B48C" opacity="0.9" />

            {/* Toe Pads */}
            <circle cx="28" cy="45" r="8" fill="#D2B48C" />
            <circle cx="48" cy="35" r="9" fill="#D2B48C" />
            <circle cx="70" cy="38" r="9" fill="#D2B48C" />
            <circle cx="88" cy="50" r="8" fill="#D2B48C" />
            
            {/* Fur texture details */}
            <path d="M20 80 Q25 85 20 90" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M90 80 Q85 85 90 90" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
};