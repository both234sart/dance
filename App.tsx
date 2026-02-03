import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CustomCursor } from './components/CustomCursor';
import { PrankHand } from './components/PrankHand';
import { Joystick } from './components/Joystick';
import { RecoveryCursor } from './components/RecoveryCursor';
import { Point, PrankState } from './types';
import { Heart } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  // Real mouse position (from system events or joystick) - this controls the "Recovery Hand" when recovering
  const [realMousePos, setRealMousePos] = useState<Point>({ x: -100, y: -100 });
  const realMousePosRef = useRef<Point>({ x: -100, y: -100 });
  
  // Visual cursor position (The Index Finger) - detached from real mouse during recovery
  const [visualCursorPos, setVisualCursorPos] = useState<Point>({ x: -100, y: -100 });
  
  // Hand position (Bear paw)
  const [handPos, setHandPos] = useState<Point>({ x: -200, y: -200 }); // Start offscreen
  
  // Prank State Machine
  const [prankState, setPrankState] = useState<PrankState>(PrankState.IDLE);
  
  // Recovery Mode State
  const [isRecovering, setIsRecovering] = useState(false);
  const droppedCursorPosRef = useRef<Point>({ x: 0, y: 0 }); // Where the bear dropped the index finger
  
  // Refs for logic
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const prankStateRef = useRef<PrankState>(PrankState.IDLE);
  const isRecoveringRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number>(0);
  const targetDragPos = useRef<Point>({ x: 0, y: 0 });
  const didAccept = useRef<boolean>(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Joystick Refs
  const joystickVectorRef = useRef<Point>({ x: 0, y: 0 });
  const isJoystickActiveRef = useRef<boolean>(false);
  
  // Offset between real mouse and visual cursor (used in normal mode)
  const cursorOffsetRef = useRef<Point>({ x: 0, y: 0 });

  // Custom hover state for Yes button
  const [isYesHovered, setIsYesHovered] = useState(false);

  // Sync ref with state
  useEffect(() => {
    prankStateRef.current = prankState;
  }, [prankState]);

  useEffect(() => {
    isRecoveringRef.current = isRecovering;
  }, [isRecovering]);

  // Initial Center Position for Mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
        const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        setRealMousePos(center);
        realMousePosRef.current = center;
        setVisualCursorPos(center);
    }
  }, []);

  // --- Handlers ---

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // If joystick is being used, ignore mouse move
    if (isJoystickActiveRef.current) return;

    const newPos = { x: e.clientX, y: e.clientY };
    setRealMousePos(newPos);
    realMousePosRef.current = newPos;

    // Normal behavior (Index finger follows mouse with offset)
    if (!isRecoveringRef.current && (prankStateRef.current === PrankState.IDLE || prankStateRef.current === PrankState.COOLDOWN)) {
      setVisualCursorPos({
        x: newPos.x + cursorOffsetRef.current.x,
        y: newPos.y + cursorOffsetRef.current.y
      });
    }
  }, []);

  const handleJoystickMove = useCallback((vector: Point) => {
    joystickVectorRef.current = vector;
    isJoystickActiveRef.current = true;
  }, []);

  const handleJoystickStop = useCallback(() => {
    joystickVectorRef.current = { x: 0, y: 0 };
    isJoystickActiveRef.current = false;
  }, []);

  const handleSuccess = useCallback(() => {
    didAccept.current = true;
    setIsSuccess(true);
  }, []);

  // Reset offset on mouse enter (re-entering the page) - ONLY if not recovering
  useEffect(() => {
    const handleMouseEnter = () => {
      if (!isRecoveringRef.current) {
        cursorOffsetRef.current = { x: 0, y: 0 };
      }
    };
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    return () => document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
  }, []);

  // Global click handler
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.touch-none')) return;
      if (isYesHovered) {
        handleSuccess();
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isYesHovered, handleSuccess]);

  // --- Core Loop ---

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // The Animation & Logic Loop
  useEffect(() => {
    const loop = () => {
      if (didAccept.current) return;

      const currentState = prankStateRef.current;
      const recovering = isRecoveringRef.current;
      
      // --- Joystick Logic ---
      if (isJoystickActiveRef.current) {
        // Joystick Disabled ONLY during Grab/Drag
        const isControlDisabled = currentState === PrankState.GRABBING || currentState === PrankState.DRAGGING;
        
        if (!isControlDisabled) {
            // Speed depends on state: very slow (0.5) when recovering, normal (8) otherwise
            const speed = recovering ? 1.15 : 8;
            const dx = joystickVectorRef.current.x * speed;
            const dy = joystickVectorRef.current.y * speed;
            
            let newX = realMousePosRef.current.x + dx;
            let newY = realMousePosRef.current.y + dy;

            newX = Math.max(0, Math.min(window.innerWidth, newX));
            newY = Math.max(0, Math.min(window.innerHeight, newY));

            const newPos = { x: newX, y: newY };
            realMousePosRef.current = newPos;
            setRealMousePos(newPos);

            // If not recovering and not pranked, update visual cursor
            if (!recovering && (currentState === PrankState.IDLE || currentState === PrankState.COOLDOWN)) {
                setVisualCursorPos({
                    x: newPos.x + cursorOffsetRef.current.x,
                    y: newPos.y + cursorOffsetRef.current.y
                });
            }
        }
      }

      // --- Recovery Logic (Connecting the two cursors) ---
      if (recovering) {
        // Visual Cursor (Index Finger) stays dropped
        setVisualCursorPos(droppedCursorPosRef.current);
        
        // Check distance between Real Mouse (Recovery Hand) and Dropped Index
        const distX = realMousePosRef.current.x - droppedCursorPosRef.current.x;
        const distY = realMousePosRef.current.y - droppedCursorPosRef.current.y;
        const dist = Math.sqrt(distX * distX + distY * distY);

        // Snap distance
        if (dist < 40) {
            // LATCH!
            setIsRecovering(false);
            cursorOffsetRef.current = { x: 0, y: 0 }; // Reset offset
            setVisualCursorPos(realMousePosRef.current); // Snap together
        }
      }

      const noBtn = noButtonRef.current;
      const yesBtn = yesButtonRef.current;

      if (!noBtn || !yesBtn) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Check Yes Button Hover
      // Note: If recovering, user cannot click yes until they retrieve the cursor
      const activeCursorPos = recovering ? realMousePosRef.current : visualCursorPos;
      
      const yesRect = yesBtn.getBoundingClientRect();
      const isOverYes = 
        !recovering && // Can't click YES with the grabbing hand
        activeCursorPos.x >= yesRect.left && 
        activeCursorPos.x <= yesRect.right && 
        activeCursorPos.y >= yesRect.top && 
        activeCursorPos.y <= yesRect.bottom;
      
      if (isOverYes !== isYesHovered) {
         setIsYesHovered(isOverYes);
      }

      // --- Prank Logic ---

      // 1. Check Trigger
      if (currentState === PrankState.IDLE && !recovering) {
        const noRect = noBtn.getBoundingClientRect();
        const isOverNo = 
            visualCursorPos.x >= noRect.left && 
            visualCursorPos.x <= noRect.right && 
            visualCursorPos.y >= noRect.top && 
            visualCursorPos.y <= noRect.bottom;

        if (isOverNo) {
            setPrankState(PrankState.ENTERING);
            setHandPos({ x: window.innerWidth + 150, y: visualCursorPos.y + 50 });
        }
      }

      // 2. Animation States
      if (currentState === PrankState.ENTERING) {
        const dx = visualCursorPos.x - handPos.x;
        const dy = visualCursorPos.y - handPos.y;
        setHandPos(prev => ({ x: prev.x + dx * 0.08, y: prev.y + dy * 0.08 }));

        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            setPrankState(PrankState.GRABBING);
            const safeX = Math.random() > 0.5 ? window.innerWidth * 0.1 : window.innerWidth * 0.9;
            const safeY = Math.random() * (window.innerHeight * 0.8);
            targetDragPos.current = { x: safeX, y: safeY };
            setTimeout(() => setPrankState(PrankState.DRAGGING), 300);
        }
      } 
      else if (currentState === PrankState.GRABBING) {
        setHandPos(visualCursorPos);
      }
      else if (currentState === PrankState.DRAGGING) {
        const tx = targetDragPos.current.x;
        const ty = targetDragPos.current.y;
        
        const hdx = tx - handPos.x;
        const hdy = ty - handPos.y;

        const nextHandX = handPos.x + hdx * 0.04;
        const nextHandY = handPos.y + hdy * 0.04;

        setHandPos({ x: nextHandX, y: nextHandY });
        setVisualCursorPos({ x: nextHandX, y: nextHandY });

        // If reached drop target
        const distToTarget = Math.sqrt(hdx*hdx + hdy*hdy);
        if (distToTarget < 20) {
            // DROP IT
            droppedCursorPosRef.current = { x: nextHandX, y: nextHandY };
            
            // Start Leaving
            setPrankState(PrankState.LEAVING);
            
            // Activate Recovery Mode immediately
            setIsRecovering(true);
            
            // Reset cooldown eventually
            setTimeout(() => {
                setPrankState(PrankState.COOLDOWN);
                setTimeout(() => setPrankState(PrankState.IDLE), 1500);
            }, 500);
        }
      }
      else if (currentState === PrankState.LEAVING) {
        // Hand moves away, but Cursor stays dropped
        setHandPos(prev => ({ x: prev.x + 5, y: prev.y + 5 }));
        
        // Visual cursor forced to stay at drop point
        setVisualCursorPos(droppedCursorPosRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [realMousePos, visualCursorPos, handPos, isYesHovered]);

  // --- Render ---

  if (isSuccess) {
    return (
        <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center relative overflow-hidden">
             <CustomCursor position={realMousePos} isGrabbing={false} />
             <div className="animate-bounce mb-8">
                 <Heart className="w-24 h-24 text-red-500 fill-red-500" />
             </div>
             <h1 className="text-4xl md:text-6xl font-bold text-pink-600 text-center mb-4">
                 YAY! Ban Girlfriend hx!
             </h1>
             <p className="text-xl text-pink-400">Come Date with me!</p>
             <p className="text-xl text-pink-400">I Love You Bby😘!</p>
             <img 
                src="https://media.tenor.com/H-B9Kuj4gwAAAAAM/happy-dance.gif" 
                alt="Happy Bear Dancing"
                className="mt-8 rounded-lg shadow-2xl w-64 h-64 object-cover"
             />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 overflow-hidden relative selection:bg-pink-200">
      <div className="absolute top-10 left-10 text-pink-200 opacity-50 animate-pulse">
        <Heart size={48} className="fill-pink-200 text-pink-200" />
      </div>
      <div className="absolute bottom-10 right-10 text-blue-200 opacity-50 animate-pulse delay-700">
        <Heart size={64} className="fill-blue-200 text-blue-200" />
      </div>

      {/* 1. The Index Finger Cursor (Visual) */}
      <CustomCursor 
        position={visualCursorPos} 
        isGrabbing={prankState === PrankState.GRABBING || prankState === PrankState.DRAGGING} 
      />

      {/* 2. The Recovery Hand Cursor (Real) - Only shows when recovering */}
      {isRecovering && (
        <RecoveryCursor position={realMousePos} />
      )}

      {/* The Prank Hand */}
      <PrankHand 
        position={handPos} 
        state={prankState} 
      />

      {/* Joystick for Mobile */}
      <Joystick onMove={handleJoystickMove} onStop={handleJoystickStop} />

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-screen px-4 z-10 relative">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/50 max-w-md w-full text-center transform transition-transform hover:scale-[1.02]">
            
            <div className="mb-6 relative group flex justify-center">
                <img 
                    src="https://media.tenor.com/z9x_RClS584AAAAM/cute-mocha.gif" 
                    alt="Cute Mocha Bear Dancing"
                    className="relative rounded-lg w-full h-64 object-contain mb-2 animate-bear-dance"
                />
            </div>

            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
                Will you be my girlfriend?
            </h1>
            <p className="text-gray-500 mb-8">
                Please say yes!
            </p>

            <div className="flex justify-center gap-8 relative">
                <button
                    ref={yesButtonRef}
                    className={`px-8 py-3 text-white font-bold rounded-full shadow-lg transform transition-all focus:outline-none ring-4 ring-green-500/20 ${
                        isYesHovered 
                        ? 'bg-green-600 scale-110' 
                        : 'bg-green-500 scale-100'
                    }`}
                >
                    Yes🤩!
                </button>

                <button
                    ref={noButtonRef}
                    className="px-8 py-3 bg-red-500 text-white font-bold rounded-full shadow-lg transition-colors focus:outline-none opacity-90 cursor-none"
                >
                    No🥺
                </button>
            </div>
        </div>
      </main>

      <div className="absolute bottom-4 w-full text-center text-black text-sm opacity-60 pointer-events-none md:block hidden">
        (Kom click "No"...)
      </div>
      
      {/* Mobile Hint */}
      <div className="absolute top-4 w-full text-center text-pink-600 text-xs font-bold md:hidden animate-pulse pointer-events-none">
        {isRecovering ? "Grab your cursor back!" : "Use joystick to move cursor!"}
      </div>
    </div>
  );
};

export default App;