import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Terminal, AlertTriangle, Users } from 'lucide-react';
import { AlfredAlert, ClientRecord } from '../../types';

interface MultiAgentDispatchProps {
  activeDepartment?: string;
  onSelectDepartment?: (agent: string) => void;
  alerts?: AlfredAlert[];
  clients?: ClientRecord[];
  onCommandSubmit?: (cmd: string) => void;
}

export const MultiAgentDispatch: React.FC<MultiAgentDispatchProps> = ({
  activeDepartment = 'Alfred',
  onSelectDepartment,
  alerts = [],
  clients = [],
  onCommandSubmit,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [commandInput, setCommandInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const agents = ['Alfred', 'Pamela', 'Oracle', 'Dolores', 'Vala', 'Daisy'];

  return (
    <>
      {/* 52px Permanent Left Rail (Never Shifts the Grid) */}
      <aside className="w-[52px] h-full border-r border-[#086375] bg-[#020500] z-40 flex flex-col items-center py-3 select-none shrink-0 justify-between">
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
            className="fixed inset-0 top-[56px] bg-black/60 backdrop-blur-[2px] z-45 transition-opacity"
            aria-hidden="true"
          />

          <div
            className="fixed top-[56px] bottom-0 left-[52px] w-[320px] bg-[#020500]/95 border-r border-[#086375] backdrop-blur-md shadow-[12px_0_36px_rgba(0,0,0,0.9)] z-50 flex flex-col p-4 animate-in fade-in slide-in-from-left-2 duration-150"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#086375]/60 pb-2 mb-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[#FE5F00] font-bold">
                Multi-Agent Dispatch
              </span>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="text-xs text-[#DDFBD0]/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Center Body */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 font-mono text-xs text-[#DDFBD0] custom-scrollbar">
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
                  className="w-full bg-[#020500] border border-[#086375] rounded px-2.5 py-1 text-xs text-[#DDFBD0] placeholder-[#DDFBD0]/30 focus:outline-none focus:border-[#FE5F00]"
                />
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
                      <div key={i} className="p-2 border border-[#FE5F00]/40 bg-[#FE5F00]/5 rounded text-[11px]">
                        <div className="text-[#FE5F00] font-bold">{alert.companyName || 'System Alert'}</div>
                        <div className="text-[#DDFBD0]/70 text-[10px] mt-0.5">{alert.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
                  className="px-2.5 bg-[#086375] text-[#DDFBD0] rounded hover:bg-[#FE5F00] transition-colors text-xs font-mono font-bold"
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
