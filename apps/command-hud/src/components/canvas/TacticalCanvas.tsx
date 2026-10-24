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
        <div className="absolute top-3 left-4 z-30 flex items-center gap-2 font-mono text-xs bg-[#020500]/90 border border-[#E0CA3C] rounded-lg px-3 py-1.5 shadow-[0_0_15px_rgba(224,202,60,0.3)]">
          <button
            type="button"
            onClick={handleExitDrillDown}
            className="text-[#DDFBD0]/70 hover:text-[#E0CA3C] flex items-center gap-1 font-bold transition-colors cursor-pointer"
          >
            <span>[ GLOBAL PIPELINE ]</span>
          </button>
          <span className="text-[#086375]">/</span>
          <span className="text-[#E0CA3C] font-bold flex items-center gap-1">
            <span>✦ {drillDownClient.Company_Name || drillDownClient.ClientID}</span>
            <span className="text-[#FE5F00] text-[0.65rem] px-1 bg-[#5F0F40]/60 rounded">10 STAGES</span>
          </span>
          <button
            type="button"
            onClick={handleExitDrillDown}
            className="ml-2 text-xs text-[#FE5F00] hover:text-white px-1.5 py-0.2 rounded border border-[#FE5F00]/50"
            title="Press Esc or click to return to Macro Pipeline"
          >
            ESC ✕
          </button>
        </div>
      )}

      {/* Scalable Matrix Layer */}
      <div
        ref={stageRef}
        style={transformStyle}
        className="flex gap-4 p-4 min-h-full canvas-pannable-bg"
      >
        {!drillDownClient ? (
          // MACRO VIEW: 6 AccountPhase Columns
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
          // GRANULAR VIEW: 10 SprintStage Columns strictly filtered to drillDownClient
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

      {/* Quick Reset Canvas HUD Pill */}
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
