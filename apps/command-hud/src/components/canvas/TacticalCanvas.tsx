import React, { useState } from 'react';
import { useCanvasTransform } from '../../hooks/useCanvasTransform';
import { ClientRecord, ProjectRecord } from '../../types';
import { ACCOUNT_PHASES, SPRINT_STAGES } from '../../data/pipeline';
import SpatialKanbanColumn, { ColumnState } from './SpatialKanbanColumn';
import { SlimVitalsCard } from './SlimVitalsCard';
import { ProjectSprintCard } from './ProjectSprintCard';

interface TacticalCanvasProps {
  clients: ClientRecord[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onForceAdvance?: (client: ClientRecord) => void;
  onOpenContextMenu: (x: number, y: number, item: ClientRecord | ProjectRecord) => void;
  scale?: number;
  setScale?: (scale: number | ((prev: number) => number)) => void;
}

const PHASE_COLORS: Record<string, string> = {
  'phase-01': '#086375',
  'phase-02': '#3C91E6',
  'phase-03': '#5F0F40',
  'phase-04': '#E0CA3C',
  'phase-05': '#DDFBD0',
  'phase-06': '#8A9A86',
};

// Compute default macro layout positions
function createInitialMacroColumns(): ColumnState[] {
  const columnWidth = 380;
  const gap = 24;
  const startX = 64;
  const startY = 64;
  const defaultHeight = 720;

  return ACCOUNT_PHASES.map((p, idx) => ({
    id: p.id,
    title: p.title,
    phase: p.phase,
    badge: p.badge,
    color: PHASE_COLORS[p.id] || '#086375',
    x: startX + idx * (columnWidth + gap),
    y: startY,
    width: columnWidth,
    height: defaultHeight,
    isLocked: false,
  }));
}

// Compute default granular layout positions
function createInitialSprintColumns(): ColumnState[] {
  const columnWidth = 300;
  const gap = 20;
  const startX = 64;
  const startY = 64;
  const defaultHeight = 700;

  return SPRINT_STAGES.map((s, idx) => ({
    id: s.id,
    title: s.title,
    stage: s.stage,
    badge: s.badge,
    color: '#5F0F40',
    x: startX + idx * (columnWidth + gap),
    y: startY,
    width: columnWidth,
    height: defaultHeight,
    isLocked: false,
  }));
}

export const TacticalCanvas: React.FC<TacticalCanvasProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onOpenContextMenu,
}) => {
  const { viewportRef, stageRef, pan, scale, isPanning, resetTransform } = useCanvasTransform(1.0);

  // In-Place Option A Drill-Down State
  const [drillDownClient, setDrillDownClient] = useState<ClientRecord | null>(null);

  // Spatial column state for Macro (6 columns) and Granular (10 columns)
  const [macroColumns, setMacroColumns] = useState<ColumnState[]>(createInitialMacroColumns);
  const [sprintColumns, setSprintColumns] = useState<ColumnState[]>(createInitialSprintColumns);

  const handleUpdateMacroColumn = (id: string, updates: Partial<ColumnState>) => {
    setMacroColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, ...updates } : col))
    );
  };

  const handleUpdateSprintColumn = (id: string, updates: Partial<ColumnState>) => {
    setSprintColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, ...updates } : col))
    );
  };

  const handleDrillDown = (client: ClientRecord) => {
    setDrillDownClient(client);
    onSelectClient(client.ClientID);
  };

  const handleExitDrillDown = () => {
    setDrillDownClient(null);
  };

  return (
    <div
      ref={viewportRef}
      data-canvas-bg="true"
      className="relative w-full h-full overflow-hidden bg-[#020500] select-none cursor-grab active:cursor-grabbing canvas-pannable-bg"
    >
      {/* Background Tactical Grid & Scanlines */}
      <div className="crm-grid pointer-events-none absolute inset-0 opacity-40" />

      {/* Breadcrumb Bar (When drilled down into 10 granular stages) */}
      {drillDownClient && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 font-mono text-xs bg-[#020500]/95 border border-[#E0CA3C] rounded-lg px-3 py-1.5 shadow-[0_0_20px_rgba(224,202,60,0.35)]">
          <button
            type="button"
            onClick={handleExitDrillDown}
            className="text-[#DDFBD0]/70 hover:text-[#E0CA3C] flex items-center gap-1 font-bold transition-colors cursor-pointer"
          >
            <span>[ GLOBAL PIPELINE ]</span>
          </button>
          <span className="text-[#086375]">/</span>
          <span className="text-[#E0CA3C] font-bold flex items-center gap-1.5">
            <span>✦ {drillDownClient.Company_Name || drillDownClient.ClientID}</span>
            <span className="text-[#FE5F00] text-[0.65rem] px-1.5 py-0.5 bg-[#5F0F40]/70 rounded font-mono">
              10 STAGES
            </span>
          </span>
          <button
            type="button"
            onClick={handleExitDrillDown}
            className="ml-2 text-xs text-[#FE5F00] hover:text-white px-2 py-0.5 rounded border border-[#FE5F00]/50 hover:bg-[#FE5F00] hover:text-black transition-colors cursor-pointer"
            title="Press Esc or click to return to Macro Pipeline"
          >
            ESC ✕
          </button>
        </div>
      )}

      {/* Hardware-Accelerated 2D World Space Layer */}
      <div
        ref={stageRef}
        data-canvas-bg="true"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '5000px',
          height: '3000px',
          transition: isPanning ? 'none' : 'transform 75ms ease-out',
        }}
        className="canvas-world-layer pointer-events-auto"
      >
        {!drillDownClient ? (
          // MACRO SPATIAL VIEW: 6 Floating, Reshapable, Lockable Columns
          macroColumns.map((col) => {
            const phaseClients = clients.filter((c) => c.AccountPhase === col.phase);
            return (
              <SpatialKanbanColumn
                key={col.id}
                column={col}
                cameraZoom={scale}
                updateColumn={handleUpdateMacroColumn}
              >
                {phaseClients.map((client) => (
                  <SlimVitalsCard
                    key={client.ClientID}
                    client={client}
                    isSelected={selectedClientId === client.ClientID}
                    onSelect={() => onSelectClient(client.ClientID)}
                    onDrillDown={handleDrillDown}
                    onContextMenu={(e, c) => onOpenContextMenu(e.clientX, e.clientY, c)}
                  />
                ))}
                {phaseClients.length === 0 && (
                  <div className="h-28 border border-dashed border-[#086375]/30 rounded-lg flex items-center justify-center font-mono text-[0.65rem] text-[#DDFBD0]/40 text-center px-4">
                    No active nodes in {col.title}
                  </div>
                )}
              </SpatialKanbanColumn>
            );
          })
        ) : (
          // GRANULAR SPATIAL VIEW: 10 Floating, Reshapable, Lockable Sprint Columns
          sprintColumns.map((col) => {
            const stageProjects = (drillDownClient.activeProjects || []).filter(
              (p) => p.SprintStage === col.stage
            );
            return (
              <SpatialKanbanColumn
                key={col.id}
                column={col}
                cameraZoom={scale}
                updateColumn={handleUpdateSprintColumn}
              >
                {stageProjects.map((project) => (
                  <ProjectSprintCard
                    key={project.ProjectID}
                    project={project}
                    companyName={drillDownClient.Company_Name}
                    onContextMenu={onOpenContextMenu}
                  />
                ))}
                {stageProjects.length === 0 && (
                  <div className="h-24 flex items-center justify-center font-mono text-[0.6rem] text-[#086375]/50 border border-dashed border-[#086375]/30 rounded-lg">
                    Empty
                  </div>
                )}
              </SpatialKanbanColumn>
            );
          })
        )}
      </div>

      {/* Recenter Horizon Control Pill */}
      <button
        type="button"
        onClick={resetTransform}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-[#086375] bg-[#020500]/90 px-3.5 py-1.5 font-mono text-[0.65rem] text-[#DDFBD0]/70 hover:border-[#E0CA3C] hover:text-[#E0CA3C] transition-all shadow-lg cursor-pointer"
        title="Reset canvas pan & zoom (Alt+0)"
      >
        <i className="fa-solid fa-arrows-to-dot text-xs text-[#E0CA3C]" />
        <span>RECENTER HORIZON</span>
      </button>
    </div>
  );
};

export default TacticalCanvas;
