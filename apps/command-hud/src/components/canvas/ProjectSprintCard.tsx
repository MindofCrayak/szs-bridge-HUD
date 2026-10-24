import React from 'react';
import { ProjectRecord } from '../../types';

interface ProjectSprintCardProps {
  project: ProjectRecord;
  companyName: string;
  onAdvanceStage?: (project: ProjectRecord) => void;
  onContextMenu: (e: React.MouseEvent, project: ProjectRecord) => void;
}

export const ProjectSprintCard: React.FC<ProjectSprintCardProps> = ({
  project,
  companyName,
  onContextMenu,
}) => {
  const percent = project.MilestonesTotal > 0 
    ? Math.round((project.MilestonesDone / project.MilestonesTotal) * 100) 
    : 0;

  return (
    <div
      onContextMenu={(e) => onContextMenu(e, project)}
      className="w-full rounded-lg border border-[#086375]/70 bg-gradient-to-br from-[#0d1f18] via-[#05130e] to-[#020500] p-2.5 font-mono text-xs select-none hover:border-[#E0CA3C] hover:shadow-[0_0_12px_rgba(224,202,60,0.2)] transition-all"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-[#E0CA3C] text-[0.65rem] truncate max-w-[130px]" title={project.ProjectID}>
          {project.ProjectID}
        </span>
        <span className="text-[0.55rem] px-1 py-0.2 rounded bg-[#086375]/30 text-[#DDFBD0]/70 border border-[#086375]/40">
          {project.AssignedRateTier}
        </span>
      </div>

      <div className="text-[0.62rem] text-[#DDFBD0]/75 truncate mb-2">
        {project.Title || companyName}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-[0.55rem] text-[#DDFBD0]/60 mb-0.5">
          <span>Sprint Delivery</span>
          <span>{project.MilestonesDone}/{project.MilestonesTotal} ({percent}%)</span>
        </div>
        <div className="h-1 w-full bg-[#086375]/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#086375] to-[#E0CA3C]" 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
