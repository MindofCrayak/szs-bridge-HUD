import React, { useState } from 'react';
import { ClientRecord } from '../../types';

interface ClientDetailInspectorProps {
  client: ClientRecord;
  onClose: () => void;
  onUpdateClient?: (updated: ClientRecord) => void;
  onLogTerminal?: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

type InspectorTab = 'runway' | 'complexity' | 'sentiment' | 'tasks' | 'overrides';

export const ClientDetailInspector: React.FC<ClientDetailInspectorProps> = ({
  client,
  onClose,
  onUpdateClient,
  onLogTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('runway');
  const [terminalInput, setTerminalInput] = useState('');

  const activeProject = client.activeProjects?.[0];
  const sprintStageName = activeProject?.SprintStage || '00: Discovery';

  const handleToggleDeposit = () => {
    if (!onUpdateClient) return;
    const nextVal = !client.DepositPaid;
    onUpdateClient({
      ...client,
      DepositPaid: nextVal,
    });
    onLogTerminal?.(
      `[Iron Gate] Deposit status updated to ${nextVal ? 'PAID' : 'DUE'} for ${client.Company_Name}`,
      'action'
    );
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    onLogTerminal?.(
      `[Dock Terminal // ${client.Company_Name}] ${terminalInput.trim()}`,
      'normal'
    );
    setTerminalInput('');
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col rounded-xl border-2 border-[#E0CA3C] bg-[#020500]/98 backdrop-blur-md p-3 font-mono text-xs text-[#DDFBD0] shadow-[0_8px_32px_rgba(0,0,0,0.95)] animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
      {/* Header: Company Name, ClientID, Current Stage, Close Button */}
      <div className="flex items-center justify-between border-b border-[#086375]/50 pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-display font-bold text-sm text-[#E0CA3C] truncate">
            {client.Company_Name}
          </span>
          <span className="text-[0.62rem] px-1.5 py-0.5 rounded bg-[#5F0F40]/80 border border-[#086375] text-[#E0CA3C] shrink-0 font-bold">
            {client.ClientID}
          </span>
          <span className="text-[0.62rem] text-[#DDFBD0]/60 shrink-0 truncate">
            {sprintStageName}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-[#FE5F00] hover:text-white px-2 py-0.5 rounded border border-[#FE5F00]/50 hover:bg-[#FE5F00] hover:text-black transition-colors cursor-pointer shrink-0 font-bold"
          title="Close Inspector"
        >
          [X] CLOSE
        </button>
      </div>

      {/* 5 Sub-Tabs */}
      <div className="flex items-center border-b border-[#086375]/40 mb-2 text-[0.6rem] font-bold shrink-0">
        {[
          { id: 'runway', label: '[1. SPRINT RUNWAY]' },
          { id: 'complexity', label: '[2. COMPLEXITY]' },
          { id: 'sentiment', label: '[3. SENTIMENT]' },
          { id: 'tasks', label: '[4. TASKS]' },
          { id: 'overrides', label: '[5. OVERRIDES]' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as InspectorTab)}
            className={`flex-1 py-1 text-center transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-b-2 border-[#E0CA3C] text-[#E0CA3C] bg-[#E0CA3C]/10'
                : 'text-[#DDFBD0]/60 hover:text-[#DDFBD0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Body: Scrollable 220px Frame */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 text-[0.65rem] pr-1">
        {activeTab === 'runway' && (
          <div className="space-y-2">
            {/* Current Sprint Objective */}
            <div className="p-2 rounded bg-[#086375]/15 border border-[#086375]/40">
              <span className="text-[#E0CA3C] uppercase text-[0.55rem] block font-bold mb-0.5">
                Current Sprint Objective:
              </span>
              <p className="text-[#DDFBD0]/90">
                {activeProject?.Title || 'Core CRM Architecture, Inception Deposit Clearance & Workspace Auth'}
              </p>
            </div>

            {/* Time-to-Next-Drop & Cadence Meter */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-[#020500]/70 border border-[#086375]/30">
                <span className="text-[#DDFBD0]/50 uppercase text-[0.55rem] block">Next Demo Walkthrough:</span>
                <span className="text-[#FE5F00] font-bold">In 3 Days (Thursday 14:00)</span>
              </div>
              <div className="p-2 rounded bg-[#020500]/70 border border-[#086375]/30">
                <span className="text-[#DDFBD0]/50 uppercase text-[0.55rem] block">45-Day Cadence:</span>
                <span className="text-[#E0CA3C] font-bold">Day 14 of 42 (On Schedule)</span>
              </div>
            </div>

            {/* Contract Value & Phase */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-[#020500]/70 border border-[#086375]/30">
                <span className="text-[#DDFBD0]/50 uppercase text-[0.55rem] block">Account Phase:</span>
                <span className="text-[#DDFBD0] font-bold">{client.AccountPhase}</span>
              </div>
              <div className="p-2 rounded bg-[#020500]/70 border border-[#086375]/30">
                <span className="text-[#DDFBD0]/50 uppercase text-[0.55rem] block">Contract Value:</span>
                <span className="text-[#E0CA3C] font-bold">${client.ContractValue?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'complexity' && (
          <div className="grid grid-cols-2 gap-2">
            {/* Quick Wins Column */}
            <div className="p-2 rounded bg-[#086375]/10 border border-[#086375]/40 space-y-1">
              <span className="text-[#DDFBD0] font-bold uppercase text-[0.58rem] block pb-1 border-b border-[#086375]/30">
                ⚡ Quick Wins (&lt;15m)
              </span>
              <ul className="space-y-1 text-[#DDFBD0]/80">
                <li>• SPF / DKIM / DMARC verification</li>
                <li>• Google Group routing alias</li>
                <li>• Shared Sanctum folder shortcut</li>
                <li>• Client Slack / Chat webhook bridge</li>
              </ul>
            </div>

            {/* Deep Architectural Builds */}
            <div className="p-2 rounded bg-[#5F0F40]/15 border border-[#5F0F40]/50 space-y-1">
              <span className="text-[#FE5F00] font-bold uppercase text-[0.58rem] block pb-1 border-b border-[#5F0F40]/30">
                🏛️ Deep Architectural Builds
              </span>
              <ul className="space-y-1 text-[#DDFBD0]/80">
                <li>• Apps Script Master Control triggers</li>
                <li>• OAuth consent & Service Account IAM</li>
                <li>• Multi-tab SSOT formula normalization</li>
                <li>• Milestone billing escrow webhook</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'sentiment' && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded bg-[#020500]/70 border border-[#086375]/30 text-center">
                <span className="text-[#DDFBD0]/50 text-[0.55rem] uppercase block">Score</span>
                <span className="text-[#E0CA3C] font-bold text-sm">⭐ 4.8 / 5.0</span>
              </div>
              <div className="p-2 rounded bg-[#020500]/70 border border-[#086375]/30 text-center">
                <span className="text-[#DDFBD0]/50 text-[0.55rem] uppercase block">Cadence</span>
                <span className="text-[#DDFBD0] font-bold text-xs">🟢 &lt;4hrs response</span>
              </div>
              <div className="p-2 rounded bg-[#020500]/70 border border-[#086375]/30 text-center">
                <span className="text-[#DDFBD0]/50 text-[0.55rem] uppercase block">Touchpoint</span>
                <span className="text-[#FE5F00] font-bold text-xs">2 days since touch</span>
              </div>
            </div>

            <div className="p-2 rounded bg-[#086375]/15 border border-[#086375]/40 italic text-[#DDFBD0]/90">
              &ldquo;The Session Zero command bridge is exactly what we needed to eliminate our cross-department delivery bottlenecks.&rdquo;
              <span className="block text-[0.55rem] text-[#E0CA3C] not-italic mt-1">
                — {client.PrimaryContact || 'Primary Stakeholder'}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[0.58rem] text-[#DDFBD0]/60 border-b border-[#086375]/30 pb-1">
              <span>DELIVERABLE</span>
              <span>STATUS</span>
            </div>
            {[
              { text: '01. Discovery intake & archetype profiling', done: true },
              { text: '02. Inception deposit wire clearance', done: client.DepositPaid },
              { text: '03. Google Workspace SANCTUM provisioning', done: true },
              { text: '04. SOW execution & milestone sprint signoff', done: Boolean(client.SOW_DocID) },
              { text: '05. Architecture build & Google Apps Script deploy', done: false },
            ].map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-[#086375]/10 border border-[#086375]/30">
                <span className={t.done ? 'text-[#DDFBD0]/90 line-through' : 'text-[#DDFBD0]'}>
                  {t.text}
                </span>
                <span className={`px-1 rounded text-[0.55rem] font-bold ${t.done ? 'bg-[#E0CA3C]/20 text-[#E0CA3C]' : 'bg-[#FE5F00]/20 text-[#FE5F00]'}`}>
                  {t.done ? 'DONE' : 'PENDING'}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'overrides' && (
          <div className="space-y-2">
            <div className="p-2 rounded bg-[#020500]/70 border border-[#086375]/30 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#E0CA3C] block">Iron Gate Deposit Lock</span>
                <span className="text-[0.58rem] text-[#DDFBD0]/60">Toggle deposit clearance manually</span>
              </div>
              <button
                type="button"
                onClick={handleToggleDeposit}
                className={`px-2 py-1 rounded text-[0.6rem] font-bold cursor-pointer border ${
                  client.DepositPaid
                    ? 'border-[#E0CA3C] bg-[#E0CA3C]/20 text-[#E0CA3C]'
                    : 'border-[#FE5F00] bg-[#FE5F00]/20 text-[#FE5F00]'
                }`}
              >
                {client.DepositPaid ? '✓ PAID ($)' : '✗ DUE ($)'}
              </button>
            </div>

            <div className="p-2 rounded bg-[#020500]/70 border border-[#086375]/30">
              <span className="font-bold text-[#E0CA3C] block mb-1">Active Blocker / Pebble:</span>
              <input
                type="text"
                defaultValue={client.roadblock || ''}
                onBlur={(e) => {
                  if (onUpdateClient) {
                    onUpdateClient({ ...client, roadblock: e.target.value, activePebble: e.target.value });
                    onLogTerminal?.(`[Pebble Updated] ${client.Company_Name}: ${e.target.value}`, 'action');
                  }
                }}
                placeholder="No roadblock recorded..."
                className="w-full rounded border border-[#086375] bg-[#020500] px-2 py-1 text-xs text-[#DDFBD0] focus:border-[#E0CA3C] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Pinned Dock Terminal */}
      <form onSubmit={handleTerminalSubmit} className="mt-2 pt-2 border-t border-[#086375]/50 flex gap-1.5 shrink-0">
        <input
          type="text"
          value={terminalInput}
          onChange={(e) => setTerminalInput(e.target.value)}
          placeholder={`Command Alfred regarding ${client.Company_Name}...`}
          className="flex-1 rounded border border-[#086375] bg-[#020500] px-2 py-1 text-[0.65rem] text-[#DDFBD0] placeholder-[#DDFBD0]/35 focus:border-[#E0CA3C] focus:outline-none"
        />
        <button
          type="submit"
          className="px-2.5 py-1 rounded bg-[#086375] text-[#DDFBD0] hover:bg-[#E0CA3C] hover:text-black font-bold text-[0.65rem] transition-colors cursor-pointer"
        >
          SEND
        </button>
      </form>
    </div>
  );
};
