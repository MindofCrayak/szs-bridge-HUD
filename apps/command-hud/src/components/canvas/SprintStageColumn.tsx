import React from 'react';
import { SprintStageColumnConfig } from '../../data/pipeline';
import { ProjectRecord } from '../../types';
import { ProjectSprintCard } from './ProjectSprintCard';

interface SprintStageColumnProps {
  config: SprintStageColumnConfig;
  projects: ProjectRecord[];
  companyName: string;
  onContextMenu: (e: React.MouseEvent, project: ProjectRecord) => void;
}

export const SprintStageColumn: React.FC<SprintStageColumnProps> = ({
  config,
  projects,
  companyName,
  onContextMenu,
}) => {
  return (
    <div className="w-[260px] shrink-0 flex flex-col rounded-xl border border-[#086375]/60 bg-[#020500]/70 backdrop-blur-sm overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="p-2.5 border-b border-[#086375]/50 bg-gradient-to-r from-[#0d1f18] to-[#05130e] flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="font-display font-bold text-[0.68rem] tracking-wider text-[#DDFBD0] truncate" title={config.title}>
            {config.title}
          </span>
          <span className="font-mono text-[0.55rem] px-1 py-0.2 rounded bg-[#5F0F40]/50 border border-[#086375] text-[#E0CA3C] font-bold">
            {config.badge}
          </span>
        </div>
        <span className="font-mono text-xs font-bold text-[#E0CA3C]">
          {projects.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex-1 min-h-[400px] max-h-[calc(100vh-360px)] overflow-y-auto p-2 space-y-2 canvas-pannable-bg">
        {projects.length === 0 ? (
          <div className="h-24 flex items-center justify-center font-mono text-[0.6rem] text-[#086375]/50 border border-dashed border-[#086375]/30 rounded-lg">
            Empty
          </div>
        ) : (
          projects.map((project) => (
            <ProjectSprintCard
              key={project.ProjectID}
              project={project}
              companyName={companyName}
              onContextMenu={onContextMenu}
            />
          ))
        )}
      </div>
    </div>
  );
};
