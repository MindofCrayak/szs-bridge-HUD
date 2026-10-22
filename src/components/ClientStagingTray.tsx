import React from 'react';
import { CLIENT_TEMPLATES } from '../data/initialFleet';

interface ClientStagingTrayProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSpawnUnit: (templateKey: string) => void;
}

export const ClientStagingTray: React.FC<ClientStagingTrayProps> = ({
  isCollapsed,
  onToggleCollapse,
  onSpawnUnit,
}) => {
  const templateKeys = Object.keys(CLIENT_TEMPLATES);

  return (
    <aside
      className={`absolute bottom-5 left-0 top-7 z-30 flex w-[210px] flex-col rounded-r-2xl border border-l-0 border-accent-teal bg-bg-obsidian/95 shadow-xl backdrop-blur-md transition-transform duration-300 ${
        isCollapsed ? '-translate-x-[200px]' : 'translate-x-0'
      }`}
    >
      <button
        onClick={onToggleCollapse}
        title={isCollapsed ? 'Expand client templates' : 'Collapse client templates'}
        className="absolute -right-7 top-1/2 flex h-16 w-7 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-accent-teal bg-primary-plum text-alert-orange hover:text-text-mana"
      >
        <i className={`fa-solid fa-chevron-left transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className="flex items-center justify-between border-b border-accent-teal/50 bg-primary-plum/50 p-2.5">
        <span className="flex items-center gap-1.5 font-display text-xs font-bold text-text-mana">
          <i className="fa-solid fa-user-plus text-alert-orange" />
          CLIENT TEMPLATES
        </span>
        <span className="rounded border border-accent-teal px-1.5 py-0.5 font-mono text-[0.62rem] text-text-mana/70">
          {templateKeys.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2.5">
        {templateKeys.map((key) => {
          const template = CLIENT_TEMPLATES[key];
          return (
            <button
              key={key}
              onClick={() => onSpawnUnit(key)}
              title={`Add ${template.name}`}
              className="group flex items-center gap-2 rounded-lg border border-accent-teal/70 bg-primary-plum/30 p-2 text-left transition-colors hover:border-alert-orange hover:bg-primary-plum"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-obsidian font-display text-xs font-bold text-alert-orange">
                {template.avatar}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-xs font-semibold text-text-mana group-hover:text-alert-orange">
                  {template.name}
                </span>
                <span className="block truncate text-[0.65rem] text-text-mana/65">{template.serviceArea}</span>
              </span>
              <i className="fa-solid fa-plus text-xs text-alert-orange" />
            </button>
          );
        })}
      </div>

      <div className="border-t border-accent-teal/40 p-2 text-center font-mono text-[0.62rem] text-text-mana/60">
        ADD A CLIENT TO INTAKE
      </div>
    </aside>
  );
};
