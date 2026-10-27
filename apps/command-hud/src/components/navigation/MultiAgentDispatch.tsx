import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Terminal, AlertTriangle, Package, GripVertical } from 'lucide-react';
import { AlfredAlert, ClientRecord, ServiceComponent } from '../../types';
import { SERVICE_REGISTRY } from '../../data/serviceRegistry';

interface MultiAgentDispatchProps {
  activeDepartment?: string;
  onSelectDepartment?: (agent: string) => void;
  alerts?: AlfredAlert[];
  clients?: ClientRecord[];
  onCommandSubmit?: (cmd: string) => void;
  selectedClient?: ClientRecord | null;
  onSelectClient?: (clientId: string) => void;
  onTriggerWorkbench?: (client: ClientRecord) => void;
}

/** Maps each ECS service to its owning AI Sub-Routine department */
const SERVICE_DEPARTMENT_MAP: Record<string, { department: string; label: string; icon: string; color: string }> = {
  comp_oracle_deepscan: { department: 'Oracle', label: 'Intelligence', icon: '🔮', color: '#3C91E6' },
  comp_iron_gate_legal: { department: 'Pamela', label: 'Legal / Admin', icon: '⚖️', color: '#FE5F00' },
  comp_mcc_engine:      { department: 'Daisy', label: 'Audience Growth', icon: '📡', color: '#E0CA3C' },
  comp_dns_shield:      { department: 'Daisy', label: 'Infrastructure', icon: '🛡️', color: '#E0CA3C' },
  comp_gantt_symphony:  { department: 'Dolores', label: 'Delivery', icon: '🎼', color: '#5F0F40' },
};

/** Group services by department for the accordion */
interface DepartmentSection {
  department: string;
  label: string;
  icon: string;
  color: string;
  services: ServiceComponent[];
}

function buildDepartmentSections(): DepartmentSection[] {
  const map = new Map<string, DepartmentSection>();

  for (const service of SERVICE_REGISTRY) {
    const meta = SERVICE_DEPARTMENT_MAP[service.id] || {
      department: 'Alfred',
      label: 'General',
      icon: '🤖',
      color: '#086375',
    };

    if (!map.has(meta.department)) {
      map.set(meta.department, {
        department: meta.department,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        services: [],
      });
    }
    map.get(meta.department)!.services.push(service);
  }

  return Array.from(map.values());
}

const DEPARTMENT_SECTIONS = buildDepartmentSections();

