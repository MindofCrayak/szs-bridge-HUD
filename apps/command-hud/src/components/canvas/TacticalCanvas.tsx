import React, { useState } from 'react';
import { useCanvasTransform } from '../../hooks/useCanvasTransform';
import { ClientRecord, ProjectRecord } from '../../types';
import { ACCOUNT_PHASES, SPRINT_STAGES } from '../../data/pipeline';
import { AccountPhaseColumn } from './AccountPhaseColumn';
import { SprintStageColumn } from './SprintStageColumn';

interface TacticalCanvasProps {
  clients: ClientRecord[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onForceAdvance?: (client: ClientRecord) => void;
  onOpenContextMenu: (x: number, y: number, item: ClientRecord | ProjectRecord) => void;
  scale?: number;
  setScale?: (scale: number | ((prev: number) => number)) => void;
}

/**
 * Tactical Horizon Canvas
 * 1. Hardware-Accelerated Pan & Zoom using transform: translate3d(x, y, 0).
 * 2. In-Place Option A Drilldown: Default 6 AccountPhase columns.
 *    Right-click [ Sprint Stage View ] or button swaps to 10 granular SprintStage columns
 *    isolated to that client's projects.
 * 3. Breadcrumb [ GLOBAL PIPELINE ] / [ ✦ CLIENT_NAME ] to exit back to macro.
 * 4. Strict-Lock columns with [ Admin: Force Advance ] override.
 */
export const TacticalCanvas: React.FC<TacticalCanvasProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onOpenContextMenu,
}) => {
  const { viewportRef, stageRef, transformStyle, resetTransform } = useCanvasTransform(1.0);
  
  // Option A In-Place Drill-Down State
  const [drillDownClient, setDrillDownClient] = useState<ClientRecord | null>(null);

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
      className="relative flex-1 w-full h-full overflow-hidden select-none bg-[#020500] cursor-grab active:cursor-grabbing canvas-pannable-bg"
    >
      {/* Background Tactical Grid & Scanlines */}
      <div className="crm-grid pointer-events-none absolute inset-0 opacity-40" />

      {/* Breadcrumb Bar (When drilled down into 10 granular stages) */}
      {drillDownClient && (
        <div className="absolute top-3 left-4 z-30 flex items-center gap-2 font-mono text-xs bg-[#020500]/95 border border-[#E0CA3C] rounded-lg px-3 py-1.5 shadow-[0_0_20px_rgba(224,202,60,0.35)]">
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
            <span className="text-[#FE5F00] text-[0.65rem] px-1.5 py-0.5 bg-[#5F0F40]/70 rounded font-mono">10 STAGES</span>
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

      {/* Hardware-Accelerated Scalable Matrix Layer (translate3d + scale) */}
      <div
        ref={stageRef}
        style={transformStyle}
        className="flex gap-4 p-4 min-h-full canvas-pannable-bg"
      >
        {!drillDownClient ? (
          // MACRO VIEW: 6 AccountPhase Columns (01 Intake through 06 Archived/Sunset)
          ACCOUNT_PHASES.map((phaseConfig) => {
            const phaseClients = clients.filter((c) => c.AccountPhase === phaseConfig.phase);
            return (
              <AccountPhaseColumn
                key={phaseConfig.id}
                config={phaseConfig}
                clients={phaseClients}
                selectedClientId={selectedClientId}
                onSelectClient={onSelectClient}
                onDrillDown={handleDrillDown}
                onContextMenu={(e, c) => onOpenContextMenu(e.clientX, e.clientY, c)}
              />
            );
          })
        ) : (
          // GRANULAR VIEW: 10 SprintStage Columns (00 Discovery through 09 Sunset)
          // Strictly filtered to drillDownClient's activeProjects
          SPRINT_STAGES.map((stageConfig) => {
            const stageProjects = (drillDownClient.activeProjects || []).filter(
              (p) => p.SprintStage === stageConfig.stage
            );
            return (
              <SprintStageColumn
                key={stageConfig.id}
                config={stageConfig}
                projects={stageProjects}
                companyName={drillDownClient.Company_Name}
                onContextMenu={(e, p) => onOpenContextMenu(e.clientX, e.clientY, p)}
              />
            );
          })
        )}
      </div>

      {/* Recenter Horizon Control Pill */}
      <button
        type="button"
        onClick={resetTransform}
        className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 rounded-full border border-[#086375] bg-[#020500]/85 px-3 py-1 font-mono text-[0.62rem] text-[#DDFBD0]/70 hover:border-[#E0CA3C] hover:text-[#E0CA3C] transition-all shadow-md cursor-pointer"
        title="Reset canvas pan & zoom (Alt+0)"
      >
        <i className="fa-solid fa-arrows-to-dot text-xs text-[#E0CA3C]" />
        <span>RECENTER HORIZON</span>
      </button>
    </div>
  );
};
