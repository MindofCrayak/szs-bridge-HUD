import React, { useState } from 'react';
import { ClientRecord, SprintStage } from '../../types';
import { ServiceDragger } from './ServiceDragger';
import { SERVICE_REGISTRY } from '../../data/serviceRegistry';

interface ProjectWorkbenchViewProps {
  client: ClientRecord;
  onExit: () => void;
  onUpdateClient?: (updated: ClientRecord) => void;
  onTriggerAction?: (actionKey: string, payload?: any) => void;
}

const SPRINT_STAGES_LIST: SprintStage[] = [
  '00: Discovery',
  '01: Vibecheck',
  '02: Contract & Inception',
  '03: Deep Intelligence',
  '04: Session Zero Kickoff',
  '05: Architecture & Builds',
  '06: Mid-Flight Review',
  '07: Final Staging & QA',
  '08: Liftoff & Handover',
  '09: Sunset / Retainer',
];

export const ProjectWorkbenchView: React.FC<ProjectWorkbenchViewProps> = ({
  client,
  onExit,
  onUpdateClient,
  onTriggerAction,
}) => {
  const [activeTab, setActiveTab] = useState<'SATELLITES' | 'SERVICES'>('SATELLITES');
  const activeProject = client.activeProjects?.[0];
  const currentStage = activeProject?.SprintStage || '00: Discovery';
  const stageIndex = SPRINT_STAGES_LIST.indexOf(currentStage);

  const handleToggleComponent = (componentId: string) => {
    const existing = client.activeComponents || [];
    const updatedComponents = existing.includes(componentId)
      ? existing.filter((c) => c !== componentId)
      : [...existing, componentId];

    // Compute extra contract value delta
    const service = SERVICE_REGISTRY.find((s) => s.id === componentId);
    const priceDelta = service ? service.price : 0;
    const newContractValue = existing.includes(componentId)
      ? Math.max(0, (client.ContractValue || 0) - priceDelta)
      : (client.ContractValue || 0) + priceDelta;

    onUpdateClient?.({
      ...client,
      activeComponents: updatedComponents,
      ContractValue: newContractValue,
    });
  };

  return (
    <div className="relative w-full h-full bg-[#020500] text-[#DDFBD0] overflow-hidden select-none flex flex-col font-mono">
      {/* Background Starfield & Tactical Radar Grid */}
      <div className="crm-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#086375]/15 via-transparent to-transparent" />

      {/* Top Breadcrumb Overlay (Fixed top-left) */}
      <div className="absolute top-4 left-6 z-40 flex items-center gap-3 bg-[#020500]/95 border border-[#E0CA3C] rounded-xl px-4 py-2 shadow-[0_0_24px_rgba(224,202,60,0.3)]">
        <button
          type="button"
          onClick={onExit}
          className="text-[#DDFBD0]/70 hover:text-[#E0CA3C] flex items-center gap-1.5 font-bold transition-colors cursor-pointer text-xs"
        >
          <i className="fa-solid fa-arrow-left text-[#E0CA3C]" />
          <span>[ GLOBAL PIPELINE ]</span>
        </button>
        <span className="text-[#086375] font-bold">/</span>
        <div className="flex items-center gap-2">
          <span className="text-[#E0CA3C] font-display font-bold text-sm tracking-wide">
            ✦ {client.Company_Name}
          </span>
          <span className="text-[0.62rem] px-2 py-0.5 rounded bg-[#5F0F40] border border-[#E0CA3C]/40 text-[#E0CA3C] font-bold">
            SOLAR SYSTEM WORKBENCH
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="ml-3 text-xs text-[#FE5F00] hover:text-white px-2 py-0.5 rounded border border-[#FE5F00]/50 hover:bg-[#FE5F00] hover:text-black transition-colors cursor-pointer"
          title="Press Esc or click to return to Galaxy View"
        >
          ESC ✕
        </button>
      </div>

      {/* Top Right Mode Switcher */}
      <div className="absolute top-4 right-6 z-40 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('SATELLITES')}
          className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'SATELLITES'
              ? 'border-[#E0CA3C] bg-[#E0CA3C]/20 text-[#E0CA3C] shadow-[0_0_12px_rgba(224,202,60,0.3)]'
              : 'border-[#086375] bg-[#020500]/80 text-[#DDFBD0]/70 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-satellite mr-1.5 text-xs" />
          5 SATELLITE NODES
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SERVICES')}
          className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'SERVICES'
              ? 'border-[#E0CA3C] bg-[#E0CA3C]/20 text-[#E0CA3C] shadow-[0_0_12px_rgba(224,202,60,0.3)]'
              : 'border-[#086375] bg-[#020500]/80 text-[#DDFBD0]/70 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-puzzle-piece mr-1.5 text-xs text-[#E0CA3C]" />
          ECS SERVICE REGISTRY
        </button>
      </div>

      {/* Main Solar System Workspace */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-6">
        {/* SVG Tracer Layer Connecting Core to 5 Satellite Nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
          {/* Orbital Concentric Guide Rings */}
          <circle cx="50%" cy="50%" r="220" fill="none" stroke="#086375" strokeWidth="1" strokeDasharray="4 6" opacity="0.35" />
          <circle cx="50%" cy="50%" r="340" fill="none" stroke="#086375" strokeWidth="1" strokeDasharray="3 8" opacity="0.25" />

          {/* Tracer Lines connecting to each satellite */}
          {/* Node 1: Pamela (Legal/Admin) - Top Left (-240, -180) */}
          <line x1="50%" y1="50%" x2="calc(50% - 240px)" y2="calc(50% - 180px)" stroke="#086375" strokeWidth="1.5" strokeDasharray="6 4" className="animate-pulse" />
          {/* Node 2: Oracle (Intelligence) - Top Right (+240, -180) */}
          <line x1="50%" y1="50%" x2="calc(50% + 240px)" y2="calc(50% - 180px)" stroke="#E0CA3C" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
          {/* Node 3: Dolores (Tasks/Gantt) - Bottom Left (-260, +160) */}
          <line x1="50%" y1="50%" x2="calc(50% - 260px)" y2="calc(50% + 160px)" stroke="#3C91E6" strokeWidth="1.5" strokeDasharray="6 4" />
          {/* Node 4: Vala (Finances) - Bottom Right (+260, +160) */}
          <line x1="50%" y1="50%" x2="calc(50% + 260px)" y2="calc(50% + 160px)" stroke="#E0CA3C" strokeWidth="1.5" strokeDasharray="6 4" />
          {/* Node 5: Daisy (Audience/MCC) - Direct Top (0, -260) */}
          <line x1="50%" y1="50%" x2="50%" y2="calc(50% - 260px)" stroke="#FE5F00" strokeWidth="1.5" strokeDasharray="6 4" />
        </svg>

        {/* ── CORE SUN NODE (Center) ─────────────────────────── */}
        <div className="relative z-20 w-[420px] rounded-2xl border-2 border-[#E0CA3C] bg-gradient-to-br from-[#0d1f18] via-[#05130e] to-[#020500] p-5 shadow-[0_0_50px_rgba(224,202,60,0.35)] flex flex-col select-none">
          {/* Core Header */}
          <div className="flex items-center justify-between border-b border-[#086375]/60 pb-3 mb-3">
            <div>
              <span className="text-[0.62rem] text-[#086375] font-bold uppercase tracking-wider block">
                CORE DELIVERABLE NODE // {client.ClientID}
              </span>
              <h2 className="font-display font-extrabold text-lg text-white tracking-wide">
                {client.Company_Name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[0.6rem] text-[#DDFBD0]/60 block uppercase">Contract Value</span>
              <span className="font-bold text-sm text-[#E0CA3C]">
                ${(client.ContractValue || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 10-Step SprintStage Progress Track */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-[0.62rem] mb-1.5">
              <span className="font-bold text-[#E0CA3C]">10-STEP SPRINT STAGE PROGRESS</span>
              <span className="text-[#DDFBD0]/70">Step {stageIndex + 1} of 10</span>
            </div>
            <div className="flex gap-1 h-2 mb-1">
              {SPRINT_STAGES_LIST.map((stage, idx) => {
                const isPassed = idx <= stageIndex;
                const isCurrent = idx === stageIndex;
                return (
                  <div
                    key={stage}
                    title={stage}
                    className={`flex-1 rounded-xs transition-all ${
                      isCurrent
                        ? 'bg-[#E0CA3C] shadow-[0_0_8px_#E0CA3C] animate-pulse'
                        : isPassed
                        ? 'bg-[#086375]'
                        : 'bg-[#086375]/20'
                    }`}
                  />
                );
              })}
            </div>
            <div className="text-[0.65rem] text-[#E0CA3C] font-bold truncate">
              {currentStage}
            </div>
          </div>

          {/* Roadblock and Vitals */}
          <div className="grid grid-cols-2 gap-2 text-[0.65rem] bg-[#020500]/70 border border-[#086375]/40 rounded-xl p-2.5 mb-3">
            <div>
              <span className="text-[#DDFBD0]/50 block text-[0.58rem] uppercase">Iron Gate Deposit</span>
              <span className={`font-bold ${client.DepositPaid ? 'text-[#E0CA3C]' : 'text-[#FE5F00]'}`}>
                {client.DepositPaid ? '1/3 CLEARED 🔓' : 'UNPAID / LOCKED 🔒'}
              </span>
            </div>
            <div>
              <span className="text-[#DDFBD0]/50 block text-[0.58rem] uppercase">Active Roadblock</span>
              <span className="text-[#FE5F00] font-bold truncate block">
                {client.roadblock || client.activePebble || 'None Reported'}
              </span>
            </div>
          </div>

          {/* Active ECS Components Count */}
          <div className="flex items-center justify-between text-[0.62rem] text-[#DDFBD0]/70 border-t border-[#086375]/40 pt-2">
            <span>Installed ECS Components:</span>
            <span className="font-bold text-[#E0CA3C]">
              {client.activeComponents?.length || 0} Modules Active
            </span>
          </div>
        </div>

        {/* ── 5 SATELLITE NODES (Circular Planetary Orbit) ───── */}
        {activeTab === 'SATELLITES' && (
          <>
            {/* 1. Pamela (Legal/Admin) - Top Left */}
            <div
              style={{ transform: 'translate(-240px, -180px)' }}
              className="absolute z-20 w-[210px] rounded-xl border border-[#086375] bg-[#020500]/95 p-3 shadow-[0_4px_20px_rgba(8,99,117,0.4)] text-xs hover:border-[#E0CA3C] transition-all"
            >
              <div className="flex items-center gap-1.5 mb-1.5 text-[#086375] font-bold text-[0.65rem]">
                <i className="fa-solid fa-flask text-emerald-400" />
                <span>PAMELA // LEGAL & DRIVE</span>
              </div>
              <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                <a
                  href={client.DriveFolderUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-1 rounded bg-[#086375]/15 hover:bg-[#086375]/30 cursor-pointer text-[#DDFBD0]"
                >
                  <span>Google Drive Vault</span>
                  <i className="fa-solid fa-arrow-up-right-from-square text-[0.5rem] text-[#E0CA3C]" />
                </a>
                <div className="flex items-center justify-between p-1 rounded bg-[#086375]/15">
                  <span>MSA: {client.MSA_DocID ? 'Signed 🔓' : 'Missing 🔒'}</span>
                </div>
                <div className="flex items-center justify-between p-1 rounded bg-[#086375]/15">
                  <span>SOW: {client.SOW_DocID ? 'Attached' : 'Drafting'}</span>
                </div>
              </div>
            </div>

            {/* 2. Oracle (Market Intelligence) - Top Right */}
            <div
              style={{ transform: 'translate(240px, -180px)' }}
              className="absolute z-20 w-[210px] rounded-xl border border-[#086375] bg-[#020500]/95 p-3 shadow-[0_4px_20px_rgba(8,99,117,0.4)] text-xs hover:border-[#E0CA3C] transition-all"
            >
              <div className="flex items-center gap-1.5 mb-1.5 text-[#E0CA3C] font-bold text-[0.65rem]">
                <i className="fa-solid fa-eye text-[#E0CA3C]" />
                <span>ORACLE // INTELLIGENCE</span>
              </div>
              <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                  <span>case_file.json</span>
                  <span className="text-[#E0CA3C]">{client.caseFileJsonUrl ? 'Compiled' : 'Pending'}</span>
                </div>
                <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                  <span>Competitive Matrix</span>
                  <span className="text-emerald-400">Ready</span>
                </div>
                <button
                  type="button"
                  onClick={() => onTriggerAction?.('ORACLE_SWEEP', { client })}
                  className="w-full mt-1 py-0.5 rounded border border-[#E0CA3C]/50 bg-[#E0CA3C]/10 text-[#E0CA3C] text-[0.55rem] font-bold hover:bg-[#E0CA3C] hover:text-black cursor-pointer"
                >
                  RUN OSINT SWEEP
                </button>
              </div>
            </div>

            {/* 3. Dolores (Tasks & Sprint Gantt) - Bottom Left */}
            <div
              style={{ transform: 'translate(-260px, 160px)' }}
              className="absolute z-20 w-[210px] rounded-xl border border-[#086375] bg-[#020500]/95 p-3 shadow-[0_4px_20px_rgba(8,99,117,0.4)] text-xs hover:border-[#E0CA3C] transition-all"
            >
              <div className="flex items-center gap-1.5 mb-1.5 text-[#3C91E6] font-bold text-[0.65rem]">
                <i className="fa-solid fa-wave-square text-[#3C91E6]" />
                <span>DOLORES // TASKS & GANTT</span>
              </div>
              <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                  <span>45-Day Gantt</span>
                  <span className="text-white font-bold">Day 14</span>
                </div>
                <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                  <span>Milestones Done</span>
                  <span className="text-[#E0CA3C]">
                    {activeProject?.MilestonesDone ?? 1}/{activeProject?.MilestonesTotal ?? 4}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onTriggerAction?.('OPEN_TASKS', { client })}
                  className="w-full mt-1 py-0.5 rounded border border-[#3C91E6]/50 bg-[#3C91E6]/10 text-[#3C91E6] text-[0.55rem] font-bold hover:bg-[#3C91E6] hover:text-white cursor-pointer"
                >
                  OPEN GOOGLE TASKS
                </button>
              </div>
            </div>

            {/* 4. Vala (Finances & Milestone Invoicing) - Bottom Right */}
            <div
              style={{ transform: 'translate(260px, 160px)' }}
              className="absolute z-20 w-[210px] rounded-xl border border-[#086375] bg-[#020500]/95 p-3 shadow-[0_4px_20px_rgba(8,99,117,0.4)] text-xs hover:border-[#E0CA3C] transition-all"
            >
              <div className="flex items-center gap-1.5 mb-1.5 text-[#E0CA3C] font-bold text-[0.65rem]">
                <i className="fa-solid fa-coins text-[#E0CA3C]" />
                <span>VALA // COMMERCE & FISCAL</span>
              </div>
              <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                  <span>Interval Billing</span>
                  <span className="text-[#E0CA3C]">1/3rds Model</span>
                </div>
                <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                  <span>Next Invoice</span>
                  <span className="text-white font-bold">
                    ${Math.round((client.ContractValue || 0) / 3).toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onTriggerAction?.('DRAFT_INVOICE', { client })}
                  className="w-full mt-1 py-0.5 rounded border border-[#E0CA3C]/50 bg-[#E0CA3C]/10 text-[#E0CA3C] text-[0.55rem] font-bold hover:bg-[#E0CA3C] hover:text-black cursor-pointer"
                >
                  DRAFT MILESTONE INVOICE
                </button>
              </div>
            </div>

            {/* 5. Daisy (Audience & Mail Command Center) - Direct Top */}
            <div
              style={{ transform: 'translate(0, -260px)' }}
              className="absolute z-20 w-[220px] rounded-xl border border-[#086375] bg-[#020500]/95 p-3 shadow-[0_4px_20px_rgba(8,99,117,0.4)] text-xs hover:border-[#E0CA3C] transition-all"
            >
              <div className="flex items-center gap-1.5 mb-1.5 text-[#FE5F00] font-bold text-[0.65rem]">
                <i className="fa-solid fa-envelope-open-text text-[#FE5F00]" />
                <span>DAISY // MCC & BROADCASTS</span>
              </div>
              <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                  <span>Drip Stage</span>
                  <span className="text-[#FE5F00]">Step #{stageIndex + 1} Triggered</span>
                </div>
                <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                  <span>Retention Tags</span>
                  <span className="text-emerald-400">Nominal</span>
                </div>
                <button
                  type="button"
                  onClick={() => onTriggerAction?.('OPEN_MCC', { client })}
                  className="w-full mt-1 py-0.5 rounded border border-[#FE5F00]/50 bg-[#FE5F00]/10 text-[#FE5F00] text-[0.55rem] font-bold hover:bg-[#FE5F00] hover:text-black cursor-pointer"
                >
                  DISPATCH MCC SEQUENCE
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 2: ECS SERVICE REGISTRY OVERLAY ────────────── */}
        {activeTab === 'SERVICES' && (
          <div className="absolute right-10 top-20 z-30">
            <ServiceDragger
              activeComponents={client.activeComponents || []}
              onToggleComponent={handleToggleComponent}
            />
          </div>
        )}
      </div>
    </div>
  );
};
