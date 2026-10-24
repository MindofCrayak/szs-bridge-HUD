/**
 * Web Audio Synthesis Engine for Crystalpunk / Cassettecore Command Bridge
 * Generates analog mechanical relays, clunks, power glide, and 55Hz continuous hum.
 */

let audioCtx: AudioContext | null = null;
let humOsc: OscillatorNode | null = null;
let humGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    // Resume on interaction
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playMechanicalClunk(pitch = 120, duration = 0.08) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function playPowerUpGlide() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

export function playPowerDownDrain() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export function playBypassSpark() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Short high frequency crackle
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.02);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
}

export function startBackgroundHum(): () => void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return () => {};

    if (humOsc) return () => {};

    humOsc = ctx.createOscillator();
    humGain = ctx.createGain();

    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(55, ctx.currentTime); // 55Hz continuous generator hum

    humGain.gain.setValueAtTime(0.008, ctx.currentTime);

    humOsc.connect(humGain);
    humGain.connect(ctx.destination);

    humOsc.start();

    return () => {
      try {
        if (humOsc) {
          humOsc.stop();
          humOsc.disconnect();
          humOsc = null;
        }
        if (humGain) {
          humGain.disconnect();
          humGain = null;
        }
      } catch {}
    };
  } catch {
    return () => {};
  }
}
