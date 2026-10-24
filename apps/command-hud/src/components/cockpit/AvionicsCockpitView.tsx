import React from 'react';
import { DepartmentReportScreen } from './DepartmentReportScreen';
import { PersonaRadialPod } from './PersonaRadialPod';
import { HologramDropChutePod } from './HologramDropChutePod';

interface AvionicsCockpitViewProps {
  onClose?: () => void;
}

export const AvionicsCockpitView: React.FC<AvionicsCockpitViewProps> = ({ onClose }) => {
  return (
    <div className="w-full h-full max-w-[762px] min-h-[1366px] bg-[#020500] text-[#DDFBD0] border-2 border-[#086375] flex flex-col justify-between overflow-hidden relative shadow-[0_0_50px_rgba(8,99,117,0.4)] select-none">
      {/* Top Thin Outer Frame & Widget Gauge Mount */}
      <div className="h-14 border-b border-[#086375] bg-gradient-to-r from-[#0d1f18] via-[#05130e] to-[#020500] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E0CA3C] shadow-[0_0_8px_#E0CA3C] animate-pulse" />
          <span className="font-display font-bold text-xs tracking-wider text-[#E0CA3C]">
            SZS AVIONICS COCKPIT // 762×1366 PORTRAIT
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 rounded border border-[#FE5F00] text-[#FE5F00] text-xs font-mono hover:bg-[#FE5F00] hover:text-black transition-colors cursor-pointer"
          >
            DISMISS
          </button>
        )}
      </div>

      {/* Central Department Report Runway */}
      <DepartmentReportScreen />

      {/* Dual Corner Instrument Bays & Slim Action Strip */}
      <div className="p-3 border-t-2 border-[#086375] bg-gradient-to-t from-[#0d1f18] to-[#020500] shrink-0">
        <div className="flex items-end justify-between gap-3 mb-2">
          {/* Bottom-Left: Persona Radial Pod */}
          <PersonaRadialPod />

          {/* Slim Action Strip */}
          <div className="flex-1 flex items-center justify-center gap-1.5 font-mono text-[0.62rem]">
            <button
              type="button"
              onClick={() => alert('Synchronizing Master Control SSOT across all Google Workspace tables...')}
              className="px-2.5 py-1.5 rounded border border-[#086375] bg-[#086375]/20 text-[#DDFBD0] hover:border-[#E0CA3C] hover:text-[#E0CA3C] transition-colors cursor-pointer font-bold"
            >
              SYNC ALL
            </button>
            <button
              type="button"
              onClick={() => alert('Exporting Master Control state payload to JSON...')}
              className="px-2.5 py-1.5 rounded border border-[#086375] bg-[#086375]/20 text-[#DDFBD0] hover:border-[#E0CA3C] hover:text-[#E0CA3C] transition-colors cursor-pointer font-bold"
            >
              EXPORT JSON
            </button>
            <button
              type="button"
              onClick={() => alert('Purging local HUD telemetry caches...')}
              className="px-2.5 py-1.5 rounded border border-[#5F0F40] bg-[#5F0F40]/20 text-[#FE5F00] hover:bg-[#FE5F00] hover:text-black transition-colors cursor-pointer font-bold"
            >
              PURGE CACHE
            </button>
          </div>

          {/* Bottom-Right: 30px Radial Corner Hologram & Drop Chute */}
          <HologramDropChutePod />
        </div>

        <div className="text-center font-mono text-[0.55rem] text-[#086375]/60 uppercase tracking-widest border-t border-[#086375]/30 pt-1">
          COCKPIT AVIONICS TELEMETRY // 9 O&apos;CLOCK ORIENTATION VERIFIED
        </div>
      </div>
    </div>
  );
};
