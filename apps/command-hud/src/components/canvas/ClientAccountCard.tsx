import React from 'react';
import { ClientRecord } from '../../types';

interface ClientAccountCardProps {
  client: ClientRecord;
  isSelected: boolean;
  onSelect: () => void;
  onDrillDown: (client: ClientRecord) => void;
  onForceAdvance?: (client: ClientRecord) => void;
  onContextMenu: (e: React.MouseEvent, client: ClientRecord) => void;
}

export const ClientAccountCard: React.FC<ClientAccountCardProps> = ({
  client,
  isSelected,
  onSelect,
  onDrillDown,
  onContextMenu,
}) => {
  const activeCount = client.activeProjects ? client.activeProjects.length : 1;

  return (
    <div
      onClick={onSelect}
      onContextMenu={(e) => onContextMenu(e, client)}
      className={`relative w-full rounded-lg p-3 transition-all cursor-pointer select-none border backdrop-blur-md ${
        isSelected
          ? 'border-[#E0CA3C] bg-gradient-to-br from-[#0d1f18] via-[#05130e] to-[#020500] shadow-[0_0_16px_rgba(224,202,60,0.35)]'
          : 'border-[#086375]/60 bg-gradient-to-br from-[#0d1f18]/80 via-[#05130e]/85 to-[#020500]/90 hover:border-[#E0CA3C]/70 hover:shadow-[0_0_10px_rgba(8,99,117,0.3)]'
      }`}
    >
      {/* Top Header: Company & Client ID */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <div className="overflow-hidden">
          <h3 className="font-display font-bold text-xs text-[#DDFBD0] truncate" title={client.Company_Name}>
            {client.Company_Name || client.ClientID}
          </h3>
          <p className="font-mono text-[0.62rem] text-[#DDFBD0]/65 truncate">
            {client.PrimaryContact || 'Primary Contact Unset'}
          </p>
        </div>
        <span className="shrink-0 font-mono text-[0.58rem] font-bold px-1.5 py-0.5 rounded bg-[#5F0F40]/80 border border-[#086375] text-[#E0CA3C]">
          {client.ClientID}
        </span>
      </div>

      {/* Contract Value & Projects Count */}
      <div className="flex items-center justify-between font-mono text-xs my-2 pb-1.5 border-b border-[#086375]/30">
        <span className="text-[#E0CA3C] font-bold">
          ${client.ContractValue ? client.ContractValue.toLocaleString() : '0'}
        </span>
        <span className="text-[0.62rem] text-[#DDFBD0]/70">
          {activeCount} {activeCount === 1 ? 'Project' : 'Projects'}
        </span>
      </div>

      {/* Compliance / Iron Gate Micro-Badges */}
      <div className="flex flex-wrap items-center gap-1 font-mono text-[0.55rem] mb-2">
        <span className={`px-1.5 py-0.5 rounded font-bold ${
          client.DepositPaid 
            ? 'bg-[#E0CA3C]/20 border border-[#E0CA3C] text-[#E0CA3C]' 
            : 'bg-[#FE5F00]/20 border border-[#FE5F00] text-[#FE5F00]'
        }`}>
          {client.DepositPaid ? '✓ DEP PAID' : '! DEP DUE'}
        </span>
        <span className={`px-1.5 py-0.5 rounded ${
          client.MSA_DocID 
            ? 'bg-[#086375]/30 border border-[#086375] text-[#DDFBD0]' 
            : 'bg-[#5F0F40]/30 border border-[#5F0F40] text-[#DDFBD0]/50'
        }`}>
          {client.MSA_DocID ? 'MSA READY' : 'NO MSA'}
        </span>
        <span className={`px-1.5 py-0.5 rounded ${
          client.SOW_DocID 
            ? 'bg-[#086375]/30 border border-[#086375] text-[#DDFBD0]' 
            : 'bg-[#5F0F40]/30 border border-[#5F0F40] text-[#DDFBD0]/50'
        }`}>
          {client.SOW_DocID ? 'SOW READY' : 'NO SOW'}
        </span>
      </div>

      {/* In-Place Sprint Drilldown Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDrillDown(client);
        }}
        className="w-full flex items-center justify-center gap-1.5 py-1 rounded border border-[#086375] bg-[#086375]/20 hover:border-[#E0CA3C] hover:bg-[#E0CA3C]/10 font-mono text-[0.62rem] text-[#DDFBD0] transition-colors"
        title="Drill down into 10 granular sprint stages for this client"
      >
        <i className="fa-solid fa-layer-group text-[#E0CA3C]" />
        <span>SPRINT STAGE VIEW ➔</span>
      </button>
    </div>
  );
};
