import React, { useState } from 'react';

export const PersonaRadialPod: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Live workload percentages
  const workloads = {
    dolores: 75, // Plum #5F0F40
    vala: 50,    // Gold #E0CA3C
    pamela: 40,  // Green #DDFBD0
    daisy: 85,   // Coral #FE5F00
  };

  return (
    <div className="relative">
      {/* Concentric Activity Pod (Clickable) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-2 rounded-xl border border-[#086375] bg-[#020500]/90 hover:border-[#E0CA3C] shadow-[0_0_15px_rgba(8,99,117,0.3)] transition-all cursor-pointer"
        title="Open Subroutine Workload Rings & Operational Dial"
      >
        <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
          {/* Ring 1 (Dolores - Outer, r=18) */}
          <circle cx="22" cy="22" r="18" fill="none" stroke="#5F0F40" strokeWidth="2.5" opacity="0.3" />
          <circle 
            cx="22" cy="22" r="18" fill="none" stroke="#5F0F40" strokeWidth="2.5"
            strokeDasharray={113.1} strokeDashoffset={113.1 * (1 - workloads.dolores / 100)}
            strokeLinecap="round" transform="rotate(-90 22 22)"
          />

          {/* Ring 2 (Vala - Mid, r=14) */}
          <circle cx="22" cy="22" r="14" fill="none" stroke="#E0CA3C" strokeWidth="2.5" opacity="0.3" />
          <circle 
            cx="22" cy="22" r="14" fill="none" stroke="#E0CA3C" strokeWidth="2.5"
            strokeDasharray={88} strokeDashoffset={88 * (1 - workloads.vala / 100)}
            strokeLinecap="round" transform="rotate(-90 22 22)"
          />

          {/* Ring 3 (Pamela - Inner, r=10) */}
          <circle cx="22" cy="22" r="10" fill="none" stroke="#DDFBD0" strokeWidth="2.5" opacity="0.3" />
          <circle 
            cx="22" cy="22" r="10" fill="none" stroke="#DDFBD0" strokeWidth="2.5"
            strokeDasharray={62.8} strokeDashoffset={62.8 * (1 - workloads.pamela / 100)}
            strokeLinecap="round" transform="rotate(-90 22 22)"
          />

          {/* Center Core (Daisy Coral, r=5) */}
          <circle cx="22" cy="22" r="5" fill="#FE5F00" className="animate-pulse" />
        </svg>

        <div className="font-mono text-left">
          <div className="text-[0.62rem] font-bold text-[#E0CA3C]">WORKLOAD POD</div>
          <div className="text-[0.52rem] text-[#DDFBD0]/60">CONCENTRIC GAUGES</div>
        </div>
      </button>

      {/* Expanded Control Dashboard Modal */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-72 rounded-xl border border-[#E0CA3C] bg-[#020500]/95 backdrop-blur-md p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.9)] z-50 font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-[#086375]/50 pb-1.5 mb-2.5">
            <span className="font-bold text-[#E0CA3C] text-[0.68rem] uppercase">
              Subroutine Workload Runway
            </span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[#FE5F00] hover:text-white font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-[0.65rem]">
            <div className="flex items-center justify-between p-1.5 rounded bg-[#5F0F40]/20 border border-[#5F0F40]">
              <span className="text-[#DDFBD0] font-bold">Dolores Herbig</span>
              <span className="text-[#E0CA3C]">{workloads.dolores}% (3 Sprints)</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-[#E0CA3C]/10 border border-[#E0CA3C]">
              <span className="text-[#DDFBD0] font-bold">Vala Mal Doran</span>
              <span className="text-[#E0CA3C]">{workloads.vala}% (1/3rd Milestones)</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-[#DDFBD0]/10 border border-[#DDFBD0]">
              <span className="text-[#DDFBD0] font-bold">Pamela Landy</span>
              <span className="text-[#DDFBD0]">{workloads.pamela}% (2 Leads Ingested)</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-[#FE5F00]/20 border border-[#FE5F00]">
              <span className="text-[#DDFBD0] font-bold">Daisy Adare</span>
              <span className="text-[#FE5F00]">{workloads.daisy}% (Broadcast Queued)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