export const MultiAgentDispatch: React.FC<MultiAgentDispatchProps> = ({
  activeDepartment = 'Alfred',
  onSelectDepartment,
  alerts = [],
  clients = [],
  onCommandSubmit,
  selectedClient = null,
  onSelectClient,
  onTriggerWorkbench,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [commandInput, setCommandInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Oracle']));
  const [drawerTab, setDrawerTab] = useState<'feed' | 'services'>('feed');

  const agents = ['Alfred', 'Pamela', 'Oracle', 'Dolores', 'Vala', 'Daisy'];

  const toggleSection = useCallback((dept: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) {
        next.delete(dept);
      } else {
        next.add(dept);
      }
      return next;
    });
  }, []);

  /**
   * MODULE 1: AUTO-SWITCH VIEW TO CLIENT SOLAR WORKBENCH ON DRAG INITIATION
   */
  const handleServiceDragStart = (e: React.DragEvent, service: ServiceComponent) => {
    const target = selectedClient || clients[0];
    if (!target) {
      console.warn('⚠️ HUD ALERT: Select an active client before deploying modular service components.');
      return;
    }

    // Pack ECS metadata into the drag stream
    const payload = {
      serviceId: service.id,
      name: service.name,
      price: service.price,
      tasksToInject: service.tasksToInject || [],
      targetClientId: target.ClientID,
    };

    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('serviceId', service.id);
    e.dataTransfer.setData('serviceName', service.name);
    e.dataTransfer.effectAllowed = 'copyMove';

    // Create a lightweight drag image
    const ghost = document.createElement('div');
    ghost.textContent = `✦ ${service.name} (+$${service.price})`;
    ghost.style.cssText =
      'position:absolute;top:-9999px;left:-9999px;padding:6px 12px;border-radius:8px;background:#020500;border:1px solid #E0CA3C;color:#E0CA3C;font-size:11px;font-family:monospace;white-space:nowrap;box-shadow:0 0 12px rgba(224,202,60,0.4);';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(ghost));

    // Instantly transition view to the selected client's solar system workbench
    if (onTriggerWorkbench) {
      onTriggerWorkbench(target);
    }
  };

  return (
    <>
      {/* 52px Permanent Left Rail — overflow-visible so drawer can escape the grid column */}
      <aside className="w-[52px] h-full border-r border-[#086375] bg-[#020500] z-[100] flex flex-col items-center py-3 select-none shrink-0 justify-between overflow-visible min-w-[52px]">
        <div className="flex flex-col items-center space-y-3 w-full">
          {/* Header Toggle Icon */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 rounded border border-[#086375]/70 flex items-center justify-center text-[#DDFBD0] hover:border-[#E0CA3C] hover:text-[#E0CA3C] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Dispatch Drawer (Ctrl+B)' : 'Collapse Rail (Ctrl+B)'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Subroutine Buttons [A] [P] [O] [D] [V] [D] */}
          {agents.map((agent) => (
            <button
              key={agent}
              type="button"
              onClick={() => {
                onSelectDepartment?.(agent);
                setIsCollapsed(false); // Open drawer on agent click
              }}
              className={`w-8 h-8 rounded border flex items-center justify-center text-xs font-mono font-bold transition-all cursor-pointer ${
                activeDepartment === agent
                  ? 'border-[#FE5F00] text-[#FE5F00] bg-[#5F0F40]/40 shadow-[0_0_10px_rgba(254,95,0,0.4)]'
                  : 'border-[#086375] text-[#DDFBD0]/70 hover:border-[#E0CA3C] hover:text-[#E0CA3C]'
              }`}
              title={agent}
            >
              {agent[0]}
            </button>
          ))}
        </div>

        {/* Bottom Intercom Shortcut Icon */}
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="text-[#FE5F00] hover:text-[#E0CA3C] p-2 cursor-pointer transition-colors"
          title="Open Universal Intercom Drawer"
        >
          <Terminal size={18} />
        </button>
      </aside>

      {/* Floating 320px Auto-Closing Drawer Overlay */}
      {!isCollapsed && (
        <>
          {/* Outside Backdrop Click Dismiss */}
          <div
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 top-0 bg-black/60 backdrop-blur-[2px] z-[110] transition-opacity"
            aria-hidden="true"
          />

          <div
            className="fixed top-[56px] bottom-0 left-[52px] w-[320px] bg-[#020500]/95 border-r border-[#086375] backdrop-blur-md shadow-[12px_0_36px_rgba(0,0,0,0.9)] z-[120] flex flex-col p-4 animate-in fade-in slide-in-from-left-2 duration-150"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#086375]/60 pb-2 mb-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[#FE5F00] font-bold">
                Multi-Agent Dispatch
              </span>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="text-xs text-[#DDFBD0]/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Active Client Target Banner */}
            {selectedClient && (
              <div className="mb-2 p-1.5 rounded bg-[#086375]/20 border border-[#086375] flex items-center justify-between font-mono text-[10px]">
                <span className="text-[#086375] uppercase">Target Client:</span>
                <span className="text-[#E0CA3C] font-bold truncate max-w-[150px]">
                  {selectedClient.Company_Name}
                </span>
              </div>
            )}

            {/* ── Tab Switcher: Feed ↔ Services ────────────────────── */}
            <div className="flex gap-1 mb-3 border-b border-[#086375]/30 pb-2">
              <button
                type="button"
                onClick={() => setDrawerTab('feed')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-[0.65rem] font-mono font-bold transition-colors cursor-pointer ${
                  drawerTab === 'feed'
                    ? 'bg-[#086375]/30 text-[#DDFBD0] border-b-2 border-[#FE5F00]'
                    : 'text-[#DDFBD0]/50 hover:text-[#DDFBD0]'
                }`}
              >
                <AlertTriangle size={11} />
                FEED
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('services')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-[0.65rem] font-mono font-bold transition-colors cursor-pointer ${
                  drawerTab === 'services'
                    ? 'bg-[#086375]/30 text-[#DDFBD0] border-b-2 border-[#E0CA3C]'
                    : 'text-[#DDFBD0]/50 hover:text-[#DDFBD0]'
                }`}
              >
                <Package size={11} />
                ECS NODES
              </button>
            </div>

            {/* ── TAB BODY ─────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-3 font-mono text-xs text-[#DDFBD0] custom-scrollbar">

              {/* ════════════════════ FEED TAB ════════════════════ */}
              {drawerTab === 'feed' && (
                <div className="space-y-3.5">
                  {/* Client Jumper */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#086375] block mb-1">
                      Client Jumper
                    </label>
                    <input
                      type="text"
                      placeholder="Find client ID or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full box-border bg-[#020500] border border-[#086375] rounded px-2.5 py-1 text-xs text-[#DDFBD0] placeholder-[#DDFBD0]/30 focus:outline-none focus:border-[#FE5F00]"
                    />
                    {searchQuery.trim() && (
                      <div className="mt-1 space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {clients
                          .filter((c) =>
                            c.Company_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.ClientID.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((c) => (
                            <button
                              key={c.ClientID}
                              type="button"
                              onClick={() => {
                                onSelectClient?.(c.ClientID);
                                onTriggerWorkbench?.(c);
                                setSearchQuery('');
                              }}
                              className="w-full text-left p-1.5 rounded bg-[#086375]/20 hover:bg-[#086375]/50 flex justify-between text-[11px] cursor-pointer"
                            >
                              <span className="truncate">{c.Company_Name}</span>
                              <span className="text-[#E0CA3C] text-[9px]">{c.AccountPhase}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Priority Alerts Stream */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase text-[#086375] font-bold">
                        Alfred Priority Feed ({alerts.length})
                      </span>
                      <AlertTriangle size={12} className="text-[#FE5F00]" />
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="p-3 border border-dashed border-[#086375]/30 rounded text-center text-[0.65rem] text-[#DDFBD0]/40">
                          The House is in order. Zero priority alerts.
                        </div>
                      ) : (
                        alerts.map((alert, i) => (
                          <div key={i} className="p-2 border border-[#FE5F00]/40 bg-[#FE5F00]/5 rounded text-[11px] w-full box-border">
                            <div className="text-[#FE5F00] font-bold">{alert.companyName || 'System Alert'}</div>
                            <div className="text-[#DDFBD0]/70 text-[10px] mt-0.5">{alert.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ════════════════════ ECS SERVICES TAB ════════════════════ */}
              {drawerTab === 'services' && (
                <div className="space-y-2">
                  {/* Registry Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-[#E0CA3C] font-bold">
                        Service Node Registry
                      </span>
                    </div>
                    <span className="text-[0.55rem] px-1.5 py-0.5 rounded bg-[#086375]/30 text-[#DDFBD0]/60">
                      DRAG → WORKBENCH
                    </span>
                  </div>

                  {/* ── Department Accordion ──────────────────────── */}
                  {DEPARTMENT_SECTIONS.map((section) => {
                    const isExpanded = expandedSections.has(section.department);
                    return (
                      <div
                        key={section.department}
                        className="rounded-lg border border-[#086375]/40 overflow-hidden"
                      >
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() => toggleSection(section.department)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer hover:bg-[#086375]/10"
                          style={{ borderLeft: `3px solid ${section.color}` }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{section.icon}</span>
                            <div>
                              <span className="font-bold text-[0.68rem] text-white block">
                                {section.department}
                              </span>
                              <span className="text-[0.55rem] text-[#DDFBD0]/50">
                                {section.label} · {section.services.length} node{section.services.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            size={13}
                            className={`text-[#DDFBD0]/40 transition-transform duration-200 ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </button>

                        {/* Accordion Body: Draggable Service Nodes */}
                        {isExpanded && (
                          <div className="px-2 pb-2 space-y-1.5 border-t border-[#086375]/20 pt-1.5">
                            {section.services.map((service) => (
                              <div
                                key={service.id}
                                draggable="true"
                                onDragStart={(e) => handleServiceDragStart(e, service)}
                                className="group flex items-center gap-2 p-2 rounded-lg border border-[#086375]/50 bg-[#0d1513]/70 cursor-grab hover:ring-2 hover:ring-[#E0CA3C] hover:border-[#E0CA3C]/60 hover:bg-[#E0CA3C]/5 transition-all active:cursor-grabbing active:ring-[#FE5F00] active:scale-[0.97] w-full box-border"
                                style={{
                                  userSelect: 'auto',
                                  WebkitUserDrag: 'element',
                                }}
                                title={`Drag "${service.name}" onto the Solar Workbench to snap it to orbit`}
                              >
                                {/* Grip Handle */}
                                <GripVertical
                                  size={14}
                                  className="text-[#086375] group-hover:text-[#E0CA3C] shrink-0 transition-colors"
                                />

                                {/* Service Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-[0.66rem] text-white truncate">
                                      {service.name}
                                    </span>
                                    <span
                                      className="text-[0.58rem] font-bold shrink-0"
                                      style={{ color: section.color }}
                                    >
                                      +${service.price.toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-[0.54rem] text-[#DDFBD0]/50 truncate mt-0.5">
                                    {service.description}
                                  </p>
                                </div>

                                {/* Category Badge */}
                                <span
                                  className="text-[0.48rem] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider"
                                  style={{
                                    backgroundColor: `${section.color}20`,
                                    color: section.color,
                                    border: `1px solid ${section.color}40`,
                                  }}
                                >
                                  {service.category}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Drop Zone Hint */}
                  <div className="mt-3 p-2.5 border border-dashed border-[#E0CA3C]/30 rounded-lg text-center">
                    <p className="text-[0.58rem] text-[#E0CA3C]/60">
                      Drag a Service Node from above and drop it onto a client's
                      <span className="text-[#E0CA3C] font-bold"> Solar System Workbench </span>
                      to attach the ECS component.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Universal Intercom (Pinned Bottom Prompt) */}
            <div className="pt-2 border-t border-[#086375] bg-[#020500] shrink-0 mt-2">
              <label className="text-[9px] font-mono uppercase text-[#086375] block mb-1">
                Universal Intercom
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!commandInput.trim()) return;
                  onCommandSubmit?.(commandInput);
                  setCommandInput('');
                }}
                className="flex gap-1"
              >
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="> @agent command..."
                  className="flex-1 bg-[#020500] border border-[#086375] rounded px-2 py-1 text-xs text-[#DDFBD0] font-mono focus:outline-none focus:border-[#E0CA3C]"
                />
                <button
                  type="submit"
                  className="px-2.5 bg-[#086375] text-[#DDFBD0] rounded hover:bg-[#FE5F00] transition-colors text-xs font-mono font-bold cursor-pointer"
                >
                  ↵
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
};
