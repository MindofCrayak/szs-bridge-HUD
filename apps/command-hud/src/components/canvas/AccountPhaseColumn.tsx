import React from 'react';
import { AccountPhaseColumnConfig } from '../../data/pipeline';
import { ClientRecord } from '../../types';
import { ClientAccountCard } from './ClientAccountCard';

interface AccountPhaseColumnProps {
  config: AccountPhaseColumnConfig;
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
    <div className="w-[320px] shrink-0 flex flex-col rounded-xl border border-[#086375]/60 bg-[#020500]/70 backdrop-blur-sm overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="p-3 border-b border-[#086375]/50 bg-gradient-to-r from-[#0d1f18] to-[#05130e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-xs tracking-wider text-[#DDFBD0]">
            {config.title}
          </span>
          <span className="font-mono text-[0.6rem] px-1.5 py-0.5 rounded bg-[#5F0F40]/50 border border-[#086375] text-[#FE5F00] font-bold">
            {config.badge}
          </span>
        </div>
        <span className="font-mono text-xs font-bold text-[#E0CA3C]">
          {clients.length}
        </span>
      </div>

      {/* Cards Runway */}
      <div className="flex-1 min-h-[400px] max-h-[calc(100vh-360px)] overflow-y-auto p-2.5 space-y-2.5 canvas-pannable-bg">
        {clients.length === 0 ? (
          <div className="h-32 flex items-center justify-center font-mono text-[0.65rem] text-[#086375]/60 border border-dashed border-[#086375]/30 rounded-lg">
            No accounts in {config.title}
          </div>
        ) : (
          clients.map((client) => (
            <ClientAccountCard
              key={client.ClientID}
              client={client}
              isSelected={selectedClientId === client.ClientID}
              onSelect={() => onSelectClient(client.ClientID)}
              onDrillDown={onDrillDown}
              onContextMenu={onContextMenu}
            />
          ))
        )}
      </div>
    </div>
  );
};
