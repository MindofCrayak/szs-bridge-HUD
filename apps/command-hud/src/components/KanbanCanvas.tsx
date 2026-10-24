import React, { useRef, useState, useCallback } from 'react';
import { ClientUnit } from '../types';
import { getPipelineColumnIndex, getPipelineStageForColumn, normalizePipelineStage, PIPELINE_COLUMNS } from '../data/pipeline';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

interface KanbanCanvasProps {
  units: ClientUnit[];
  activeFilters: number[];
  activeUnitId: string | null;
  selectedUnitIds: string[];
  onSelectUnit: (id: string, isShift: boolean) => void;
  onUpdateUnitPosition: (id: string, x: number, y: number, pipelineStage?: string) => void;
  gridSnapEnabled: boolean;
  onLogTerminal: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
  onOpenContextMenu: (x: number, y: number, client: ClientUnit) => void;
}

export const KanbanCanvas: React.FC<KanbanCanvasProps> = ({
  units,
  activeFilters,
  activeUnitId,
  selectedUnitIds,
  onSelectUnit,
  onUpdateUnitPosition,
  gridSnapEnabled,
  onLogTerminal,
  onOpenContextMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Dragging state
  const dragRef = useRef<{
    isDragging: boolean;
    unitId: string | null;
    startX: number;
    startY: number;
    initLeft: number;
    initTop: number;
    hasMoved: boolean;
  }>({
    isDragging: false,
    unitId: null,
    startX: 0,
    startY: 0,
    initLeft: 0,
    initTop: 0,
    hasMoved: false,
  });

  const getPipelineStageFromCoordinates = useCallback((x: number, maxX: number, currentStage: string) => {
    const columnIndex = Math.min(PIPELINE_COLUMNS.length - 1, Math.max(0, Math.floor((x / Math.max(maxX, 1)) * PIPELINE_COLUMNS.length)));
    return getPipelineColumnIndex(currentStage) === columnIndex
      ? currentStage
      : getPipelineStageForColumn(columnIndex);
  }, []);
  const visibleUnits = units.filter((unit) => (
    normalizePipelineStage(unit.pipelineStage) !== '09: Sunset / Retainer'
  ) && activeFilters.includes(getPipelineColumnIndex(unit.pipelineStage)));

  const handlePointerDown = (e: React.PointerEvent, unit: ClientUnit) => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const isShift = e.shiftKey || e.ctrlKey;
    onSelectUnit(unit.id, isShift);

    dragRef.current = {
      isDragging: true,
      unitId: unit.id,
      startX: e.clientX,
      startY: e.clientY,
      initLeft: (unit.posX / 1000) * container.clientWidth,
      initTop: unit.posY,
      hasMoved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container || !dragRef.current.isDragging || !dragRef.current.unitId) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragRef.current.hasMoved = true;
    }

    const unit = units.find((u) => u.id === dragRef.current.unitId);
    if (!unit) return;

    const maxW = container.clientWidth - 210;
    const maxH = container.clientHeight - 85;

    let newX = dragRef.current.initLeft + dx;
    let newY = dragRef.current.initTop + dy;

    if (gridSnapEnabled) {
      const snap = 20;
      newX = Math.round(newX / snap) * snap;
      newY = Math.round(newY / snap) * snap;
    }

    newX = Math.max(10, Math.min(newX, maxW));
    newY = Math.max(10, Math.min(newY, maxH));

    const normalizedX = (newX / container.clientWidth) * 1000;
    const pipelineStage = getPipelineStageFromCoordinates(normalizedX, 1000, unit.pipelineStage);

    // Update pipeline stage hover check
    const colIndex = Math.min(3, Math.max(0, Math.floor((normalizedX / 1000) * 4)));
    const zoneIds = ['zone-intake', 'zone-session-zero', 'zone-active-sprints', 'zone-liftoff'];
    setHoveredZoneId(zoneIds[colIndex] || null);

    onUpdateUnitPosition(unit.id, normalizedX, newY, pipelineStage);
  };

  const handlePointerUp = () => {
    if (!dragRef.current.isDragging) return;

    const unit = units.find((u) => u.id === dragRef.current.unitId);
    if (unit && dragRef.current.hasMoved) {
      const container = containerRef.current;
      const finalStage = container
        ? getPipelineStageFromCoordinates(unit.posX, 1000, unit.pipelineStage)
        : getPipelineStageForColumn(0);

      onLogTerminal(
        `Pipeline stage updated: ${unit.name} moved to ${finalStage}.`,
        'action'
      );
    }

    dragRef.current.isDragging = false;
    dragRef.current.unitId = null;
    setHoveredZoneId(null);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative min-w-[1680px] max-w-[1680px] h-[1050px] flex-shrink-0 overflow-x-hidden cursor-default select-none border-t-2 border-t-[#E0CA3C] bg-bg-obsidian"
      style={{
        background: 'linear-gradient(135deg, #0d1f18, #05130e 55%, #020500)'
      }}
    >
      <div className="crm-grid absolute inset-0" />
      <div className="crt-scanlines pointer-events-none absolute inset-0 z-10" />

      {/* Client pipeline stages */}
      <div
        className="pointer-events-none absolute inset-3 z-5 flex gap-3"
      >
        {/* Intake */}
        <div
          id="zone-intake"
          className={`relative w-[400px] flex-shrink-0 overflow-hidden border-1.5 border-t-2 border-dashed border-t-[#E0CA3C] rounded-lg p-2.5 flex flex-col bg-gradient-to-b from-[#0d1f18]/75 via-[#05130e]/80 to-[#020500]/75 shadow-[0_0_15px_rgba(224,202,60,0.15)] before:pointer-events-none before:absolute before:left-3 before:right-3 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent transition-all ${
            hoveredZoneId === 'zone-intake'
              ? 'border-[#E0CA3C] shadow-[0_0_15px_rgba(224,202,60,0.25)]'
              : 'border-accent-teal/45'
          }`}
        >
          <div className="flex justify-between items-center font-display text-[0.65rem] tracking-wider text-text-mana/80 border-b border-accent-teal/40 pb-1">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-layer-group text-alert-orange"></i>
              <span>INTAKE</span>
            </span>
            <span className="font-mono text-[0.62rem] px-1.5 py-0.5 rounded bg-primary-plum/70 border border-accent-teal text-alert-orange">
              LEADS
            </span>
          </div>
          <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-text-mana/45">{PIPELINE_COLUMNS[0].stages.join(' · ')}</p>
        </div>

        {/* Session Zero */}
        <div
          id="zone-session-zero"
          className={`relative w-[400px] flex-shrink-0 overflow-hidden border-1.5 border-t-2 border-dashed border-t-[#E0CA3C] rounded-lg p-2.5 flex flex-col bg-gradient-to-b from-[#0d1f18]/75 via-[#05130e]/80 to-[#020500]/75 shadow-[0_0_15px_rgba(224,202,60,0.15)] before:pointer-events-none before:absolute before:left-3 before:right-3 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent transition-all ${
            hoveredZoneId === 'zone-session-zero'
              ? 'border-[#E0CA3C] shadow-[0_0_15px_rgba(224,202,60,0.25)]'
              : 'border-accent-teal/45'
          }`}
        >
          <div className="flex justify-between items-center font-display text-[0.65rem] tracking-wider text-text-mana/80 border-b border-accent-teal/40 pb-1">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-clipboard-list text-alert-orange"></i>
              <span>SESSION ZERO</span>
            </span>
            <span className="font-mono text-[0.62rem] px-1.5 py-0.5 rounded bg-primary-plum/70 border border-accent-teal text-alert-orange">
              DISCOVERY
            </span>
          </div>
          <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-text-mana/45">{PIPELINE_COLUMNS[1].stages.join(' · ')}</p>
        </div>

        {/* Active Sprints */}
        <div
          id="zone-active-sprints"
          className={`relative w-[400px] flex-shrink-0 overflow-hidden border-1.5 border-t-2 border-dashed border-t-[#E0CA3C] rounded-lg p-2.5 flex flex-col bg-gradient-to-b from-[#0d1f18]/75 via-[#05130e]/80 to-[#020500]/75 shadow-[0_0_15px_rgba(224,202,60,0.15)] before:pointer-events-none before:absolute before:left-3 before:right-3 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent transition-all ${
            hoveredZoneId === 'zone-active-sprints'
              ? 'border-[#E0CA3C] shadow-[0_0_15px_rgba(224,202,60,0.25)]'
              : 'border-accent-teal/45'
          }`}
        >
          <div className="flex justify-between items-center font-display text-[0.65rem] tracking-wider text-text-mana/80 border-b border-accent-teal/40 pb-1">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-list-check text-alert-orange"></i>
              <span>ACTIVE SPRINTS</span>
            </span>
            <span className="font-mono text-[0.62rem] px-1.5 py-0.5 rounded bg-primary-plum/70 border border-accent-teal text-alert-orange">
              DELIVERY
            </span>
          </div>
          <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-text-mana/45">{PIPELINE_COLUMNS[2].stages.join(' · ')}</p>
        </div>

        {/* Liftoff */}
        <div
          id="zone-liftoff"
          className={`relative w-[400px] flex-shrink-0 overflow-hidden border-1.5 border-t-2 border-dashed border-t-[#E0CA3C] rounded-lg p-2.5 flex flex-col bg-gradient-to-b from-[#0d1f18]/75 via-[#05130e]/80 to-[#020500]/75 shadow-[0_0_15px_rgba(224,202,60,0.15)] before:pointer-events-none before:absolute before:left-3 before:right-3 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent transition-all ${
            hoveredZoneId === 'zone-liftoff'
              ? 'border-[#E0CA3C] shadow-[0_0_15px_rgba(224,202,60,0.25)]'
              : 'border-accent-teal/45'
          }`}
        >
          <div className="flex justify-between items-center font-display text-[0.65rem] tracking-wider text-text-mana/80 border-b border-accent-teal/40 pb-1">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-flag-checkered text-alert-orange"></i>
              <span>LIFTOFF</span>
            </span>
            <span className="font-mono text-[0.62rem] px-1.5 py-0.5 rounded bg-primary-plum/70 border border-accent-teal text-alert-orange">
              COMPLETE
            </span>
          </div>
          <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-text-mana/45">{PIPELINE_COLUMNS[3].stages.join(' · ')}</p>
        </div>
      </div>

      {/* Draggable Units */}
      {visibleUnits.map((unit) => {
        const isPrimary = unit.id === activeUnitId;
        const isMulti = selectedUnitIds.includes(unit.id);
        const isDragging = dragRef.current.isDragging && dragRef.current.unitId === unit.id;

        return (
          <div
            key={unit.id}
            onPointerDown={(e) => handlePointerDown(e, unit)}
            onContextMenu={(event) => {
              event.preventDefault();
              onOpenContextMenu(event.clientX, event.clientY, unit);
            }}
            id={`card-${unit.id}`}
            aria-label={`${unit.name} (${unit.id}), ${unit.archetype}, ${unit.pipelineStage}, contract $${unit.contractValue.toLocaleString()}, deposit ${unit.depositPaid ? 'paid' : 'unpaid'}, ${unit.completedMilestones} of ${unit.totalMilestones} milestones${unit.activePebble ? `, roadblock: ${unit.activePebble}` : ''}`}
            style={{
              left: `${unit.posX / 10}%`,
              top: `${unit.posY}px`,
              touchAction: 'none',
            }}
            className={`draggable-unit-node absolute w-[205px] rounded-md p-1.5 cursor-grab select-none transition-shadow duration-150 backdrop-blur-md z-15 ${
              isDragging
                ? 'cursor-grabbing scale-105 z-40 border-alert-orange shadow-[0_0_16px_rgba(254,95,0,0.4)]'
                : isPrimary
                ? 'border-[1.5px] border-[#E0CA3C] border-l-4 border-l-[#E0CA3C] bg-gradient-to-br from-[#0d1f18] via-[#05130e] to-[#020500] shadow-[0_0_16px_rgba(224,202,60,0.4)]'
                : isMulti
                ? 'border border-accent-teal border-l-4 bg-gradient-to-br from-[#0d1f18] via-[#05130e] to-[#020500] shadow-[0_0_10px_rgba(8,99,117,0.3)]'
                : 'border border-accent-teal border-l-[3px] bg-gradient-to-br from-[#0d1f18] via-[#05130e] to-[#020500] shadow-md hover:border-[#E0CA3C] hover:shadow-[0_0_12px_rgba(224,202,60,0.25)]'
            }`}
          >
            {/* Top Selection Label */}
            {isPrimary && (
              <span className="absolute -top-2 right-1.5 rounded-xs bg-alert-orange px-1 font-display text-[0.52rem] font-black tracking-wider text-bg-obsidian shadow">
                SELECTED
              </span>
            )}
            {!isPrimary && isMulti && (
              <span className="absolute -top-2 right-1.5 rounded-xs bg-accent-teal px-1 font-display text-[0.52rem] font-black tracking-wider text-text-mana shadow">
                IN GROUP
              </span>
            )}

            {/* Header: Icon, Name, Archetype, Coordinates Tag */}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border bg-primary-plum text-xs font-display font-bold shadow-inner ${
                  isPrimary
                    ? 'border-alert-orange text-alert-orange'
                    : 'border-accent-teal text-text-mana'
                }`}
              >
                {unit.avatar}
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="truncate font-display text-[0.74rem] font-bold text-text-mana" title={unit.companyName || unit.name}>
                  {unit.companyName || unit.id}
                </div>
                <div className="truncate text-[0.62rem] text-text-mana/65">
                  {unit.primaryContact || unit.leadSource || 'No Contact'}
                </div>
              </div>

              <span className="rounded bg-primary-plum px-1.5 py-0.5 font-mono text-[0.56rem] text-highlight-gold">{unit.id}</span>
            </div>

            <div className="mt-1">
              <div className="flex justify-between font-mono text-[0.56rem] text-text-mana">
                <span>Sprint Progress</span>
                <span>{unit.completedMilestones}/{unit.totalMilestones}</span>
              </div>
              <div
                className="h-1 overflow-hidden rounded-full bg-accent-teal/30"
                role="progressbar"
                aria-label={`${unit.name} sprint progress`}
                aria-valuemin={0}
                aria-valuemax={unit.totalMilestones}
                aria-valuenow={unit.completedMilestones}
              >
                <div
                  className="h-full bg-gradient-to-r from-[#086375] to-[#ddfbd0]"
                  style={{
                    width: `${unit.totalMilestones > 0
                      ? Math.min(100, (unit.completedMilestones / unit.totalMilestones) * 100)
                      : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1 font-mono text-[0.53rem]">
              <span className={`rounded px-1.5 py-0.5 ${unit.MSA_DocID ? 'bg-text-mana/20 text-text-mana' : 'bg-plasma text-bg-obsidian'}`}>
                {unit.MSA_DocID ? 'MSA READY' : 'MSA MISSING'}
              </span>
              <span className={`rounded px-1.5 py-0.5 ${unit.depositPaid ? 'text-gold' : 'bg-plasma text-bg-obsidian'}`}>
                {unit.depositPaid ? 'DEPOSIT PAID' : 'DEPOSIT DUE'}
              </span>
              {unit.osintGenerated || unit.caseFileJsonUrl ? (
                <span className="rounded px-1.5 py-0.5 text-radar">OSINT READY</span>
              ) : (
                <span className="rounded px-1.5 py-0.5 text-text-mana/40">OSINT PENDING</span>
              )}
              {unit.driveFolderUrl || unit.RootFolderID ? (
                <span className="rounded bg-radar/40 px-1.5 py-0.5 text-text-mana">DRIVE</span>
              ) : (
                <span className="rounded px-1.5 py-0.5 text-text-mana/40">NO DRIVE</span>
              )}
            </div>

            {/* Footer with pipeline stage and contract value */}
            <div className="mt-1 flex items-center justify-between font-mono text-[0.62rem] text-text-mana">
              <span className="max-w-[110px] truncate text-text-mana/70">
                <i className="fa-solid fa-flag mr-1 text-[0.55rem] text-alert-orange"></i>
                {unit.pipelineStage}
              </span>
              <span className="font-bold text-gold">{currencyFormatter.format(unit.contractValue)}</span>
            </div>
            {unit.activePebble && (
              <div className="mt-1 truncate border-t border-accent-teal/30 pt-1 font-mono text-[0.56rem] text-alert-orange/85" title={unit.activePebble}>
                PEBBLE: {unit.activePebble}
              </div>
            )}
          </div>
        );
      })}

      {/* Floating Center Reticle */}
      <div className="absolute bottom-2 left-1/2 z-15 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-accent-teal bg-bg-obsidian/90 px-4 py-1 backdrop-blur-md shadow-md pointer-events-none">
        <div className="h-1.5 w-1.5 rounded-full bg-alert-orange animate-pulse-glow" />
        <div className="flex items-center gap-2 font-display text-[0.65rem] tracking-wider text-text-mana">
          <span>
            {selectedUnitIds.length > 1
              ? `${selectedUnitIds.length} CLIENTS SELECTED`
              : 'CLIENT SELECTED'}
          </span>
          <span className="hidden text-alert-orange sm:inline">
            // CRM BOARD ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};
