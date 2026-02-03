import React, { useRef, useState, useEffect } from 'react';
import { Point } from '../types';

interface JoystickProps {
  onMove: (vector: Point) => void;
  onStop: () => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, onStop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const startPos = useRef<Point>({ x: 0, y: 0 });
  
  // Joystick configuration
  const maxRadius = 40; // Max distance the knob can move from center

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    setActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!active) return;
    e.preventDefault();
    const touch = e.touches[0];
    
    const dx = touch.clientX - startPos.current.x;
    const dy = touch.clientY - startPos.current.y;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Clamp magnitude
    const clampedDistance = Math.min(distance, maxRadius);
    
    const x = Math.cos(angle) * clampedDistance;
    const y = Math.sin(angle) * clampedDistance;
    
    setPosition({ x, y });
    
    // Normalize vector (-1 to 1)
    onMove({ 
      x: x / maxRadius, 
      y: y / maxRadius 
    });
  };

  const handleTouchEnd = () => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onStop();
  };

  return (
    <div 
      className="fixed bottom-8 right-8 z-50 md:hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      // Added mouse listeners for testing on desktop if needed, though mostly for mobile
    >
      {/* Outer Circle */}
      <div 
        ref={containerRef}
        className="w-24 h-24 rounded-full bg-gray-900/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center relative shadow-lg"
      >
        {/* Inner Knob */}
        <div 
          className="w-10 h-10 rounded-full bg-white shadow-md absolute transition-transform duration-75"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: active ? 'none' : 'transform 0.2s ease-out'
          }}
        />
      </div>
      <div className="absolute -top-8 w-full text-center text-xs font-bold text-gray-400 pointer-events-none whitespace-nowrap right-0">
        Move Cursor
      </div>
    </div>
  );
};