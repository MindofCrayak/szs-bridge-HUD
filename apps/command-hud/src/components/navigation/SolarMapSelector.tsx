import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Orbit } from 'lucide-react';

interface SolarMapSelectorProps {
  clients: any[];
  activeClientId: string | null;
  onSelectClient: (client: any) => void;
}

export const SolarMapSelector: React.FC<SolarMapSelectorProps> = ({
  clients = [],
  activeClientId,
  onSelectClient,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const activeClient = clients.find((c) => (c.ClientID || c.id) === activeClientId);

  return (
    <div className="relative pointer-events-auto" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1 rounded border border-[#086375] bg-[#020500]/90 text-xs font-mono text-[#DDFBD0] hover:border-[#E0CA3C] hover:text-[#E0CA3C] transition-all cursor-pointer shadow-sm"
        title="Solar Map Client Navigation (Ctrl + 1..9)"
      >
        <Orbit size={13} className="text-[#FE5F00] animate-spin-slow" />
        <span className="font-bold tracking-wider">SOLAR MAP</span>
        {activeClient && (
          <span className="text-[#E0CA3C] font-semibold truncate max-w-[90px] hidden md:inline">
            // {activeClient.Company_Name || activeClient.name}
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 max-h-80 overflow-y-auto bg-[#020500]/98 border border-[#086375] rounded-lg shadow-2xl p-1 z-50 font-mono text-xs custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-[#086375] border-b border-[#086375]/30 flex justify-between">
            <span>Active Client Engagements</span>
            <span className="text-[#E0CA3C]">Ctrl + 1..9</span>
          </div>
          {clients.length === 0 ? (
            <div className="p-3 text-center text-[#DDFBD0]/40 text-[10px]">
              No clients loaded
            </div>
          ) : (
            clients.map((client, idx) => {
              const hotkeyNum = idx < 9 ? idx + 1 : null;
              const isCurrent = (client.ClientID || client.id) === activeClientId;

              return (
                <button
                  key={client.ClientID || client.id || idx}
                  type="button"
                  onClick={() => {
                    onSelectClient(client);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all text-left cursor-pointer ${
                    isCurrent
                      ? 'bg-[#086375]/40 text-[#E0CA3C] font-bold border-l-2 border-[#E0CA3C]'
                      : 'hover:bg-[#086375]/20 text-[#DDFBD0]/80 hover:text-white'
                  }`}
                >
                  <div className="truncate flex-1 mr-2">
                    <span className="truncate block font-bold text-[11px]">
                      {client.Company_Name || client.name}
                    </span>
                    <span className="text-[9px] text-[#086375] block">
                      {client.AccountPhase || client.pipelineStage || '01: Intake'}
                    </span>
                  </div>
                  {hotkeyNum && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-[#086375]/40 text-[#DDFBD0]/60 shrink-0 font-bold border border-[#086375]/60">
                      ^{hotkeyNum}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
