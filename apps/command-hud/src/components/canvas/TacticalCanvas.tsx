import React, { useEffect, useState, useRef } from 'react';
import { useCanvasTransform } from '../../hooks/useCanvasTransform';
import { ClientRecord, ProjectRecord, AccountPhase } from '../../types';
import { SlimVitalsCard } from './SlimVitalsCard';
import { ProjectWorkbenchView } from './ProjectWorkbenchView';
import { CanvasFloatingToolbar } from './CanvasFloatingToolbar';
import { WirePanelActions, WirePanelSnapshot } from '../../ecs/links';
import type { AgentCallsign, AlfredNodeContext } from '../../ecs/agentDispatch';

interface TacticalCanvasProps {
  clients: ClientRecord[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onUpdateClient?: (updated: ClientRecord) => void;
  onForceAdvance?: (client: ClientRecord) => void;
  onOpenContextMenu: (x: number, y: number, item: ClientRecord | ProjectRecord) => void;
  scale?: number;
  setScale?: (scale: number | ((prev: number) => number)) => void;
  onWorkbenchChange?: (client: ClientRecord | null) => void;
  workbenchClient?: ClientRecord | null;
  accessToken?: string | null;
  interactionMode?: 'drag' | 'lock' | 'edit';
  showNonStructural?: boolean;
  activeWireIds?: string[];
  doneNodeIds?: string[];
  onWirePanelChange?: (snapshot: WirePanelSnapshot | null) => void;
  onWirePanelActionsChange?: (actions: WirePanelActions | null) => void;
  onDispatchAgent?: (agent: AgentCallsign, nodeContext: AlfredNodeContext) => void;
}

interface MacroZone {
  id: string;
  phase: AccountPhase;
  title: string;
  badge: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const MACRO_ZONES: MacroZone[] = [
  { id: 'zone-01', phase: '01: Intake', title: '01: INTAKE', badge: 'LEADS', color: '#086375', x: 80, y: 100, width: 440, height: 1800 },
  { id: 'zone-02', phase: '02: Session Zero', title: '02: SESSION ZERO', badge: 'DISCOVERY', color: '#3C91E6', x: 580, y: 100, width: 440, height: 1800 },
  { id: 'zone-03', phase: '03: Active Sprints', title: '03: ACTIVE SPRINTS', badge: 'EXECUTION', color: '#5F0F40', x: 1080, y: 100, width: 440, height: 1800 },
  { id: 'zone-04', phase: '04: Liftoff', title: '04: LIFTOFF', badge: 'HANDOVER', color: '#E0CA3C', x: 1580, y: 100, width: 440, height: 1800 },
];

export const TacticalCanvas: React.FC<TacticalCanvasProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onUpdateClient,
  onOpenContextMenu,
  scale: propScale,
  setScale: propSetScale,
  onWorkbenchChange,
  workbenchClient: propWorkbenchClient,
  accessToken,
  interactionMode: propInteractionMode = 'drag',
  showNonStructural: propShowNonStructural = true,
  activeWireIds = [],
  doneNodeIds = [],
  onWirePanelChange,
  onWirePanelActionsChange,
  onDispatchAgent,
}) => {
  const {
    viewportRef,
    stageRef,
    pan,
    scale,
    isPanning,
    resetTransform,
    handlePointerDown,
    setPan,
    setScale,
  } = useCanvasTransform(propScale, propSetScale);

  // Local interaction mode and non-structural toggle for canvas toolbar
  const [interactionMode, setInteractionMode] = useState<'drag' | 'lock' | 'edit'>(propInteractionMode);
  const [showNonStructural, setShowNonStructural] = useState<boolean>(propShowNonStructural);

  // Read canvas theme from local storage
  const [canvasTheme, setCanvasTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('szs_canvas_theme') || 'obsidian-grid';
    } catch {
      return 'obsidian-grid';
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const theme = localStorage.getItem('szs_canvas_theme') || 'obsidian-grid';
        setCanvasTheme(theme);
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Tier 2: Project Workbench State (Synced with external prop if provided)
  const [internalWorkbenchClient, setInternalWorkbenchClient] = useState<ClientRecord | null>(null);
  const workbenchClient = propWorkbenchClient !== undefined ? propWorkbenchClient : internalWorkbenchClient;

  // Sync internal workbench state when prop changes
  useEffect(() => {
    if (propWorkbenchClient !== undefined) {
      setInternalWorkbenchClient(propWorkbenchClient);
      if (propWorkbenchClient) {
        setPan({ x: 0, y: 0 });
        setScale(1.0);
      }
    }
  }, [propWorkbenchClient, setPan, setScale]);

  // Free-floating client card positions on 2D infinite plane
  const [cardPositions, setCardPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Initialize or re-index card positions based on their AccountPhase zones
  useEffect(() => {
    setCardPositions((prev) => {
      const next = { ...prev };
      const zoneCounters: Record<string, number> = {
        '01: Intake': 0,
        '02: Session Zero': 0,
        '03: Active Sprints': 0,
        '04: Liftoff': 0,
      };

      clients.forEach((c) => {
        if (!next[c.ClientID]) {
          const zone = MACRO_ZONES.find((z) => z.phase === c.AccountPhase) || MACRO_ZONES[0];
          const count = zoneCounters[zone.phase] || 0;
          zoneCounters[zone.phase] = count + 1;
          next[c.ClientID] = {
            x: zone.x + 20,
            y: zone.y + 80 + count * 220,
          };
        }
      });
      return next;
    });
  }, [clients]);

  // Handle Double-click to open Project Workbench (Tier 2)
  const handleOpenWorkbench = (client: ClientRecord) => {
    setInternalWorkbenchClient(client);
    onSelectClient(client.ClientID);
    onWorkbenchChange?.(client);
    setPan({ x: 0, y: 0 });
    setScale(1.0);
  };

  const handleCloseWorkbench = () => {
    setInternalWorkbenchClient(null);
    onWorkbenchChange?.(null);
  };

  // Drag-and-Drop calculation of Client Cards across Macro Zones
  const draggingCardRef = useRef<{
    id: string;
    screenX: number;
    screenY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const onCardPointerDown = (e: React.PointerEvent, client: ClientRecord) => {
    e.stopPropagation();
    onSelectClient(client.ClientID);
    const pos = cardPositions[client.ClientID] || { x: 100, y: 150 };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    draggingCardRef.current = {
      id: client.ClientID,
      screenX: e.clientX,
      screenY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
  };

  const onCardPointerMove = (e: React.PointerEvent) => {
    if (!draggingCardRef.current) return;
    e.stopPropagation();
    const zoom = scale > 0 ? scale : 1.0;
    const dx = (e.clientX - draggingCardRef.current.screenX) / zoom;
    const dy = (e.clientY - draggingCardRef.current.screenY) / zoom;
    const newX = draggingCardRef.current.startX + dx;
    const newY = draggingCardRef.current.startY + dy;

    setCardPositions((prev) => ({
      ...prev,
      [draggingCardRef.current!.id]: { x: newX, y: newY },
    }));
  };

  const onCardPointerUp = (e: React.PointerEvent, client: ClientRecord) => {
    if (!draggingCardRef.current) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const pos = cardPositions[client.ClientID];
    if (pos) {
      const cardCenterX = pos.x + 190;
      const matchedZone = MACRO_ZONES.find(
        (z) => cardCenterX >= z.x && cardCenterX <= z.x + z.width
      );

      if (matchedZone && matchedZone.phase !== client.AccountPhase) {
        onUpdateClient?.({
          ...client,
          AccountPhase: matchedZone.phase,
        });
      }
    }
    draggingCardRef.current = null;
  };

  return (
    <div
      ref={viewportRef}
      data-canvas-bg="true"
      onPointerDown={handlePointerDown}
      className="relative w-full h-full overflow-hidden bg-[#020500] select-none cursor-grab active:cursor-grabbing canvas-pannable-bg z-0"
    >
      {/* ── STEP 4: FLOATING CANVAS TOOLBAR (TOP-LEFT OVERLAY) ── */}
      <CanvasFloatingToolbar
        mode={interactionMode}
        onSetMode={setInteractionMode}
        showNonStructural={showNonStructural}
        onToggleNonStructural={() => setShowNonStructural((p) => !p)}
        scale={scale}
        onSetScale={setScale}
        onResetTransform={resetTransform}
      />

      {/* Module 2: Customizable Canvas Background Layer */}
      <div
        className="absolute inset-0 z-[-1] pointer-events-none canvas-pannable-bg"
        data-theme={canvasTheme}
        data-canvas-bg="true"
      >
        {canvasTheme === 'tactical-hex' ? (
          <svg className="w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tactical-hex-grid" width="40" height="69.282" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
                <path d="M 40 0 L 20 11.547 L 0 0 L 0 23.094 L 20 34.641 L 40 23.094 Z M 0 34.641 L 20 46.188 L 0 57.735 L 0 80.829 L 20 92.376 L 40 80.829 L 40 57.735 L 20 46.188 Z" fill="none" stroke="#086375" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tactical-hex-grid)" />
          </svg>
        ) : canvasTheme === 'void' ? (
          <div className="w-full h-full bg-[#020500] pointer-events-none" />
        ) : (
          <div className="crm-grid w-full h-full opacity-40 pointer-events-none" />
        )}
      </div>

      {/* ── TIER 2: PROJECT WORKBENCH VIEW (NOW DRIVEN BY SHARED CAMERA PAN & ZOOM) ── */}
      {workbenchClient ? (
        <div className="relative z-30 w-full h-full pointer-events-none">
          <ProjectWorkbenchView
            client={workbenchClient}
            onExit={handleCloseWorkbench}
            onUpdateClient={onUpdateClient}
            cameraZoom={scale}
            cameraPan={pan}
            accessToken={accessToken}
            interactionMode={interactionMode}
            showNonStructural={showNonStructural}
            activeWireIds={activeWireIds}
            doneNodeIds={doneNodeIds}
            onWirePanelChange={onWirePanelChange}
            onWirePanelActionsChange={onWirePanelActionsChange}
            onDispatchAgent={onDispatchAgent}
            onTriggerAction={(action, payload) => {
              if (action === 'FOCUS_NODE' && typeof payload?.x === 'number' && typeof payload?.y === 'number') {
                const viewport = viewportRef.current?.getBoundingClientRect();
                if (!viewport) return;
                setPan({
                  x: Math.round(viewport.width / 2 - (viewport.width / 2 + payload.x) * scale),
                  y: Math.round(viewport.height / 2 - (viewport.height / 2 + payload.y) * scale),
                });
                return;
              }
              if (action === 'FIT_WORKBENCH' && typeof payload?.left === 'number'
                && typeof payload?.top === 'number' && typeof payload?.right === 'number'
                && typeof payload?.bottom === 'number') {
                const viewport = viewportRef.current?.getBoundingClientRect();
                if (!viewport) return;
                const width = Math.max(1, payload.right - payload.left);
                const height = Math.max(1, payload.bottom - payload.top);
                const fitScale = Math.min(
                  3,
                  Math.max(0.2, Math.min((viewport.width - 96) / width, (viewport.height - 96) / height)),
                );
                const centerX = (payload.left + payload.right) / 2;
                const centerY = (payload.top + payload.bottom) / 2;
                setScale(fitScale);
                setPan({
                  x: Math.round(viewport.width / 2 - (viewport.width / 2 + centerX) * fitScale),
                  y: Math.round(viewport.height / 2 - (viewport.height / 2 + centerY) * fitScale),
                });
                return;
              }
              if (action === 'TOGGLE_SATELLITES') {
                setShowNonStructural((visible) => !visible);
                return;
              }
              if (action === 'OPEN_TASKS' || action === 'DRAFT_INVOICE') {
                onOpenContextMenu(window.innerWidth / 2, window.innerHeight / 2, payload?.client || workbenchClient);
              }
            }}
          />
        </div>
      ) : (
        /* ── TIER 1: GALAXY VIEW (MACRO PIPELINE & FLOATING CARDS) ──── */
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
            willChange: isPanning ? 'transform' : 'auto',
          }}
          className="canvas-world-layer bg-transparent border-none block pointer-events-auto z-10"
        >
          {/* 1. Macro 4-Stage Bounding Zones */}
          {MACRO_ZONES.map((zone) => {
            const count = clients.filter((c) => c.AccountPhase === zone.phase).length;
            return (
              <div
                key={zone.id}
                style={{
                  position: 'absolute',
                  left: `${zone.x}px`,
                  top: `${zone.y}px`,
                  width: `${zone.width}px`,
                  height: `${zone.height}px`,
                  borderColor: `${zone.color}40`,
                  backgroundColor: `${zone.color}08`,
                }}
                className="pointer-events-none rounded-2xl border-2 border-dashed flex flex-col p-4 select-none backdrop-blur-[2px]"
              >
                {/* Zone Header Ribbon */}
                <div
                  className="flex items-center justify-between p-3 rounded-xl border border-b-2 mb-4"
                  style={{ borderColor: `${zone.color}60`, backgroundColor: `${zone.color}20` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]"
                      style={{ backgroundColor: zone.color, color: zone.color }}
                    />
                    <span className="font-display font-extrabold text-sm text-[#DDFBD0] tracking-wider">
                      {zone.title}
                    </span>
                  </div>
                  <span
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
                    style={{ borderColor: zone.color, color: zone.color, backgroundColor: `${zone.color}30` }}
                  >
                    {count} ACTIVE
                  </span>
                </div>
              </div>
            );
          })}

          {/* 2. Free-Floating Absolute Positioned Client Cards */}
          {clients.map((client) => {
            const pos = cardPositions[client.ClientID] || { x: 100, y: 150 };
            const isSelected = selectedClientId === client.ClientID;

            return (
              <div
                key={client.ClientID}
                style={{
                  position: 'absolute',
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: '380px',
                }}
                onPointerDown={(e) => onCardPointerDown(e, client)}
                onPointerMove={onCardPointerMove}
                onPointerUp={(e) => onCardPointerUp(e, client)}
                onDoubleClick={() => handleOpenWorkbench(client)}
                className="cursor-move z-20 pointer-events-auto transition-shadow"
              >
                <SlimVitalsCard
                  client={client}
                  isSelected={isSelected}
                  onSelect={() => onSelectClient(client.ClientID)}
                  onDrillDown={() => handleOpenWorkbench(client)}
                  onContextMenu={(e, c) => onOpenContextMenu(e.clientX, e.clientY, c)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TacticalCanvas;
