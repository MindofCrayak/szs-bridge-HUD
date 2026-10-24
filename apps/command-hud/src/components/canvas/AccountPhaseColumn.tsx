import React from 'react';
import { ClientRecord } from '../../types';
import { SlimVitalsCard } from './SlimVitalsCard';

export interface AccountPhaseConfigDef {
  id: string;
  phase: string;
  title: string;
  badge?: string;
  color?: string;
  stages?: string[];
}

interface AccountPhaseColumnProps {
  config: AccountPhaseConfigDef;
  clients: ClientRecord[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onDrillDown: (client: ClientRecord) => void;
  onContextMenu: (e: React.MouseEvent, client: ClientRecord) => void;
}

// Fallback color palette matching pipeline phases
const PHASE_COLORS: Record<string, string> = {
  'phase-01': '#086375',
  'phase-02': '#3C91E6',
  'phase-03': '#5F0F40',
  'phase-04': '#E0CA3C',
  'phase-05': '#DDFBD0',
  'phase-06': '#8A9A86',
};

// Phase to stage sequences fallback mapping
const PHASE_STAGES: Record<string, string[]> = {
  '01: Intake': ['00: Discovery', '01: Vibecheck'],
  '02: Session Zero': ['02: Contract & Inception', '03: Deep Intelligence'],
  '03: Active Sprints': ['04: Kickoff', '05: Builds', '06: Review', '07: Staging & QA'],
  '04: Liftoff': ['08: Liftoff & Handover'],
  '05: Complete': ['Complete'],
  '06: Archived/Sunset': ['09: Sunset / Retainer'],
};

export const AccountPhaseColumn: React.FC<AccountPhaseColumnProps> = ({
  config,
  clients,
  selectedClientId,
  onSelectClient,
  onDrillDown,
  onContextMenu,
}) => {
  const color = config.color || PHASE_COLORS[config.id] || '#086375';
  const stageList = Array.isArray(config.stages) && config.stages.length > 0
    ? config.stages
    : (PHASE_STAGES[config.phase] || [config.badge || config.title]);

  return (
    <div className="w-[360px] min-w-[360px] h-full flex flex-col rounded-xl border border-[#086375]/60 bg-[#020500]/95 backdrop-blur-md shadow-lg overflow-hidden shrink-0">
      {/* Column Header */}
      <div 
        className="px-3 py-2 border-b flex items-center justify-between shrink-0 select-none"
        style={{ borderColor: `${color}50`, backgroundColor: `${color}15` }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span 
            className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: color, color: color }}
          />
          <span className="font-display font-bold text-xs text-[#DDFBD0] tracking-wider truncate">
            {config.title}
          </span>
        </div>
        <span 
          className="font-mono text-[0.65rem] font-bold px-1.5 py-0.5 rounded border"
          style={{ borderColor: color, color: color, backgroundColor: `${color}20` }}
        >
          {clients.length}
        </span>
      </div>

      {/* Column Description / Stage Sequence */}
      <div className="px-3 py-1 bg-[#020500]/70 border-b border-[#086375]/30 text-[0.62rem] font-mono text-[#DDFBD0]/60 truncate">
        {stageList.join(' · ')}
      </div>

      {/* Cards Runway */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
        {clients.map((client) => (
          <SlimVitalsCard
            key={client.ClientID}
            client={client}
            isSelected={selectedClientId === client.ClientID}
            onSelect={() => onSelectClient(client.ClientID)}
            onDrillDown={onDrillDown}
            onContextMenu={onContextMenu}
          />
        ))}

        {clients.length === 0 && (
          <div className="h-28 border border-dashed border-[#086375]/30 rounded-lg flex items-center justify-center font-mono text-[0.65rem] text-[#DDFBD0]/40 text-center px-4">
            No active nodes in {config.title}
          </div>
        )}
      </div>
    </div>
  );
};
