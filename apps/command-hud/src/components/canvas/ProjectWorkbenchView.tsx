import React, { useState } from 'react';
import { ClientRecord, SprintStage, ServiceComponent } from '../../types';
import { ServiceDragger } from './ServiceDragger';
import { SERVICE_REGISTRY } from '../../data/serviceRegistry';
import { ResizableNodeContainer, NodeGeometry } from './workbench/ResizableNodeContainer';
import { syncServiceToMasterControl } from '../../data/api';
import { DropConfirmDialog } from './workbench/DropConfirmDialog';

interface ProjectWorkbenchViewProps {
  client: ClientRecord;
  onExit: () => void;
  onUpdateClient?: (updated: ClientRecord) => void;
  onTriggerAction?: (actionKey: string, payload?: any) => void;
  cameraZoom?: number;
  accessToken?: string | null;
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

interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

interface PendingDropState {
  serviceId: string;
  name: string;
  price: number;
  tasksToInject: string[];
  targetClientId: string;
  snapX: number;
  snapY: number;
}

export const ProjectWorkbenchView: React.FC<ProjectWorkbenchViewProps> = ({
  client,
  onExit,
  onUpdateClient,
  onTriggerAction,
  cameraZoom = 1.0,
  accessToken = null,
}) => {
  const [activeTab, setActiveTab] = useState<'SATELLITES' | 'SERVICES'>('SATELLITES');
  const activeProject = client.activeProjects?.[0];
  const currentStage = activeProject?.SprintStage || '00: Discovery';
  const stageIndex = SPRINT_STAGES_LIST.indexOf(currentStage);

  // Dynamic satellite & ECS nodes state
  const [nodes, setNodes] = useState<NodeGeometry[]>([
    { id: 'node-pamela', title: 'PAMELA // LEGAL', x: -300, y: -200, width: 220, height: 130, isLocked: false },
    { id: 'node-oracle', title: 'ORACLE // INTEL', x: 120, y: -200, width: 220, height: 130, isLocked: false },
    { id: 'node-dolores', title: 'DOLORES // GANTT', x: -300, y: 100, width: 220, height: 130, isLocked: false },
    { id: 'node-vala', title: 'VALA // FISCAL', x: 120, y: 100, width: 220, height: 130, isLocked: false },
    { id: 'node-daisy', title: 'DAISY // MCC', x: -100, y: -280, width: 220, height: 120, isLocked: false },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: 'edge-core-pamela', sourceId: 'core-node', targetId: 'node-pamela' },
    { id: 'edge-core-oracle', sourceId: 'core-node', targetId: 'node-oracle' },
    { id: 'edge-core-dolores', sourceId: 'core-node', targetId: 'node-dolores' },
    { id: 'edge-core-vala', sourceId: 'core-node', targetId: 'node-vala' },
    { id: 'edge-core-daisy', sourceId: 'core-node', targetId: 'node-daisy' },
  ]);

  const [isDropActive, setIsDropActive] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<PendingDropState | null>(null);

  // Core node geometry representation for edge calculations
  const coreNodeGeometry: NodeGeometry = {
    id: 'core-node',
    title: 'CORE DELIVERABLE',
    x: -210,
    y: -140,
    width: 420,
    height: 280,
    isLocked: true,
  };

