import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientRecord, CommandKey } from '../../types';
import { CalendarBay } from './CalendarBay';
import { DualCenterBay } from './DualCenterBay';
import { ClientDossierBay } from './ClientDossierBay';
import { MacroPadBay } from './MacroPadBay';
import { CalendarMeetingEvent, CalendarSource } from '../CalendarConnectorModal';
import { useChassisLifecycle } from '../../hooks/useChassisLifecycle';

interface BottomConsoleChassisProps {
  selectedClient: ClientRecord | null;
  onUpdateClient?: (updated: ClientRecord) => void;
  onTriggerCommand: (key: CommandKey) => void;
  onLogTerminal?: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
  controlGroups?: Record<number, string[]>;
  activeGroupNum?: number | null;
  onRecallControlGroup?: (group: number) => void;
  calendarSources?: CalendarSource[];
  calendarMeetings?: CalendarMeetingEvent[];
  onOpenFeedConfig?: () => void;
}

// Heavy Cassettecore spring transition
const heavySpring = {
  type: 'spring' as const,
  stiffness: 75,
  damping: 18,
  mass: 1.1,
};

export const BottomConsoleChassis: React.FC<BottomConsoleChassisProps> = ({
  selectedClient,
  onUpdateClient,
  onTriggerCommand,
  onLogTerminal,
  controlGroups = {},
  activeGroupNum = 1,
  onRecallControlGroup,
  calendarSources,
  calendarMeetings,
  onOpenFeedConfig,
}) => {
  const { bootStage, bypassBoot, isFullyOnline, isBypassed } = useChassisLifecycle();

  return (
    <footer
      onClick={bypassBoot}
      className="relative z-30 mt-auto flex h-[41vh] min-h-[310px] w-full flex-col select-none shrink-0 overflow-hidden bg-transparent p-3 pt-1"
    >
      {/* 
        NO SHARED GOLD ROOF BANNER.
        4 Physically Separated, Layered Cassettecore Mechanical Pods (gap-4).
        Each pod features 3 distinct physical layers:
          Layer 1 (Base): Dark stamped metal (bg-[#0d1513] border-2 border-[#1a2b27])
          Layer 2 (Core): Negative space cutout with animated CSS scanlines (bg-[#040706])
          Layer 3 (Faceplate): The operational bay UI
      */}
      <div 
        onClick={(e) => {
          // If clicking on the wrapper between pods, trigger bypass
          if (e.target === e.currentTarget) bypassBoot();
        }}
        className="flex h-full w-full gap-4 min-h-0"
      >
        {/* POD 1: CALENDAR BAY (Enters at Stage 2 from the Left) */}
        <motion.div
          initial={{ x: -160, opacity: 0 }}
          animate={{
            x: bootStage >= 2 ? 0 : -160,
            opacity: bootStage >= 2 ? 1 : 0,
          }}
          transition={heavySpring}
          style={{ width: 'var(--bay-calendar-w, var(--bay-calendar-ratio, 280px))' }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex min-h-0 shrink-0 flex-col rounded-xl border-2 border-[#1a2b27] bg-[#0d1513] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
        >
          {/* Layer 2: Core Cutout with Scanlines */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#040706] p-2.5 border border-[#086375]/30">
            <div className="crm-grid pointer-events-none absolute inset-0 opacity-20" />
            
            {/* Layer 3: Faceplate UI */}
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <CalendarBay
                sources={calendarSources}
                meetings={calendarMeetings}
                onOpenFeedConfig={onOpenFeedConfig}
              />
            </div>
          </div>
        </motion.div>

        {/* POD 2: ALFRED CORE DUAL CENTER BAY (Drops at Stage 3 from Above) */}
        <motion.div
          initial={{ y: -180, opacity: 0 }}
          animate={{
            y: bootStage >= 3 ? 0 : -180,
            opacity: bootStage >= 3 ? 1 : 0,
          }}
          transition={heavySpring}
          onClick={(e) => e.stopPropagation()}
          className="relative flex min-h-0 flex-1 flex-col rounded-xl border-2 border-[#1a2b27] bg-[#0d1513] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
        >
          {/* Layer 2: Core Cutout with Scanlines */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#040706] p-2.5 border border-[#086375]/40 shadow-[inset_0_0_20px_rgba(8,99,117,0.15)]">
            <div className="crm-grid pointer-events-none absolute inset-0 opacity-25" />

            {/* Layer 3: Faceplate UI */}
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <DualCenterBay
                selectedClient={selectedClient}
                onUpdateClient={onUpdateClient}
                onLogTerminal={onLogTerminal}
              />
            </div>
          </div>
        </motion.div>

        {/* POD 3: CLIENT DOSSIER BAY (Enters at Stage 1 from the Right) */}
        <motion.div
          initial={{ x: 140, opacity: 0 }}
          animate={{
            x: bootStage >= 1 ? 0 : 140,
            opacity: bootStage >= 1 ? 1 : 0,
          }}
          transition={heavySpring}
          style={{ width: 'var(--bay-dossier-w, var(--bay-dossier-ratio, 270px))' }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex min-h-0 shrink-0 flex-col rounded-xl border-2 border-[#1a2b27] bg-[#0d1513] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
        >
          {/* Layer 2: Core Cutout with Scanlines */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#040706] p-2.5 border border-[#086375]/30">
            <div className="crm-grid pointer-events-none absolute inset-0 opacity-20" />

            {/* Layer 3: Faceplate UI */}
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <ClientDossierBay client={selectedClient} />
            </div>
          </div>
        </motion.div>

        {/* POD 4: HARDWARE MACRO PAD BAY (Enters at Stage 1 from the Bottom/Right) */}
        <motion.div
          initial={{ y: 160, opacity: 0 }}
          animate={{
            y: bootStage >= 1 ? 0 : 160,
            opacity: bootStage >= 1 ? 1 : 0,
          }}
          transition={heavySpring}
          style={{ width: 'var(--bay-macro-w, var(--bay-macro-ratio, 280px))' }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex min-h-0 shrink-0 flex-col rounded-xl border-2 border-[#1a2b27] bg-[#0d1513] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
        >
          {/* Layer 2: Core Cutout with Scanlines */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#040706] p-2 border border-[#086375]/30">
            <div className="crm-grid pointer-events-none absolute inset-0 opacity-20" />

            {/* Layer 3: Faceplate UI */}
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <MacroPadBay onTriggerCommand={onTriggerCommand} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actionable Micro-Status Rail under the bays */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="mt-1 flex h-4 items-center justify-between px-2 font-mono text-[0.58rem] text-[#DDFBD0]/50 shrink-0"
      >
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${isFullyOnline ? 'bg-[#E0CA3C] shadow-[0_0_6px_#E0CA3C]' : 'bg-[#FE5F00] animate-ping'}`} />
          <span>
            {isFullyOnline ? 'ALL PODS SYNCHRONIZED // 55Hz GENERATOR NOMINAL' : `STAGING LIFE-CYCLE: STAGE 0${bootStage}/04 (TAP TO SNAP)`}
          </span>
        </div>

        <div className="flex gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => onRecallControlGroup?.(group)}
              title={`Client Slot ${group}${controlGroups[group]?.length ? ` (${controlGroups[group].length} linked)` : ''} (Shift+${group} to bind)`}
              className={`transition-colors cursor-pointer ${
                activeGroupNum === group ? 'text-[#FE5F00] font-bold' : 'hover:text-[#E0CA3C]'
              }`}
            >
              [{group}]
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
};
