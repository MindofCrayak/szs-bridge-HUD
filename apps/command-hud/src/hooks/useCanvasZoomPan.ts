import { useState, useEffect, useRef, useCallback } from 'react';

interface CanvasZoomPanState {
  scale: number;
  position: { x: number; y: number };
}

interface UseCanvasZoomPanReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
  position: { x: number; y: number };
  resetZoom: () => void;
  canvasStyle: React.CSSProperties;
  isPanning: boolean;
}

export function useCanvasZoomPan(initialScale = 1.0): UseCanvasZoomPanReturn {
  const [state, setState] = useState<CanvasZoomPanState>({
    scale: initialScale,
    position: { x: 0, y: 0 },
  });
  const [isPanning, setIsPanning] = useState(false);
  const startPan = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Ctrl + Wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
        setState((prev) => ({
          ...prev,
          scale: Math.min(Math.max(0.65, prev.scale + zoomDelta), 1.35),
        }));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Middle-click pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      startPan.current = {
        x: e.clientX - state.position.x,
        y: e.clientY - state.position.y,
      };
    }
  }, [state.position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setState((prev) => ({
      ...prev,
      position: {
        x: e.clientX - startPan.current.x,
        y: e.clientY - startPan.current.y,
      },
    }));
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Attach pan handlers to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        startPan.current = {
          x: e.clientX - state.position.x,
          y: e.clientY - state.position.y,
        };
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      setState((prev) => ({
        ...prev,
        position: {
          x: e.clientX - startPan.current.x,
          y: e.clientY - startPan.current.y,
        },
      }));
    };
    const onMouseUp = () => setIsPanning(false);

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isPanning, state.position]);

  const resetZoom = useCallback(() => {
    setState({ scale: 1.0, position: { x: 0, y: 0 } });
  }, []);

  const canvasStyle: React.CSSProperties = {
    transform: `translate(${state.position.x}px, ${state.position.y}px) scale(${state.scale})`,
    transformOrigin: 'top left',
    transition: isPanning ? 'none' : 'transform 0.15s ease-out',
  };

  return {
    containerRef,
    scale: state.scale,
    position: state.position,
    resetZoom,
    canvasStyle,
    isPanning,
  };
}
