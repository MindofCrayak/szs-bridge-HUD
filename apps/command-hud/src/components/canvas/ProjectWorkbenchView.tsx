import React, { useState, useEffect, useRef } from 'react';
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
  cameraPan?: { x: number; y: number };
  accessToken?: string | null;
  interactionMode?: 'drag' | 'lock' | 'edit';
  showNonStructural?: boolean;
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
  cameraPan = { x: 0, y: 0 },
  accessToken = null,
  interactionMode = 'drag',
  showNonStructural = true,
}) => {
  const [activeTab, setActiveTab] = useState<'SATELLITES' | 'SERVICES'>('SATELLITES');
  const activeProject = client.activeProjects?.[0];
  const currentStage = activeProject?.SprintStage || '00: Discovery';
  const stageIndex = SPRINT_STAGES_LIST.indexOf(currentStage);

  // ── STEP 2: Sun Position State (per ClientID) ───────────────────
  const [sunPos, setSunPos] = useState<{ x: number; y: number }>(() => {
    try {
      const stored = localStorage.getItem(`szs_sun_pos_${client.ClientID}`);
      return stored ? JSON.parse(stored) : { x: 0, y: 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  });

  // Persist Sun position locally per client
  useEffect(() => {
    try {
      localStorage.setItem(`szs_sun_pos_${client.ClientID}`, JSON.stringify(sunPos));
    } catch {}
  }, [sunPos, client.ClientID]);

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

  // Dynamic Core node geometry reading live sunPos
  const coreNodeGeometry: NodeGeometry = {
    id: 'core-node',
    title: 'CORE DELIVERABLE',
    x: sunPos.x - 210,
    y: sunPos.y - 140,
    width: 420,
    height: 280,
    isLocked: interactionMode === 'lock',
  };

  const handleUpdateNode = (id: string, updates: Partial<NodeGeometry>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  // ── SUN DRAG HANDLER (Reuses satellite drag pattern with zoom compensation) ──
  const handleSunPointerDown = (e: React.PointerEvent) => {
    if (interactionMode === 'lock' || e.button !== 0) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initX = sunPos.x;
    const initY = sunPos.y;

    const onPointerMove = (ev: PointerEvent) => {
      const zoom = cameraZoom > 0 ? cameraZoom : 1.0;
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      setSunPos({
        x: Math.round(initX + dx),
        y: Math.round(initY + dy),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Double-click to recenter Sun to (0, 0)
  const handleSunDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSunPos({ x: 0, y: 0 });
  };

  /**
   * MODULE 2: WORKBENCH ORBIT SNAP & DROP TARGET ENGINE
   * Snaps relative to the live Sun position
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

    const registryService = SERVICE_REGISTRY.find((s) => s.id === serviceId);
    if (registryService) {
      name = name || registryService.name;
      price = price || registryService.price;
      tasksToInject = tasksToInject.length > 0 ? tasksToInject : registryService.tasksToInject;
    }

    if (client.activeComponents?.includes(serviceId)) {
      console.warn(`Module ${serviceId} is already mounted to ${targetClientId}`);
      return;
    }

    // Calculate radial placement relative to central Sun's live position
    const rect = e.currentTarget.getBoundingClientRect();
    const zoom = cameraZoom > 0 ? cameraZoom : 1.0;
    const canvasCenterX = rect.width / 2 + cameraPan.x;
    const canvasCenterY = rect.height / 2 + cameraPan.y;

    const screenX = (e.clientX - canvasCenterX) / zoom - sunPos.x;
    const screenY = (e.clientY - canvasCenterY) / zoom - sunPos.y;
    const angle = Math.atan2(screenY, screenX);
    const distance = Math.max(220, Math.min(480, Math.sqrt(screenX * screenX + screenY * screenY)));

    const snapX = Math.round(sunPos.x + Math.cos(angle) * distance - 100);
    const snapY = Math.round(sunPos.y + Math.sin(angle) * distance - 50);

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

  const handleConfirmDrop = async () => {
    if (!pendingDrop) return;
    const { serviceId, name, price, tasksToInject, targetClientId, snapX, snapY } = pendingDrop;

    const updatedComponents = [...(client.activeComponents || []), serviceId];
    const updatedContractValue = Number(client.ContractValue || 0) + Number(price);

    onUpdateClient?.({
      ...client,
      activeComponents: updatedComponents,
      ContractValue: updatedContractValue,
    });

    const newNodeId = `node-${serviceId}-${Date.now()}`;

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

    setEdges((prev) => [
      ...prev,
      {
        id: `edge-core-${newNodeId}`,
        sourceId: 'core-node',
        targetId: newNodeId,
      },
    ]);

    setPendingDrop(null);

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
      const snapX = Math.round(sunPos.x + Math.cos(angle) * 320 - 100);
      const snapY = Math.round(sunPos.y + Math.sin(angle) * 320 - 50);
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

      {/* ── STEP 1: TRANSFORMED WORLD CONTAINER (RECEIVES CAMERA PAN & ZOOM) ── */}
      <div
        style={{
          transform: `translate3d(${cameraPan.x}px, ${cameraPan.y}px, 0) scale(${cameraZoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transition: 'transform 75ms ease-out',
        }}
        className="pointer-events-none"
      >
        {/* World Origin Anchor at Center of Screen (50vw, 50vh) */}
        <div className="absolute top-1/2 left-1/2 w-0 h-0 overflow-visible pointer-events-none">
          {/* Orbital Concentric Guide Rings centered around Sun's live coordinates */}
          <svg
            style={{
              position: 'absolute',
              left: `${sunPos.x - 600}px`,
              top: `${sunPos.y - 600}px`,
              width: '1200px',
              height: '1200px',
            }}
            className="pointer-events-none overflow-visible z-0"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="600" cy="600" r="220" fill="none" stroke="#086375" strokeWidth="1" strokeDasharray="4 6" opacity="0.35" />
            <circle cx="600" cy="600" r="340" fill="none" stroke="#086375" strokeWidth="1" strokeDasharray="3 8" opacity="0.25" />
            <circle cx="600" cy="600" r="460" fill="none" stroke="#086375" strokeWidth="1" strokeDasharray="2 10" opacity="0.15" />
          </svg>

          {/* Dynamic SVG Tracer Link Layer between Sun and Satellites */}
          <svg
            style={{ position: 'absolute', left: '-2000px', top: '-2000px', width: '4000px', height: '4000px' }}
            className="pointer-events-none overflow-visible z-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            {edges.map((edge) => {
              const src = allRenderNodes.find((n) => n.id === edge.sourceId);
              const dst = allRenderNodes.find((n) => n.id === edge.targetId);
              if (!src || !dst) return null;

              // Origin offset is (2000, 2000)
              const ox = 2000;
              const oy = 2000;

              const x1 = ox + src.x + src.width / 2;
              const y1 = oy + src.y + src.height / 2;
              const x2 = ox + dst.x + dst.width / 2;
              const y2 = oy + dst.y + dst.height / 2;
              const dx = (x2 - x1) * 0.5;

              const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              return (
                <g key={edge.id}>
                  <path d={path} stroke="#086375" strokeWidth="2" strokeDasharray="4 2" fill="none" opacity="0.6" />
                  <path d={path} stroke="#E0CA3C" strokeWidth="2" strokeDasharray="6 120" strokeDashoffset="0" fill="none">
                    <animate attributeName="stroke-dashoffset" values="126;0" dur="2s" repeatCount="indefinite" />
                  </path>
                </g>
              );
            })}
          </svg>

          {/* ── STEP 2: CENTRAL SUN CORE NODE (DRAGGABLE, LOCKABLE, STABLE KEY) ── */}
          <div
            key={`sun-${client.ClientID}`}
            onPointerDown={handleSunPointerDown}
            onDoubleClick={handleSunDoubleClick}
            style={{
              position: 'absolute',
              top: `${coreNodeGeometry.y}px`,
              left: `${coreNodeGeometry.x}px`,
              width: `${coreNodeGeometry.width}px`,
              height: `${coreNodeGeometry.height}px`,
            }}
            className={`z-20 pointer-events-auto rounded-2xl border-2 border-[#E0CA3C] bg-gradient-to-br from-[#0d1f18] via-[#05130e] to-[#020500] p-5 shadow-[0_0_50px_rgba(224,202,60,0.35)] flex flex-col select-none transition-shadow ${
              interactionMode === 'lock' ? 'cursor-default' : 'cursor-move hover:shadow-[0_0_60px_rgba(224,202,60,0.5)]'
            }`}
            title="Core Deliverable Node - Click and drag to reposition Sun (Double-click to reset)"
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

          {/* ── SATELLITE NODES ── */}
          {activeTab === 'SATELLITES' && showNonStructural && (
            <>
              {nodes.map((node) => (
                <ResizableNodeContainer
                  key={node.id}
                  node={{
                    ...node,
                    isLocked: node.isLocked || interactionMode === 'lock',
                  }}
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

      {/* Financial Mutation Confirmation Modal */}
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
