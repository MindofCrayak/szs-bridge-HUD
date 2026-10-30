import React, { useState } from 'react';
import { ClientRecord } from '../../types';
import { AlfredTerminal } from '../AlfredTerminal';
import { ClientDetailInspector } from './ClientDetailInspector';
import { PendingProposal } from '../../ecs/proposals';

interface DualCenterBayProps {
  selectedClient: ClientRecord | null;
  onUpdateClient?: (updated: ClientRecord) => void;
  onLogTerminal?: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
  onProposal?: (proposal: PendingProposal) => void;
}

export const DualCenterBay: React.FC<DualCenterBayProps> = ({
  selectedClient,
  onUpdateClient,
  onLogTerminal,
  onProposal,
}) => {
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs font-mono relative">
      {/* Top Header Pill / Toggle Bar */}
      <div className="mb-2 flex items-center justify-between border-b border-[#086375]/40 pb-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-sm font-bold text-[#DDFBD0]">Alfred Core</h2>
          <button
            type="button"
            onClick={() => setIsInspectorOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[0.62rem] font-bold transition-all cursor-pointer ${
              isInspectorOpen
                ? 'border border-[#E0CA3C] bg-[#E0CA3C] text-black shadow-[0_0_10px_rgba(224,202,60,0.4)]'
                : 'border border-[#086375] bg-[#086375]/20 text-[#E0CA3C] hover:border-[#E0CA3C] hover:bg-[#E0CA3C]/10'
            }`}
            title="Toggle Detailed Client Audit & Gate Vitals Panel"
          >
            <i className={`fa-solid fa-chevron-down text-[0.55rem] transition-transform ${isInspectorOpen ? 'rotate-180' : ''}`} />
            <span>{isInspectorOpen ? 'HIDE VITALS' : '▼ CLIENT AUDIT & GATE VITALS'}</span>
          </button>
        </div>

        <span className="font-mono text-[0.6rem] px-2 py-0.5 rounded bg-[#5F0F40]/70 border border-[#086375] text-[#E0CA3C] font-bold">
          SRC: {selectedClient ? (selectedClient.Company_Name || selectedClient.ClientID) : 'NO CLIENT ACTIVE'}
        </span>
      </div>

      {/* Base Layer: Alfred Conversational Terminal */}
      <div className="flex-1 min-h-0 relative">
        <AlfredTerminal activeUnit={selectedClient as any} onProposal={onProposal} />

        {/* Slide-Down Center Overlay: ClientDetailInspector */}
        {isInspectorOpen && selectedClient && (
          <ClientDetailInspector
            client={selectedClient}
            onClose={() => setIsInspectorOpen(false)}
            onUpdateClient={onUpdateClient}
            onLogTerminal={onLogTerminal}
          />
        )}
      </div>
    </div>
  );
};
