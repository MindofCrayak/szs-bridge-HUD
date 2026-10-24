import React from 'react';
import { AccountPhaseConfig, ClientRecord } from '../../types';
import { SlimVitalsCard } from './SlimVitalsCard';

interface AccountPhaseColumnProps {
  config: AccountPhaseConfig;
  clients: ClientRecord[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onDrillDown: (client: ClientRecord) => void;
  onContextMenu: (e: React.MouseEvent, client: ClientRecord) => void;
}

export const AccountPhaseColumn: React.FC<AccountPhaseColumnProps> = ({
  config,
  clients,
  selectedClientId,
  onSelectClient,
  onDrillDown,
  onContextMenu,
}) => {
  return (
    <div className="w-[360px] min-w-[360px] h-full flex flex-col rounded-xl border border-[#086375]/60 bg-[#020500]/95 backdrop-blur-md shadow-lg overflow-hidden shrink-0">
      {/* Column Header */}
      <div 
        className="px-3 py-2 border-b flex items-center justify-between shrink-0 select-none"
        style={{ borderColor: `${config.color}50`, backgroundColor: `${config.color}15` }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span 
            className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: config.color, color: config.color }}
          />
          <span className="font-display font-bold text-xs text-[#DDFBD0] tracking-wider truncate">
            {config.title}
          </span>
        </div>
        <span 
          className="font-mono text-[0.65rem] font-bold px-1.5 py-0.5 rounded border"
          style={{ borderColor: config.color, color: config.color, backgroundColor: `${config.color}20` }}
        >
          {clients.length}
        </span>
      </div>

      {/* Column Description / Stage Sequence */}
      <div className="px-3 py-1 bg-[#020500]/70 border-b border-[#086375]/30 text-[0.62rem] font-mono text-[#DDFBD0]/60 truncate">
        {config.stages.join(' · ')}
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
