import { useState, useEffect, useRef, useCallback } from 'react';
import {
  playMechanicalClunk,
  playPowerUpGlide,
  playBypassSpark,
  startBackgroundHum,
} from '../utils/audioSynthesis';

export type BootStage = 0 | 1 | 2 | 3 | 4;

export interface ChassisLifecycleReturn {
  bootStage: BootStage;
  bypassBoot: () => void;
  isFullyOnline: boolean;
  isBypassed: boolean;
}

/**
 * useChassisLifecycle
 * 1. Immediate Boot Routine: Initiates immediately on component mount (no click needed).
 * 2. Autoplay Audio Safety: Wrapped in try/catch with one-time user interaction fallback
 *    so React timeline reaches Stage 4 without hanging if AudioContext is blocked.
 * 3. 5-Stage Staging:
 *    Stage 0 (Init) -> Stage 1 (Right pods in) -> Stage 2 (Left in) -> Stage 3 (Center drops) -> Stage 4 (Online Sync).
 * 4. Bypass: Any key or click clears timers and snaps to Stage 4.
 */
export function useChassisLifecycle(): ChassisLifecycleReturn {
  const [bootStage, setBootStage] = useState<BootStage>(0);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const timersRef = useRef<number[]>([]);
  const hasInitializedRef = useRef<boolean>(false);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const bypassBoot = useCallback(() => {
    if (bootStage === 4) return;
    clearAllTimers();
    setBootStage(4);
    setIsBypassed(true);
    try {
      playBypassSpark();
    } catch {}
  }, [bootStage, clearAllTimers]);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Start background hum safely
    let stopHum: () => void = () => {};
    try {
      stopHum = startBackgroundHum();
    } catch {}

    // Fallback: resume audio context on first interaction if blocked by autoplay policy
    const handleFirstInteraction = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        }
      } catch {}
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    // Staging Timeline: Guaranteed auto-advancement
    // 0 -> 1: 100ms
    const t1 = window.setTimeout(() => {
      setBootStage(1);
      try { playMechanicalClunk(90, 0.08); } catch {}
    }, 100);

    // 1 -> 2: 350ms
    const t2 = window.setTimeout(() => {
      setBootStage(2);
      try { playMechanicalClunk(130, 0.08); } catch {}
    }, 350);

    // 2 -> 3: 650ms
    const t3 = window.setTimeout(() => {
      setBootStage(3);
      try { playMechanicalClunk(180, 0.09); } catch {}
    }, 650);

    // 3 -> 4: 950ms (Fully Online)
    const t4 = window.setTimeout(() => {
      setBootStage(4);
      try { playPowerUpGlide(); } catch {}
    }, 950);

    timersRef.current = [t1, t2, t3, t4];

    // Global keydown bypass
    const handleKeyDown = (e: KeyboardEvent) => {
      if (bootStage < 4) {
        bypassBoot();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      clearAllTimers();
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('pointerdown', handleFirstInteraction);
      try { stopHum(); } catch {}
    };
  }, [bypassBoot, clearAllTimers]);

  return {
    bootStage,
    bypassBoot,
    isFullyOnline: bootStage === 4,
    isBypassed,
  };
}
