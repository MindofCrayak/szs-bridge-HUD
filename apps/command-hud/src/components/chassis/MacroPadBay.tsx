import React from 'react';
import { COMMAND_ABILITIES } from '../../data/initialFleet';
import { CommandKey } from '../../types';

interface MacroPadBayProps {
  onTriggerCommand: (key: CommandKey) => void;
}

export const MacroPadBay: React.FC<MacroPadBayProps> = ({ onTriggerCommand }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden text-xs font-mono">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between border-b border-[#086375]/40 pb-1.5 shrink-0 px-1">
        <h2 className="font-display text-sm font-bold text-[#DDFBD0]">Macro Pad</h2>
        <span className="text-[0.6rem] text-[#DDFBD0]/60">KEYS Q–C</span>
      </div>

      {/* 3x3 Tactile Grid */}
      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-1.5 p-0.5">
        {COMMAND_ABILITIES.map((command) => (
          <button
            key={command.key}
            onClick={() => onTriggerCommand(command.key)}
            disabled={command.disabled}
            className="group relative flex min-h-0 flex-col items-center justify-center rounded-lg border border-[#086375] bg-gradient-to-br from-[#284638] via-[#10251b] to-[#020500] p-1 text-center text-[#DDFBD0] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_3px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.7)] transition-all hover:border-[#E0CA3C] hover:shadow-[0_0_10px_rgba(224,202,60,0.35)] active:border-[#FE5F00] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            title={`${command.action} (${command.description}) — [${command.key}]`}
          >
            <span className="absolute right-1 top-0.5 rounded-xs border border-[#086375] bg-[#020500]/90 px-1 font-mono text-[0.55rem] font-bold text-[#E0CA3C]">
              {command.key}
            </span>
            <i className={`${command.key === 'C' ? 'fa-solid fa-shield-halved' : command.icon} mb-0.5 text-sm text-[#FE5F00] group-hover:text-[#DDFBD0]`} />
            <span className="font-accent text-[0.68rem] leading-tight truncate max-w-[70px]">
              {command.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