  const handleUpdateNode = (id: string, updates: Partial<NodeGeometry>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  /**
   * MODULE 2: WORKBENCH ORBIT SNAP & DROP TARGET ENGINE
   */
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropActive(false);

    let raw = e.dataTransfer.getData('application/json');
    let serviceId = e.dataTransfer.getData('serviceId');
    let name = e.dataTransfer.getData('serviceName');
    let price = 0;
    let tasksToInject: string[] = [];
    let targetClientId = client.ClientID;

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        serviceId = parsed.serviceId || serviceId;
        name = parsed.name || name;
        price = parsed.price || 0;
        tasksToInject = parsed.tasksToInject || [];
        targetClientId = parsed.targetClientId || targetClientId;
      } catch (err) {
        console.warn('Failed to parse drag payload JSON', err);
      }
    }

    if (!serviceId) return;

    // Fallback lookup from registry
    const registryService = SERVICE_REGISTRY.find((s) => s.id === serviceId);
    if (registryService) {
      name = name || registryService.name;
      price = price || registryService.price;
      tasksToInject = tasksToInject.length > 0 ? tasksToInject : registryService.tasksToInject;
    }

    // Prevent duplicate node injection
    if (client.activeComponents?.includes(serviceId)) {
      console.warn(`Module ${serviceId} is already mounted to ${targetClientId}`);
      return;
    }

    // Calculate radial placement relative to central core (center is 0, 0 in plane coordinate system)
    const rect = e.currentTarget.getBoundingClientRect();
    const zoom = cameraZoom > 0 ? cameraZoom : 1.0;
    const screenX = (e.clientX - rect.left - rect.width / 2) / zoom;
    const screenY = (e.clientY - rect.top - rect.height / 2) / zoom;
    const angle = Math.atan2(screenY, screenX);
    const distance = Math.max(220, Math.min(480, Math.sqrt(screenX * screenX + screenY * screenY)));

    const snapX = Math.round(Math.cos(angle) * distance - 90);
    const snapY = Math.round(Math.sin(angle) * distance - 45);

    // Staged Confirmation for Financial Drop (Brief Rule 3 & Milestone 0)
    setPendingDrop({
      serviceId,
      name: name || serviceId,
      price,
      tasksToInject,
      targetClientId,
      snapX,
      snapY,
    });
  };

  /**
   * Confirms and persists the staged financial drop mutation
   */
  const handleConfirmDrop = async () => {
    if (!pendingDrop) return;
    const { serviceId, name, price, tasksToInject, targetClientId, snapX, snapY } = pendingDrop;

    // Optimistic UI Update
    const updatedComponents = [...(client.activeComponents || []), serviceId];
    const updatedContractValue = Number(client.ContractValue || 0) + Number(price);

    onUpdateClient?.({
      ...client,
      activeComponents: updatedComponents,
      ContractValue: updatedContractValue,
    });

    const newNodeId = `node-${serviceId}-${Date.now()}`;

    // Append new satellite node to local state
    setNodes((prev) => [
      ...prev,
      {
        id: newNodeId,
        serviceId,
        title: name,
        x: snapX,
        y: snapY,
        width: 200,
        height: 100,
        isLocked: false,
      },
    ]);

    // Append edge from core to new satellite node
    setEdges((prev) => [
      ...prev,
      {
        id: `edge-core-${newNodeId}`,
        sourceId: 'core-node',
        targetId: newNodeId,
      },
    ]);

    setPendingDrop(null);

    // Authoritative Master Control Sync (Module 3)
    try {
      await syncServiceToMasterControl(targetClientId, serviceId, price, tasksToInject, accessToken);
    } catch (syncErr) {
      console.error('Master Control Sync Failed:', syncErr);
    }
  };

  const handleToggleComponent = (componentId: string) => {
    const existing = client.activeComponents || [];
    const isDetaching = existing.includes(componentId);
    const updatedComponents = isDetaching
      ? existing.filter((c) => c !== componentId)
      : [...existing, componentId];

    const service = SERVICE_REGISTRY.find((s) => s.id === componentId);
    const priceDelta = service ? service.price : 0;
    const newContractValue = isDetaching
      ? Math.max(0, (client.ContractValue || 0) - priceDelta)
      : (client.ContractValue || 0) + priceDelta;

    onUpdateClient?.({
      ...client,
      activeComponents: updatedComponents,
      ContractValue: newContractValue,
    });

    if (isDetaching) {
      setNodes((prev) => prev.filter((n) => n.serviceId !== componentId));
      setEdges((prev) => prev.filter((e) => !e.targetId.includes(componentId)));
    } else if (service) {
      const angle = (nodes.length * (2 * Math.PI)) / 8;
      const snapX = Math.round(Math.cos(angle) * 320 - 90);
      const snapY = Math.round(Math.sin(angle) * 320 - 45);
      const newNodeId = `node-${componentId}-${Date.now()}`;

      setNodes((prev) => [
        ...prev,
        {
          id: newNodeId,
          serviceId: componentId,
          title: service.name,
          x: snapX,
          y: snapY,
          width: 200,
          height: 100,
          isLocked: false,
        },
      ]);
      setEdges((prev) => [
        ...prev,
        {
          id: `edge-core-${newNodeId}`,
          sourceId: 'core-node',
          targetId: newNodeId,
        },
      ]);
    }
  };

  const allRenderNodes = [coreNodeGeometry, ...nodes];

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDropActive) setIsDropActive(true);
      }}
      onDragLeave={() => setIsDropActive(false)}
      onDrop={handleCanvasDrop}
      className={`relative w-full h-full bg-[#020500] text-[#DDFBD0] overflow-hidden select-none flex flex-col font-mono transition-colors duration-200 ${
        isDropActive ? 'bg-[#04100c]' : ''
      }`}
    >
      {/* Background Starfield & Tactical Radar Grid */}
      <div className="crm-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#086375]/15 via-transparent to-transparent" />

      {/* Drop Zone Ambient Glow Indicator */}
      {isDropActive && (
        <div className="pointer-events-none absolute inset-0 border-4 border-dashed border-[#E0CA3C] z-30 animate-pulse bg-[#E0CA3C]/5 flex items-center justify-center">
          <div className="bg-[#020500]/90 border border-[#E0CA3C] px-6 py-3 rounded-xl shadow-2xl text-[#E0CA3C] font-bold text-sm tracking-wider">
            ✦ RELEASE TO SNAP SERVICE COMPONENT TO ORBIT ✦
          </div>
        </div>
      )}

      {/* Top Breadcrumb Overlay (Fixed top-left) */}
      <div className="absolute top-4 left-6 z-40 flex items-center gap-3 bg-[#020500]/95 border border-[#E0CA3C] rounded-xl px-4 py-2 shadow-[0_0_24px_rgba(224,202,60,0.3)]">
        <button
          type="button"
          onClick={onExit}
          className="text-[#DDFBD0]/70 hover:text-[#E0CA3C] flex items-center gap-1.5 font-bold transition-colors cursor-pointer text-xs"
        >
          <i className="fa-solid fa-arrow-left text-[#E0CA3C]" />
          <span>[ GALAXY VIEW ]</span>
        </button>
        <span className="text-[#086375] font-bold">/</span>
        <div className="flex items-center gap-2">
          <span className="text-[#E0CA3C] font-display font-bold text-sm tracking-wide">
            ✦ {client.Company_Name}
          </span>
          <span className="text-[0.62rem] px-2 py-0.5 rounded bg-[#5F0F40] border border-[#E0CA3C]/40 text-[#E0CA3C] font-bold">
            SOLAR WORKBENCH
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
          SATELLITE ORBITS ({nodes.length})
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
          ECS SERVICE CATALOG
        </button>
      </div>

      {/* Main Solar System Coordinate Workspace */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-6">
        {/* Orbital Concentric Guide Rings */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50%" cy="50%" r="220" fill="none" stroke="#086375" strokeWidth="1" strokeDasharray="4 6" opacity="0.35" />
          <circle cx="50%" cy="50%" r="340" fill="none" stroke="#086375" strokeWidth="1" strokeDasharray="3 8" opacity="0.25" />
          <circle cx="50%" cy="50%" r="460" fill="none" stroke="#086375" strokeWidth="1" strokeDasharray="2 10" opacity="0.15" />
        </svg>

        {/* ── MODULE 4: DYNAMIC SVG TRACER LINK LAYER ──────────────────── */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10" xmlns="http://www.w3.org/2000/svg">
          {edges.map((edge) => {
            const src = allRenderNodes.find((n) => n.id === edge.sourceId);
            const dst = allRenderNodes.find((n) => n.id === edge.targetId);
            if (!src || !dst) return null;

            // Offset relative to screen center (50%, 50%)
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;

            const x1 = cx + src.x + src.width / 2;
            const y1 = cy + src.y + src.height / 2;
            const x2 = cx + dst.x + dst.width / 2;
            const y2 = cy + dst.y + dst.height / 2;
            const dx = (x2 - x1) * 0.5;

            const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            return (
              <g key={edge.id}>
                {/* Background base dashed trace */}
                <path d={path} stroke="#086375" strokeWidth="2" strokeDasharray="4 2" fill="none" opacity="0.6" />
                {/* Animated Imperial Gold tracer particle */}
                <path d={path} stroke="#E0CA3C" strokeWidth="2" strokeDasharray="6 120" strokeDashoffset="0" fill="none">
                  <animate attributeName="stroke-dashoffset" values="126;0" dur="2s" repeatCount="indefinite" />
                </path>
              </g>
            );
          })}
        </svg>

        {/* ── FULL INTERACTION PLANE (Covers hit area without 0x0 restriction) ─────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
          <div className="relative w-0 h-0 overflow-visible pointer-events-none">
            {/* ── CENTRAL CORE SUN NODE ─────────────────────────────────── */}
            <div
              style={{
                position: 'absolute',
                top: `${coreNodeGeometry.y}px`,
                left: `${coreNodeGeometry.x}px`,
                width: `${coreNodeGeometry.width}px`,
                height: `${coreNodeGeometry.height}px`,
              }}
              className="z-20 pointer-events-auto rounded-2xl border-2 border-[#E0CA3C] bg-gradient-to-br from-[#0d1f18] via-[#05130e] to-[#020500] p-5 shadow-[0_0_50px_rgba(224,202,60,0.35)] flex flex-col select-none"
            >
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

            {/* ── MODULE 5: UNIVERSAL RESIZABLE SATELLITE NODES ──────────── */}
            {activeTab === 'SATELLITES' && (
              <>
                {nodes.map((node) => (
                  <ResizableNodeContainer
                    key={node.id}
                    node={node}
                    cameraZoom={cameraZoom}
                    onUpdate={handleUpdateNode}
                  >
                    {/* Node Specific Contents */}
                    {node.id === 'node-pamela' && (
                      <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                        <div className="flex items-center gap-1.5 mb-1 text-[#086375] font-bold text-[0.65rem]">
                          <i className="fa-solid fa-flask text-emerald-400" />
                          <span>LEGAL & DRIVE VAULT</span>
                        </div>
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
                      </div>
                    )}

                    {node.id === 'node-oracle' && (
                      <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                        <div className="flex items-center gap-1.5 mb-1 text-[#E0CA3C] font-bold text-[0.65rem]">
                          <i className="fa-solid fa-eye text-[#E0CA3C]" />
                          <span>INTELLIGENCE & OSINT</span>
                        </div>
                        <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                          <span>case_file.json</span>
                          <span className="text-[#E0CA3C]">{client.caseFileJsonUrl ? 'Compiled' : 'Pending'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onTriggerAction?.('ORACLE_SWEEP', { client })}
                          className="w-full mt-1 py-0.5 rounded border border-[#E0CA3C]/50 bg-[#E0CA3C]/10 text-[#E0CA3C] text-[0.55rem] font-bold hover:bg-[#E0CA3C] hover:text-black cursor-pointer"
                        >
                          RUN OSINT SWEEP
                        </button>
                      </div>
                    )}

                    {node.id === 'node-dolores' && (
                      <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                        <div className="flex items-center gap-1.5 mb-1 text-[#3C91E6] font-bold text-[0.65rem]">
                          <i className="fa-solid fa-wave-square text-[#3C91E6]" />
                          <span>TASKS & 45-DAY GANTT</span>
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
                    )}

                    {node.id === 'node-vala' && (
                      <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                        <div className="flex items-center gap-1.5 mb-1 text-[#E0CA3C] font-bold text-[0.65rem]">
                          <i className="fa-solid fa-coins text-[#E0CA3C]" />
                          <span>COMMERCE & FISCAL</span>
                        </div>
                        <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                          <span>Next 1/3rd Invoice</span>
                          <span className="text-white font-bold">
                            ${Math.round((client.ContractValue || 0) / 3).toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onTriggerAction?.('DRAFT_INVOICE', { client })}
                          className="w-full mt-1 py-0.5 rounded border border-[#E0CA3C]/50 bg-[#E0CA3C]/10 text-[#E0CA3C] text-[0.55rem] font-bold hover:bg-[#E0CA3C] hover:text-black cursor-pointer"
                        >
                          DRAFT INVOICE
                        </button>
                      </div>
                    )}

                    {node.id === 'node-daisy' && (
                      <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                        <div className="flex items-center gap-1.5 mb-1 text-[#FE5F00] font-bold text-[0.65rem]">
                          <i className="fa-solid fa-envelope-open-text text-[#FE5F00]" />
                          <span>MCC & BROADCASTS</span>
                        </div>
                        <div className="p-1 rounded bg-[#086375]/15 flex justify-between">
                          <span>Nurture Step</span>
                          <span className="text-[#FE5F00]">#{stageIndex + 1} Triggered</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onTriggerAction?.('OPEN_MCC', { client })}
                          className="w-full mt-1 py-0.5 rounded border border-[#FE5F00]/50 bg-[#FE5F00]/10 text-[#FE5F00] text-[0.55rem] font-bold hover:bg-[#FE5F00] hover:text-black cursor-pointer"
                        >
                          DISPATCH MCC
                        </button>
                      </div>
                    )}

                    {/* Dynamically Dropped Service Node Content */}
                    {node.serviceId && (
                      <div className="space-y-1 text-[0.6rem] text-[#DDFBD0]/80">
                        <div className="flex items-center justify-between text-[#E0CA3C] font-bold text-[0.65rem]">
                          <span className="truncate">{node.title}</span>
                          <i className="fa-solid fa-puzzle-piece text-xs text-[#E0CA3C]" />
                        </div>
                        <p className="text-[0.55rem] text-[#DDFBD0]/60 line-clamp-2">
                          {SERVICE_REGISTRY.find((s) => s.id === node.serviceId)?.description || 'Active modular component attached.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleToggleComponent(node.serviceId!)}
                          className="w-full py-0.5 rounded border border-[#FE5F00]/60 bg-[#FE5F00]/10 text-[#FE5F00] text-[0.52rem] font-bold hover:bg-[#FE5F00] hover:text-black cursor-pointer"
                        >
                          DETACH MODULE
                        </button>
                      </div>
                    )}
                  </ResizableNodeContainer>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── TAB 2: ECS SERVICE CATALOG OVERLAY ────────────── */}
        {activeTab === 'SERVICES' && (
          <div className="absolute right-10 top-20 z-30 pointer-events-auto">
            <ServiceDragger
              activeComponents={client.activeComponents || []}
              onToggleComponent={handleToggleComponent}
            />
          </div>
        )}
      </div>

      {/* Financial Mutation Confirmation Modal (Brief Milestone 0 / Rule 3) */}
      <DropConfirmDialog
        isOpen={Boolean(pendingDrop)}
        onCancel={() => setPendingDrop(null)}
        onConfirm={handleConfirmDrop}
        serviceName={pendingDrop?.name || ''}
        priceDelta={pendingDrop?.price || 0}
        currentValue={client.ContractValue || 0}
        targetClientName={client.Company_Name}
      />
    </div>
  );
};
