import React, { useRef, useEffect } from 'react';

interface TacticalCanvasProps {
  scale: number;
  setScale: (scale: number | ((prev: number) => number)) => void;
  children: React.ReactNode;
}

export const TacticalCanvas: React.FC<TacticalCanvasProps> = ({ scale, setScale, children }) => {
  const viewportRef = useRef<HTMLDivElement>(null);

  // Wheel listener with non-passive flag to reliably intercept Alt + Scroll
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        setScale((prev: number) => Math.min(Math.max(0.60, Number((prev + delta).toFixed(2))), 1.40));
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setScale]);

  return (
    <div 
      ref={viewportRef}
      className="relative flex-1 w-full h-full overflow-hidden select-none bg-[#020500]"
    >
      {/* Scalable Matrix Layer */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${(1 / Math.max(scale, 0.1)) * 100}%`,
          height: `${(1 / Math.max(scale, 0.1)) * 100}%`,
          transition: 'transform 75ms ease-out',
        }}
        className="flex gap-4 p-4 min-h-full"
      >
        {children}
      </div>
    </div>
  );
};
