import React, { useState } from 'react';
import { ClientRecord } from '../../types';
import { AlfredTerminal } from '../AlfredTerminal';

interface DualCenterBayProps {
  selectedClient: ClientRecord | null;
  onUpdateClient?: (updated: ClientRecord) => void;
  onLogTerminal?: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

export const DualCenterBay: React.FC<DualCenterBayProps> = ({
  selectedClient,
  onUpdateClient,
  onLogTerminal,
}) => {
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);

  const handleToggleDeposit = () => {
    if (!selectedClient || !onUpdateClient) return;
    const nextVal = !selectedClient.DepositPaid;
    onUpdateClient({
      ...selectedClient,
      DepositPaid: nextVal,
    });
    onLogTerminal?.(`[Iron Gate] Deposit status updated to ${nextVal ? 'PAID' : 'DUE'} for ${selectedClient.Company_Name}`, 'action');
  };

  const handleUpdateRoadblock = (pebble: string) => {
    if (!selectedClient || !onUpdateClient) return;
    onUpdateClient({
      ...selectedClient,
      activePebble: pebble,
      roadblock: pebble,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs font-mono relative">
      {/* Top Header Pill / Toggle Bar */}
      <div className="mb-2 flex items-center justify-between border-b border-[#086375]/40 pb-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-sm font-bold text-[#DDFBD0]">Alfred Core</h2>
          <button
            type="button"
            onClick={() => setIsVitalsOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[0.62rem] font-bold transition-all cursor-pointer ${
              isVitalsOpen
                ? 'border border-[#E0CA3C] bg-[#E0CA3C] text-black shadow-[0_0_10px_rgba(224,202,60,0.4)]'
                : 'border border-[#086375] bg-[#086375]/20 text-[#E0CA3C] hover:border-[#E0CA3C] hover:bg-[#E0CA3C]/10'
            }`}
            title="Toggle Detailed Client Audit & Gate Vitals Panel"
          >
            <i className={`fa-solid fa-chevron-down text-[0.55rem] transition-transform ${isVitalsOpen ? 'rotate-180' : ''}`} />
            <span>{isVitalsOpen ? 'HIDE VITALS' : '▼ CLIENT AUDIT & GATE VITALS'}</span>
          </button>
        </div>

        <span className="font-mono text-[0.6rem] px-2 py-0.5 rounded bg-[#5F0F40]/70 border border-[#086375] text-[#E0CA3C] font-bold">
          SRC: {selectedClient ? (selectedClient.Company_Name || selectedClient.ClientID) : 'NO CLIENT ACTIVE'}
        </span>
      </div>

      {/* Base Layer: Alfred Conversational Terminal */}
      <div className="flex-1 min-h-0 relative">
        <AlfredTerminal activeUnit={selectedClient as any} />

        {/* Overlay Layer: Detailed Info Panel Dropdown Screen */}
        {isVitalsOpen && (
          <div className="absolute inset-0 z-20 flex flex-col rounded-lg border border-[#E0CA3C]/70 bg-[#020500]/95 backdrop-blur-md p-3 font-mono text-xs text-[#DDFBD0] shadow-[0_8px_32px_rgba(0,0,0,0.95)] animate-in fade-in slide-in-from-top-2 duration-150 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#086375]/40 pb-1.5 mb-2.5">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[#E0CA3C]">
                Iron Gate Compliance & Vital Audit
              </span>
              <span className="text-[0.6rem] text-[#DDFBD0]/60">
                {selectedClient?.Company_Name} ({selectedClient?.ClientID})
              </span>
            </div>

            {selectedClient ? (
              <div className="space-y-2.5 text-[0.65rem]">
                {/* Account Phase and Contract Value */}
                <div className="grid grid-cols-2 gap-2 bg-[#020500]/70 p-2 rounded border border-[#086375]/50">
                  <div>
                    <span className="text-[#DDFBD0]/50 uppercase block text-[0.55rem]">Account Phase:</span>
                    <span className="text-[#FE5F00] font-bold">{selectedClient.AccountPhase}</span>
                  </div>
                  <div>
                    <span className="text-[#DDFBD0]/50 uppercase block text-[0.55rem]">Total Value:</span>
                    <span className="text-[#E0CA3C] font-bold">${selectedClient.ContractValue?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Gate Checkboxes (Interactive Toggles) */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleToggleDeposit}
                    className={`p-2 rounded border text-left transition-colors cursor-pointer ${
                      selectedClient.DepositPaid
                        ? 'border-[#E0CA3C] bg-[#E0CA3C]/20 text-[#E0CA3C] font-bold'
                        : 'border-[#FE5F00] bg-[#FE5F00]/20 text-[#FE5F00] font-bold'
                    }`}
                  >
                    <div className="text-[0.55rem] uppercase opacity-70">Deposit Status</div>
                    <div>{selectedClient.DepositPaid ? '✓ PAID ($)' : '✗ DUE ($)'}</div>
                  </button>

                  <div className={`p-2 rounded border text-left ${
                    selectedClient.MSA_DocID
                      ? 'border-[#086375] bg-[#086375]/20 text-[#DDFBD0]'
                      : 'border-[#FE5F00]/60 bg-[#FE5F00]/10 text-[#FE5F00]'
                  }`}>
                    <div className="text-[0.55rem] uppercase opacity-70">MSA Status</div>
                    <div>{selectedClient.MSA_DocID ? '✓ EXECUTED' : '✗ MISSING'}</div>
                  </div>

                  <div className={`p-2 rounded border text-left ${
                    selectedClient.SOW_DocID
                      ? 'border-[#086375] bg-[#086375]/20 text-[#DDFBD0]'
                      : 'border-[#FE5F00]/60 bg-[#FE5F00]/10 text-[#FE5F00]'
                  }`}>
                    <div className="text-[0.55rem] uppercase opacity-70">SOW Status</div>
                    <div>{selectedClient.SOW_DocID ? '✓ SIGNED' : '✗ MISSING'}</div>
                  </div>
                </div>

                {/* Active Roadblock / Pebble Input */}
                <div className="bg-[#020500]/70 p-2 rounded border border-[#086375]/50">
                  <label className="text-[#DDFBD0]/60 uppercase block text-[0.55rem] mb-1">
                    Active Roadblock / Delivery Pebble:
                  </label>
                  <input
                    type="text"
                    value={selectedClient.activePebble || ''}
                    onChange={(e) => handleUpdateRoadblock(e.target.value)}
                    placeholder="Enter blocking pebble or delivery hurdle..."
                    className="w-full rounded border border-[#086375] bg-[#020500] px-2 py-1 text-xs text-[#DDFBD0] placeholder-[#DDFBD0]/30 focus:border-[#E0CA3C] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <p className="text-center py-6 text-[#DDFBD0]/50">
                Select a client account to audit Iron Gate vitals.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
