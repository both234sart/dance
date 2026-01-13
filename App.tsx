import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CustomCursor } from './components/CustomCursor';
import { PrankHand } from './components/PrankHand';
import { Point, PrankState } from './types';
import { Heart, Stars } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  // Real mouse position (from system events) - used for offset calculation
  const [realMousePos, setRealMousePos] = useState<Point>({ x: -100, y: -100 });
  const realMousePosRef = useRef<Point>({ x: -100, y: -100 });
  
  // Visual cursor position (what the user sees)
  const [visualCursorPos, setVisualCursorPos] = useState<Point>({ x: -100, y: -100 });
  
  // Hand position
  const [handPos, setHandPos] = useState<Point>({ x: -200, y: -200 }); // Start offscreen
  
  // Prank State Machine
  const [prankState, setPrankState] = useState<PrankState>(PrankState.IDLE);
  
  // Refs for logic
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const prankStateRef = useRef<PrankState>(PrankState.IDLE); // Ref to access state inside animation frame
  const animationFrameRef = useRef<number>();
  const targetDragPos = useRef<Point>({ x: 0, y: 0 });
  const didAccept = useRef<boolean>(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Offset between real mouse and visual cursor (created when hand drags mouse)
  const cursorOffsetRef = useRef<Point>({ x: 0, y: 0 });

  // Custom hover state for Yes button since real mouse isn't over it
  const [isYesHovered, setIsYesHovered] = useState(false);

  // Sync ref with state
  useEffect(() => {
    prankStateRef.current = prankState;
  }, [prankState]);

  // --- Handlers ---

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const newPos = { x: e.clientX, y: e.clientY };
    setRealMousePos(newPos);
    realMousePosRef.current = newPos;

    // If we are IDLE or COOLDOWN, visual cursor follows real mouse + offset
    if (prankStateRef.current === PrankState.IDLE || prankStateRef.current === PrankState.COOLDOWN) {
      setVisualCursorPos({
        x: newPos.x + cursorOffsetRef.current.x,
        y: newPos.y + cursorOffsetRef.current.y
      });
    }
  }, []);

  const handleSuccess = useCallback(() => {
    didAccept.current = true;
    setIsSuccess(true);
  }, []);

  // Reset offset on mouse enter (re-entering the page)
  useEffect(() => {
    const handleMouseEnter = () => {
      // Reset the offset so the cursor snaps back to the real mouse
      cursorOffsetRef.current = { x: 0, y: 0 };
    };

    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    return () => document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
  }, []);

  // Global click handler to support offset cursor
  useEffect(() => {
    const handleClick = () => {
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
      const noBtn = noButtonRef.current;
      const yesBtn = yesButtonRef.current;

      if (!noBtn || !yesBtn) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Check Yes Button Hover (Visual Collision)
      const yesRect = yesBtn.getBoundingClientRect();
      const isOverYes = 
        visualCursorPos.x >= yesRect.left && 
        visualCursorPos.x <= yesRect.right && 
        visualCursorPos.y >= yesRect.top && 
        visualCursorPos.y <= yesRect.bottom;
      
      // We use a ref/state check to avoid setting state loop constantly
      if (isOverYes !== isYesHovered) {
         setIsYesHovered(isOverYes);
      }

      // 1. Check Trigger Condition (Only if IDLE)
      if (currentState === PrankState.IDLE) {
        const noRect = noBtn.getBoundingClientRect();
        
        // Strict hitbox check: Only trigger if visual cursor overlaps the button
        const isOverNo = 
            visualCursorPos.x >= noRect.left && 
            visualCursorPos.x <= noRect.right && 
            visualCursorPos.y >= noRect.top && 
            visualCursorPos.y <= noRect.bottom;

        if (isOverNo) {
            // TRIGGER PRANK
            setPrankState(PrankState.ENTERING);
            // Initialize hand position off-screen (right side)
            setHandPos({ x: window.innerWidth + 150, y: visualCursorPos.y + 50 });
        }
      }

      // 2. Handle Animation States
      if (currentState === PrankState.ENTERING) {
        // Move hand towards visual cursor
        const dx = visualCursorPos.x - handPos.x;
        const dy = visualCursorPos.y - handPos.y;
        
        // SLOWED DOWN: Was 0.1, now 0.03
        setHandPos(prev => ({
            x: prev.x + dx * 0.03,
            y: prev.y + dy * 0.03
        }));

        // If close enough, Grab
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            setPrankState(PrankState.GRABBING);
            // Determine a random safe spot away from the button
            const safeX = Math.random() > 0.5 ? window.innerWidth * 0.1 : window.innerWidth * 0.9;
            const safeY = Math.random() * (window.innerHeight * 0.8);
            targetDragPos.current = { x: safeX, y: safeY };
            
            // Pause to show the grab action
            setTimeout(() => {
                setPrankState(PrankState.DRAGGING);
            }, 300);
        }
      } 
      else if (currentState === PrankState.GRABBING) {
        // Hand stays on cursor
        setHandPos(visualCursorPos);
      }
      else if (currentState === PrankState.DRAGGING) {
        // Move Hand towards safe spot
        const tx = targetDragPos.current.x;
        const ty = targetDragPos.current.y;
        
        const hdx = tx - handPos.x;
        const hdy = ty - handPos.y;

        // SLOWED DOWN: Was 0.08, now 0.02
        const nextHandX = handPos.x + hdx * 0.02;
        const nextHandY = handPos.y + hdy * 0.02;

        setHandPos({ x: nextHandX, y: nextHandY });
        
        // Cursor is stuck to hand
        setVisualCursorPos({ x: nextHandX, y: nextHandY });

        // If we reached target
        const distToTarget = Math.sqrt(hdx*hdx + hdy*hdy);
        if (distToTarget < 20) {
            // CALCULATE OFFSET HERE
            cursorOffsetRef.current = {
                x: nextHandX - realMousePosRef.current.x,
                y: nextHandY - realMousePosRef.current.y
            };

            setPrankState(PrankState.LEAVING);
            setTimeout(() => {
                setPrankState(PrankState.COOLDOWN);
                // Reset cooldown after a bit
                setTimeout(() => setPrankState(PrankState.IDLE), 1500);
            }, 500);
        }
      }
      else if (currentState === PrankState.LEAVING) {
        // Hand moves away
        // SLOWED DOWN: Was +15, now +5
        setHandPos(prev => ({
            x: prev.x + 5,
            y: prev.y + 5
        }));

        setVisualCursorPos({
            x: realMousePosRef.current.x + cursorOffsetRef.current.x,
            y: realMousePosRef.current.y + cursorOffsetRef.current.y
        });
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [realMousePos, visualCursorPos, handPos, isYesHovered]); // Dependencies

  // --- Render ---

  if (isSuccess) {
    return (
        <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center relative overflow-hidden">
             <CustomCursor position={realMousePos} isGrabbing={false} />
             <div className="animate-bounce mb-8">
                 <Heart className="w-24 h-24 text-red-500 fill-red-500" />
             </div>
             <h1 className="text-4xl md:text-6xl font-bold text-pink-600 text-center mb-4">
                 YAY! I Knew It!
             </h1>
             <p className="text-xl text-pink-400">Can't wait for our dance! 💃🐻</p>
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
      {/* Background Elements */}
      <div className="absolute top-10 left-10 text-pink-200 opacity-50 animate-pulse">
        <Stars size={48} />
      </div>
      <div className="absolute bottom-10 right-10 text-blue-200 opacity-50 animate-pulse delay-700">
        <Stars size={64} />
      </div>

      {/* The Visual Custom Cursor */}
      <CustomCursor 
        position={visualCursorPos} 
        isGrabbing={prankState === PrankState.GRABBING || prankState === PrankState.DRAGGING} 
      />

      {/* The Prank Hand */}
      <PrankHand 
        position={handPos} 
        state={prankState} 
      />

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-screen px-4 z-10 relative">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/50 max-w-md w-full text-center transform transition-transform hover:scale-[1.02]">
            
            <div className="mb-6 relative group flex justify-center">
                {/* Replaced Image with the specific Cute Mocha Bear GIF */}
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
                Please say yes! I promise I have great dance moves.
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
                    Yes, absolutely!
                </button>

                <button
                    ref={noButtonRef}
                    className="px-8 py-3 bg-red-500 text-white font-bold rounded-full shadow-lg transition-colors focus:outline-none opacity-90 cursor-none"
                >
                    No
                </button>
            </div>
        </div>
      </main>

      {/* Helper text for context if needed */}
      <div className="absolute bottom-4 w-full text-center text-gray-400 text-sm opacity-60">
        (Try to click "No"...)
      </div>
    </div>
  );
};

export default App;