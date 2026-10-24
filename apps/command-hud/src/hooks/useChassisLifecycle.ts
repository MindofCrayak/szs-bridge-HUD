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
 * Interruptible 5-Stage Boot Timeline (Stages 0 - 4)
 * Stage 0: Base boot (silent, frame initialization)
 * Stage 1: Right in (Bay 4 Macro Pad & Bay 3 Dossier slide up)
 * Stage 2: Left in (Bay 1 Calendar slides in)
 * Stage 3: Center drops (Bay 2 Alfred Terminal drops from above)
 * Stage 4: Online Sync (All bays link, telemetry hum nominal)
 *
 * Bypass: Keydown or click clears timeouts, snaps to 4, and plays spark.
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
    playBypassSpark();
  }, [bootStage, clearAllTimers]);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Start background hum once active
    const stopHum = startBackgroundHum();

    // Schedule progressive stages
    // 0 -> 1: 150ms
    const t1 = window.setTimeout(() => {
      setBootStage(1);
      playMechanicalClunk(90, 0.08);
    }, 150);

    // 1 -> 2: 450ms
    const t2 = window.setTimeout(() => {
      setBootStage(2);
      playMechanicalClunk(130, 0.08);
    }, 450);

    // 2 -> 3: 750ms
    const t3 = window.setTimeout(() => {
      setBootStage(3);
      playMechanicalClunk(180, 0.09);
    }, 750);

    // 3 -> 4: 1050ms
    const t4 = window.setTimeout(() => {
      setBootStage(4);
      playPowerUpGlide();
    }, 1050);

    timersRef.current = [t1, t2, t3, t4];

    // Global keydown bypass listener
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept inputs or functional keys if user is typing
      if (bootStage < 4) {
        bypassBoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      clearAllTimers();
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      stopHum();
    };
  }, [bypassBoot, clearAllTimers]);

  return {
    bootStage,
    bypassBoot,
    isFullyOnline: bootStage === 4,
    isBypassed,
  };
}
