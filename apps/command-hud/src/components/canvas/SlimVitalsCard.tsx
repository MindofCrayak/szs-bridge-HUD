import React from 'react';
import { ClientRecord } from '../../types';

interface SlimVitalsCardProps {
  client: ClientRecord;
  isSelected: boolean;
  onSelect: () => void;
  onDrillDown: (client: ClientRecord) => void;
  onContextMenu: (e: React.MouseEvent, client: ClientRecord) => void;
}

const STAGE_ORDER: Record<string, number> = {
  '00: Discovery': 0,
  '01: Vibecheck': 1,
  '02: Contract & Inception': 2,
  '03: Deep Intelligence': 3,
  '04: Session Zero Kickoff': 4,
  '05: Architecture & Builds': 5,
  '06: Mid-Flight Review': 6,
  '07: Final Staging & QA': 7,
  '08: Liftoff & Handover': 8,
  '09: Sunset / Retainer': 9,
};

const PHASE_ORDER: Record<string, number> = {
  '01: Intake': 0,
  '02: Session Zero': 1,
  '03: Active Sprints': 2,
  '04: Liftoff': 3,
  '05: Complete': 4,
  '06: Archived/Sunset': 5,
};

function getInitials(name: string): string {
  if (!name) return 'SZ';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * SlimVitalsCard (Canvas Card Surface)
 * - Dimensions: 100% width, p-2.5, bg #020500, border #086375/60 (or #E0CA3C with glow when selected).
 * - Left Cluster: 42px radial SVG status engine with monogram + radial tracer.
 * - Top Header: Company_Name, ClientID, and Iron Gate padlock (🔓 vs 🔒).
 * - Dual-Track Velocity Indicators:
 *    - AccountPhase Track: 6 micro-blocks in Radar Teal (#086375).
 *    - SprintStage Track: 10 micro-blocks in Imperial Plum (#5F0F40) with active block pulsing.
 * - Bottom Telemetry Strip:
 *    - [💰 1/3 CLR] vs [💰 1/3 DUE]
 *    - [✉️ MCC: #X]
 *    - [☑️ Tasks: X/Y]
 */
export const SlimVitalsCard: React.FC<SlimVitalsCardProps> = ({
  client,
  isSelected,
  onSelect,
  onDrillDown,
  onContextMenu,
}) => {
  const activeProject = client.activeProjects?.[0];
  const sprintStageName = activeProject?.SprintStage || '00: Discovery';
  const stageIndex = STAGE_ORDER[sprintStageName] ?? 0;
  const phaseIndex = PHASE_ORDER[client.AccountPhase] ?? 0;

  // SVG tracer math: 42px circle (r=18), circumference = 2 * PI * 18 = 113.1
  const circumference = 113.1;
  const progressRatio = Math.min(1, Math.max(0, stageIndex / 9));
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Tracer color logic
  let tracerColor = '#DDFBD0'; // Mana Green (nominal)
  if (!client.DepositPaid || (client.roadblock && client.roadblock !== 'None')) {
    tracerColor = '#FE5F00'; // Plasma Orange (alert / deposit unpaid / roadblock)
  } else if (stageIndex === 6 || stageIndex === 7) {
    tracerColor = '#E0CA3C'; // Gold (review / staging QA)
  }

  const monogram = getInitials(client.Company_Name);
  const tasksDone = activeProject?.MilestonesDone ?? 1;
  const tasksTotal = activeProject?.MilestonesTotal ?? 4;
  const mccStep = stageIndex + 1;

  return (
    <div
      onClick={(e) => {
        if (e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, client);
          return;
        }
        onSelect();
      }}
      onContextMenu={(e) => onContextMenu(e, client)}
      className={`relative w-full rounded-xl p-2.5 transition-all cursor-pointer select-none border backdrop-blur-md ${
        isSelected
          ? 'border-[#E0CA3C] bg-gradient-to-br from-[#0d1f18] via-[#05130e] to-[#020500] shadow-[0_0_16px_rgba(224,202,60,0.4)]'
          : 'border-[#086375]/60 bg-[#020500] hover:border-[#E0CA3C]/70 hover:shadow-[0_0_12px_rgba(8,99,117,0.3)]'
      }`}
    >
      <div className="flex gap-2.5 items-start">
        {/* Left Cluster: 42px Radial SVG Status Engine */}
        <div className="relative shrink-0 w-[42px] h-[42px] flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
            {/* Background Track */}
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="#086375"
              strokeWidth="2.5"
              opacity="0.3"
            />
            {/* Progress Tracer */}
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke={tracerColor}
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          {/* Monogram Badge */}
          <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-[0.68rem] text-[#DDFBD0] tracking-wider">
            {monogram}
          </div>
        </div>

        {/* Center / Right Content */}
        <div className="flex-1 min-w-0">
          {/* Top Header: Company Name + Client ID + Padlock */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <h3
              className="font-display font-bold text-xs text-[#DDFBD0] truncate"
              title={client.Company_Name}
            >
              {client.Company_Name || client.ClientID}
            </h3>
            <div className="flex items-center gap-1 shrink-0 font-mono text-[0.6rem]">
              <span className="text-[#E0CA3C] font-semibold">{client.ClientID}</span>
              <span
                title={client.DepositPaid ? 'Iron Gate: Deposit Cleared' : 'Iron Gate: Deposit Due'}
                className="cursor-default text-[0.7rem]"
              >
                {client.DepositPaid ? '🔓' : '🔒'}
              </span>
            </div>
          </div>

          {/* Dual-Track Velocity Indicators */}
          <div className="space-y-1 mb-2">
            {/* 1. AccountPhase Track: 6 micro-blocks (Radar Teal) */}
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  title={`Phase 0${idx + 1}`}
                  className={`h-1 flex-1 rounded-xs transition-colors ${
                    idx <= phaseIndex
                      ? 'bg-[#086375] shadow-[0_0_4px_#086375]'
                      : 'bg-[#086375]/25'
                  }`}
                />
              ))}
            </div>

            {/* 2. SprintStage Track: 10 micro-blocks (Imperial Plum) */}
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((idx) => {
                const isActive = idx === stageIndex;
                const isPast = idx < stageIndex;
                return (
                  <div
                    key={idx}
                    title={`Sprint Stage 0${idx}`}
                    className={`h-1.5 flex-1 rounded-xs transition-colors ${
                      isActive
                        ? 'bg-[#E0CA3C] shadow-[0_0_6px_#E0CA3C] animate-pulse'
                        : isPast
                        ? 'bg-[#5F0F40]'
                        : 'bg-[#5F0F40]/30'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom Telemetry Strip (Zero-Click Ticker) */}
          <div className="flex flex-wrap items-center justify-between gap-1 font-mono text-[0.55rem]">
            {/* Deposit Badge */}
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                client.DepositPaid
                  ? 'bg-[#E0CA3C]/20 border border-[#E0CA3C] text-[#E0CA3C]'
                  : 'bg-[#FE5F00]/20 border border-[#FE5F00] text-[#FE5F00]'
              }`}
            >
              {client.DepositPaid ? '💰 1/3 CLR' : '💰 1/3 DUE'}
            </span>

            {/* MCC Step */}
            <span className="px-1.5 py-0.5 rounded bg-[#086375]/20 border border-[#086375]/50 text-[#DDFBD0]/80">
              ✉️ MCC: #{mccStep}
            </span>

            {/* Tasks Progress */}
            <span className="px-1.5 py-0.5 rounded bg-[#5F0F40]/30 border border-[#5F0F40]/60 text-[#DDFBD0]/80">
              ☑️ Tasks: {tasksDone}/{tasksTotal}
            </span>
          </div>
        </div>
      </div>

      {/* In-Place Sprint Drilldown Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDrillDown(client);
        }}
        className="w-full mt-2 flex items-center justify-center gap-1.5 py-1 rounded border border-[#086375] bg-[#086375]/15 hover:border-[#E0CA3C] hover:bg-[#E0CA3C]/10 font-mono text-[0.58rem] text-[#DDFBD0] transition-colors"
        title="Drill down into 10 granular sprint stages for this client"
      >
        <i className="fa-solid fa-layer-group text-[#E0CA3C]" />
        <span>SPRINT STAGE VIEW ➔</span>
      </button>
    </div>
  );
};
