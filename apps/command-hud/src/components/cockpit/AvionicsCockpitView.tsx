import React from 'react';
import { DepartmentHeaderTray } from '../canvas/DepartmentHeaderTray';
import { DepartmentReportScreen } from './DepartmentReportScreen';
import { PersonaRadialPod } from './PersonaRadialPod';
import { HologramDropChutePod } from './HologramDropChutePod';

interface AvionicsCockpitViewProps {
  onClose?: () => void;
  activeSprintCount?: number;
  totalMrr?: number;
  activeClientName?: string;
}

/**
 * Display 2: The Avionics Cockpit View (762x1366 Portrait, 9 o'clock orientation)
 * 1. Height bound: h-screen max-h-[1366px] overflow-hidden.
 * 2. Header isolation: Desktop nav headers, view tabs, and status gauges completely stripped.
 * 3. Department HUD Ribbon: Mounted EXCLUSIVELY at the top of Display 2.
 * 4. Central Runway: 100% vertical focus on active Department telemetry.
 * 5. Bottom Corner Instruments:
 *    - Left: Persona Radial Pod (concentric SVG activity rings).
 *    - Right: Hologram Drop-Chute Pod (30px radial curve, FIFO queue, drag-over file routing).
 * 6. Slim Action Strip: [SYNC ALL] [PURGE CACHE] [POLICE AUDIT] flush between corner bays.
 */
export const AvionicsCockpitView: React.FC<AvionicsCockpitViewProps> = ({
  onClose,
  activeSprintCount = 3,
  totalMrr = 146200,
  activeClientName,
}) => {
  return (
    <div className="w-[762px] h-screen max-h-[1366px] max-w-[762px] bg-[#020500] text-[#DDFBD0] border-2 border-[#1a2b27] flex flex-col justify-between overflow-hidden relative shadow-[0_0_60px_rgba(8,99,117,0.4)] select-none">
      {/* Top Thin Frame with Dismiss */}
      <div className="h-6 border-b border-[#086375]/60 bg-[#0d1513] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E0CA3C] shadow-[0_0_6px_#E0CA3C]" />
          <span className="font-mono text-[0.58rem] tracking-widest text-[#E0CA3C] uppercase">
            SZS AVIONICS TELEMETRY TOWER // 762×1366 PORTRAIT
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[0.55rem] text-[#FE5F00] hover:text-white px-1.5 py-0.5 rounded border border-[#FE5F00]/40 hover:bg-[#FE5F00] hover:text-black transition-colors cursor-pointer"
          >
            DISMISS ✕
          </button>
        )}
      </div>

      {/* Department Telemetry Ribbon: Mounted EXCLUSIVELY at the top of Display 2 */}
      <div className="shrink-0">
        <DepartmentHeaderTray
          activeSprintCount={activeSprintCount}
          totalMrr={totalMrr}
          activeClientName={activeClientName}
        />
      </div>

      {/* Central Vertical Runway: 100% Focus on Department Telemetry */}
      <div className="flex-1 min-h-0 flex flex-col p-2.5 overflow-hidden">
        <div className="flex-1 min-h-0 rounded-xl border border-[#086375]/60 bg-[#040706] p-1 shadow-[inset_0_0_24px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
          <DepartmentReportScreen />
        </div>
      </div>

      {/* Bottom Instrument Pods & Action Strip */}
      <div className="p-3 border-t-2 border-[#1a2b27] bg-[#0d1513] shrink-0">
        <div className="flex items-end justify-between gap-3">
          {/* Bottom-Left: Persona Radial Pod (Concentric Activity Rings) */}
          <div className="shrink-0">
            <PersonaRadialPod />
          </div>

          {/* Action Strip: Single Row Flush Utility Buttons */}
          <div className="flex-1 flex items-center justify-center gap-2 pb-1 font-mono text-[0.62rem]">
            <button
              type="button"
              onClick={() => alert('[AVIONICS] Synchronizing Master Control across all Google Workspace tables...')}
              className="px-2.5 py-2 rounded-lg border border-[#086375] bg-[#086375]/20 text-[#DDFBD0] hover:border-[#E0CA3C] hover:text-[#E0CA3C] transition-all cursor-pointer font-bold shadow-[0_0_10px_rgba(8,99,117,0.2)]"
            >
              [SYNC ALL]
            </button>
            <button
              type="button"
              onClick={() => alert('[AVIONICS] Purging local HUD telemetry caches...')}
              className="px-2.5 py-2 rounded-lg border border-[#5F0F40] bg-[#5F0F40]/25 text-[#FE5F00] hover:bg-[#FE5F00] hover:text-black transition-all cursor-pointer font-bold shadow-[0_0_10px_rgba(254,95,0,0.2)]"
            >
              [PURGE CACHE]
            </button>
            <button
              type="button"
              onClick={() => alert('[POLICE] System Police Engine Health: NOMINAL. Zero gate breaches detected.')}
              className="px-2.5 py-2 rounded-lg border border-[#086375] bg-[#086375]/20 text-[#DDFBD0] hover:border-[#E0CA3C] hover:text-[#E0CA3C] transition-all cursor-pointer font-bold shadow-[0_0_10px_rgba(8,99,117,0.2)]"
            >
              [POLICE AUDIT]
            </button>
          </div>

          {/* Bottom-Right: Hologram Comms & 30px Radial Corner Drop-Chute */}
          <div className="shrink-0">
            <HologramDropChutePod />
          </div>
        </div>
      </div>
    </div>
  );
};
