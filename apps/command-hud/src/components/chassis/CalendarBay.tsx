import React from 'react';
import { CalendarMeetingEvent, CalendarSource } from '../CalendarConnectorModal';

interface CalendarBayProps {
  sources?: CalendarSource[];
  meetings?: CalendarMeetingEvent[];
  onOpenFeedConfig?: () => void;
}

export const CalendarBay: React.FC<CalendarBayProps> = ({
  sources = [],
  meetings = [],
  onOpenFeedConfig,
}) => {
  const activeSources = sources.filter((s) => s.enabled);

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs font-mono">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between border-b border-[#086375]/40 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <h2 className="font-display text-sm font-bold text-[#DDFBD0]">CalendarBay</h2>
          <span className="text-[0.62rem] text-[#DDFBD0]/60">
            ({activeSources.length} feeds)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenFeedConfig && (
            <button
              type="button"
              onClick={onOpenFeedConfig}
              className="flex items-center gap-1 rounded border border-[#086375]/60 bg-[#5F0F40]/40 px-2 py-0.5 text-[0.6rem] text-[#E0CA3C] hover:border-[#E0CA3C] transition-colors cursor-pointer"
              title="Google Calendar Source Connector (Configure Feeds)"
            >
              <i className="fa-solid fa-gear text-[0.55rem]" />
              <span>FEEDS</span>
            </button>
          )}
          <span className="text-[0.65rem] text-[#E0CA3C] font-bold">
            {activeSources.length > 0 ? 'SYNCED' : 'MUTED'}
          </span>
        </div>
      </div>

      {/* Feed List (Clean, NO Schedule New Meet button) */}
      <div className="flex min-h-0 flex-1 flex-col space-y-1.5 overflow-y-auto pr-1">
        {meetings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-[#DDFBD0]/50">
            <i className="fa-regular fa-calendar-check text-xl mb-1 text-[#086375]" />
            <p className="text-[0.65rem]">No pending meetings scheduled today</p>
          </div>
        ) : (
          meetings.map((evt) => {
            const source = sources.find((s) => s.id === evt.sourceId);
            return (
              <div
                key={evt.id}
                className="rounded border border-[#086375]/40 bg-[#020500]/75 p-2 font-mono text-xs transition-colors hover:border-[#E0CA3C]/60"
              >
                <div className="flex items-center justify-between text-[0.6rem]">
                  <span className="text-[#E0CA3C] font-bold">{evt.time}</span>
                  <span
                    className="rounded px-1.5 py-0.2 text-[0.55rem] font-bold"
                    style={{
                      backgroundColor: `${source?.color || '#086375'}25`,
                      color: source?.color || '#ddfbd0',
                      border: `1px solid ${source?.color || '#086375'}60`,
                    }}
                  >
                    {source?.name || 'Feed'}
                  </span>
                </div>
                <div className="font-display text-[0.72rem] font-bold text-[#DDFBD0] mt-1 truncate">
                  {evt.title}
                </div>
                <div className="flex items-center justify-between mt-1 text-[0.62rem] text-[#DDFBD0]/60">
                  <span>{evt.clientName}</span>
                  {evt.meetUrl && (
                    <a
                      href={evt.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#086375] hover:text-[#E0CA3C] underline"
                    >
                      Join Meet
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-1.5 text-[0.58rem] text-[#DDFBD0]/40 text-center border-t border-[#086375]/30 shrink-0">
        Google Workspace Feed // Read-Only Timeline
      </div>
    </div>
  );
};
