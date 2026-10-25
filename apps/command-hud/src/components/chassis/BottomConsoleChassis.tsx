import React from 'react';
import { motion } from 'framer-motion';
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
  const { bootStage, bypassBoot } = useChassisLifecycle();

  return (
    <footer
      className="relative z-30 mt-auto flex w-full flex-row gap-6 select-none shrink-0 p-3 pt-1 bg-transparent pointer-events-none"
      style={{ transform: 'scale(var(--ui-scale, 1))', transformOrigin: 'bottom center' }}
    >
      {/* Bay 1: Calendar Bay */}
      <motion.div
        initial={{ x: -160, opacity: 0 }}
        animate={{
          x: bootStage >= 2 ? 0 : -160,
          opacity: bootStage >= 2 ? 1 : 0,
        }}
        transition={heavySpring}
        className="h-[38vh] min-h-[290px] shrink-0 pointer-events-auto flex flex-col rounded-xl border-2 border-[#1a2b27] bg-[#0d1513] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
        style={{ width: 'var(--bay-calendar-w, 280px)' }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#040706] p-2.5 border border-[#086375]/30">
          <div className="crm-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <CalendarBay
              sources={calendarSources}
              meetings={calendarMeetings}
              onOpenFeedConfig={onOpenFeedConfig}
            />
          </div>
        </div>
      </motion.div>

      {/* Bay 2: Dual Center Bay (Alfred & Inspector) */}
      <motion.div
        initial={{ y: -180, opacity: 0 }}
        animate={{
          y: bootStage >= 3 ? 0 : -180,
          opacity: bootStage >= 3 ? 1 : 0,
        }}
        transition={heavySpring}
        className="h-[38vh] min-h-[290px] flex-1 min-w-[320px] pointer-events-auto flex flex-col rounded-xl border-2 border-[#1a2b27] bg-[#0d1513] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
        style={{ width: 'var(--bay-center-w, 420px)' }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#040706] p-2.5 border border-[#086375]/40 shadow-[inset_0_0_20px_rgba(8,99,117,0.15)]">
          <div className="crm-grid pointer-events-none absolute inset-0 opacity-25" />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <DualCenterBay
              selectedClient={selectedClient}
              onUpdateClient={onUpdateClient}
              onLogTerminal={onLogTerminal}
            />
          </div>
        </div>
      </motion.div>

      {/* Bay 3: Client Dossier Bay */}
      <motion.div
        initial={{ x: 140, opacity: 0 }}
        animate={{
          x: bootStage >= 1 ? 0 : 140,
          opacity: bootStage >= 1 ? 1 : 0,
        }}
        transition={heavySpring}
        className="h-[38vh] min-h-[290px] shrink-0 pointer-events-auto flex flex-col rounded-xl border-2 border-[#1a2b27] bg-[#0d1513] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
        style={{ width: 'var(--bay-dossier-w, 270px)' }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#040706] p-2.5 border border-[#086375]/30">
          <div className="crm-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <ClientDossierBay client={selectedClient} />
          </div>
        </div>
      </motion.div>

      {/* Bay 4: Macro Pad Bay */}
      <motion.div
        initial={{ y: 160, opacity: 0 }}
        animate={{
          y: bootStage >= 2 ? 0 : 160,
          opacity: bootStage >= 2 ? 1 : 0,
        }}
        transition={heavySpring}
        className="h-[38vh] min-h-[290px] shrink-0 pointer-events-auto flex flex-col rounded-xl border-2 border-[#1a2b27] bg-[#0d1513] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.85)]"
        style={{ width: 'var(--bay-macro-w, 280px)' }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#040706] p-2.5 border border-[#086375]/30">
          <div className="crm-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <MacroPadBay
              onTriggerCommand={onTriggerCommand}
              controlGroups={controlGroups}
              activeGroupNum={activeGroupNum}
              onRecallControlGroup={onRecallControlGroup}
            />
          </div>
        </div>
      </motion.div>
    </footer>
  );
};
