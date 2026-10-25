import { useState, useEffect, useRef, useCallback } from 'react';

export interface CanvasTransformReturn {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
  pan: { x: number; y: number };
  setScale: (value: number | ((prev: number) => number)) => void;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  resetTransform: () => void;
  isPanning: boolean;
  transformStyle: React.CSSProperties;
  handlePointerDown: (e: React.PointerEvent) => void;
}

export function useCanvasTransform(
  externalScale?: number,
  externalSetScale?: (value: number | ((prev: number) => number)) => void,
): CanvasTransformReturn {
  const [internalScale, setInternalScale] = useState<number>(1.0);
  const scale = externalScale !== undefined ? externalScale : internalScale;
  const setScale = externalSetScale !== undefined ? externalSetScale : setInternalScale;

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
  }, [setScale]);

  // Pointer-down handler attached to outermost canvas wrapper
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const isMiddleClick = e.button === 1;
    const target = e.target as HTMLElement | null;
    const isBackground = target === viewportRef.current ||
      target === stageRef.current ||
      target?.classList.contains('canvas-pannable-bg') ||
      target?.getAttribute('data-canvas-bg') === 'true' ||
      target?.getAttribute('data-theme') !== null;

    if (isMiddleClick || (e.button === 0 && isBackground)) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialPanX: pan.x,
        initialPanY: pan.y,
      };
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
    }
  }, [pan.x, pan.y]);

  useEffect(() => {
    if (!isPanning) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      setPan({
        x: panStartRef.current.initialPanX + dx,
        y: panStartRef.current.initialPanY + dy,
      });
    };

    const handlePointerUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isPanning]);

  const resetTransform = useCallback(() => {
    setScale(1.0);
    setPan({ x: 0, y: 0 });
  }, [setScale]);

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
    handlePointerDown,
  };
}
