import React, { useState, useEffect } from 'react';

const PERSONA_NOTES = [
  { agent: 'Dolores', color: '#5F0F40', text: '3 sprints active. Clean calendar window between 14:00 and 15:30. Take a breath, Drake.' },
  { agent: 'Vala', color: '#E0CA3C', text: 'Deposit cleared for Marco. Cash velocity is up 12% this week—keep them moving!' },
  { agent: 'Pamela', color: '#DDFBD0', text: 'Soil report: 2 new leads in Intake. Both have verified domains and budget fit.' },
  { agent: 'Oracle', color: '#086375', text: 'Deep intelligence crawl completed for active case files. Zero IP vulnerabilities detected.' },
  { agent: 'Daisy', color: '#FE5F00', text: 'Audience broadcast queued: 98.4% deliverability score on Session Zero domain pool.' },
  { agent: 'Alfred', color: '#E0CA3C', text: 'All bridge systems nominal. Master Control SSOT verified and locked.' },
];

interface DepartmentHeaderTrayProps {
  activeSprintCount?: number;
  totalMrr?: number;
  activeClientName?: string;
}

export const DepartmentHeaderTray: React.FC<DepartmentHeaderTrayProps> = ({
  activeSprintCount = 3,
  totalMrr = 146200,
  activeClientName,
}) => {
  const [noteIndex, setNoteIndex] = useState(0);

  // Rotate messages every 10 minutes or when activeClientName changes
  useEffect(() => {
    if (activeClientName) {
      setNoteIndex((prev) => (prev + 1) % PERSONA_NOTES.length);
    }
  }, [activeClientName]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNoteIndex((prev) => (prev + 1) % PERSONA_NOTES.length);
    }, 600000);
    return () => clearInterval(timer);
  }, []);

  const currentNote = PERSONA_NOTES[noteIndex];

  return (
    <div className="relative h-[48px] max-h-[52px] border-b border-[#086375]/70 bg-gradient-to-r from-[#0d1f18] via-[#05130e] to-[#020500] px-4 flex items-center justify-between text-xs font-mono select-none z-15 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      {/* Dynamic Persona Radio Broadcast */}
      <div className="flex items-center gap-3 overflow-hidden">
        <div 
          className="flex items-center gap-1.5 px-2 py-0.5 rounded border text-[0.65rem] font-bold uppercase tracking-wider"
          style={{ borderColor: currentNote.color, color: currentNote.color, backgroundColor: `${currentNote.color}15` }}
        >
          <span className="h-1.5 w-1.5 rounded-full animate-ping" style={{ backgroundColor: currentNote.color }} />
          <span>{currentNote.agent} CORE</span>
        </div>
        <p className="text-[#DDFBD0]/90 truncate text-[0.72rem] font-medium italic tracking-wide">
          &ldquo;{currentNote.text}&rdquo;
        </p>
      </div>

      {/* Right Telemetry Gauges */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-[0.65rem] text-[#DDFBD0]/70">
          <span className="text-[#086375]">SPRINT LOAD:</span>
          <span className="text-[#FE5F00] font-bold">{activeSprintCount} ACTIVE</span>
        </div>
        <div className="h-3 w-px bg-[#086375]/40" />
        <div className="flex items-center gap-1.5 text-[0.65rem] text-[#DDFBD0]/70">
          <span className="text-[#086375]">PIPELINE:</span>
          <span className="text-[#E0CA3C] font-bold">${totalMrr.toLocaleString()}</span>
        </div>
        <div className="h-3 w-px bg-[#086375]/40" />
        <div className="text-[0.6rem] text-[#DDFBD0]/50 uppercase">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
};
