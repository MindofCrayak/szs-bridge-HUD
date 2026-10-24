import { useState, useEffect, useRef, useCallback } from 'react';

export interface CanvasTransformReturn {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
  pan: { x: number; y: number };
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  resetTransform: () => void;
  isPanning: boolean;
  transformStyle: React.CSSProperties;
}

export function useCanvasTransform(initialScale = 1.0): CanvasTransformReturn {
  const [scale, setScale] = useState<number>(initialScale);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number }>({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  // Non-passive wheel handler for Alt + Scroll Wheel zoom
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        setScale((prev) => Math.min(Math.max(0.60, Number((prev + delta).toFixed(2))), 1.40));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Left-drag (on canvas background) or middle-click drag anywhere
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan if middle click (button 1) OR left click on empty background
    const isMiddleClick = e.button === 1;
    const isBackgroundLeftClick = e.button === 0 && (
      e.target === viewportRef.current ||
      e.target === stageRef.current ||
      (e.target as HTMLElement).classList.contains('canvas-pannable-bg')
    );

    if (isMiddleClick || isBackgroundLeftClick) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialPanX: pan.x,
        initialPanY: pan.y,
      };
    }
  }, [pan.x, pan.y]);

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      setPan({
        x: panStartRef.current.initialPanX + dx,
        y: panStartRef.current.initialPanY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  const resetTransform = useCallback(() => {
    setScale(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const transformStyle: React.CSSProperties = {
    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
    transformOrigin: 'top left',
    width: `${(1 / Math.max(scale, 0.1)) * 100}%`,
    height: `${(1 / Math.max(scale, 0.1)) * 100}%`,
    transition: isPanning ? 'none' : 'transform 75ms ease-out',
  };

  return {
    viewportRef,
    stageRef,
    scale,
    pan,
    setScale,
    setPan,
    resetTransform,
    isPanning,
    transformStyle,
  };
}
