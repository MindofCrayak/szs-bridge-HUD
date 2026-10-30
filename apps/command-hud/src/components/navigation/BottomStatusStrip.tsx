import React from 'react';
import { HudTelemetry, TerminalLog } from '../../types';

interface BottomStatusStripProps {
  telemetry: HudTelemetry | null;
  isBackendConnected: boolean;
  latestLog: TerminalLog | null;
}

export const BottomStatusStrip: React.FC<BottomStatusStripProps> = ({
  telemetry,
  isBackendConnected,
  latestLog,
}) => {
  return (
    <div className="h-[24px] shrink-0 border-t border-[#086375]/40 bg-[#020500]/95 px-3 flex items-center justify-between font-mono text-[0.6rem] text-[#DDFBD0]/70 select-none z-20">
      {/* Left: Backend & Police Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[#DDFBD0]/90 font-bold">
            {isBackendConnected ? 'BRIDGE CONNECTED' : 'OFFLINE'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[#086375]">
          <span>|</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>POLICE ENGINE NOMINAL</span>
        </div>
      </div>

      {latestLog && (
        <div
          className="hidden min-w-0 flex-1 truncate px-4 text-text-mana/55 lg:block"
          title={latestLog.text}
          aria-label={`Latest activity at ${latestLog.time}`}
        >
          <span className="text-highlight-gold">{latestLog.time}</span> {latestLog.text}
        </div>
      )}

      {/* Right: Key Metrics Strip */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[#DDFBD0]/50">PIPELINE:</span>
          <span className="text-[#E0CA3C] font-bold">
            ${telemetry ? (telemetry.pipelineMrr ?? 0).toLocaleString() : '0'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[#DDFBD0]/50">SPRINTS:</span>
          <span className="text-[#3C91E6] font-bold">
            {telemetry ? telemetry.activeSprints : 0}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <span className="text-[#DDFBD0]/50">GA4:</span>
          <span className="text-[#DDFBD0]/90">14 LIVE</span>
        </div>
      </div>
    </div>
  );
};
