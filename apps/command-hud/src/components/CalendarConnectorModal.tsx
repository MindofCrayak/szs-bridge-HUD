import React, { useState } from 'react';

export interface CalendarSource {
  id: string;
  name: string;
  emailOrId: string;
  color: string;
  enabled: boolean;
  isPrimary?: boolean;
}

export interface CalendarMeetingEvent {
  id: string;
  title: string;
  time: string;
  sourceId: string;
  clientName?: string;
  meetUrl?: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
}

interface CalendarConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: CalendarSource[];
  onToggleSource: (id: string) => void;
  onAddSource?: (source: CalendarSource) => void;
  onLogTerminal: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

export const CalendarConnectorModal: React.FC<CalendarConnectorModalProps> = ({
  isOpen,
  onClose,
  sources,
  onToggleSource,
  onAddSource,
  onLogTerminal,
}) => {
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarId, setNewCalendarId] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalendarName.trim() || !newCalendarId.trim()) return;

    const newSource: CalendarSource = {
      id: `cal-${Date.now()}`,
      name: newCalendarName.trim(),
      emailOrId: newCalendarId.trim(),
      color: '#E0CA3C',
      enabled: true,
    };

    onAddSource?.(newSource);
    onLogTerminal(`Google Calendar "${newSource.name}" (${newSource.emailOrId}) linked to Calendar Bay.`, 'action');
    setNewCalendarName('');
    setNewCalendarId('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-obsidian/85 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-connector-title"
    >
      <div className="relative flex flex-col w-full max-w-lg rounded-xl border border-accent-teal bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] shadow-2xl overflow-hidden text-text-mana">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-accent-teal/60 bg-primary-plum/30 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent-teal bg-primary-plum text-highlight-gold">
              <i className="fa-solid fa-calendar-days text-sm" />
            </div>
            <div>
              <h2 id="calendar-connector-title" className="font-display text-sm font-bold text-text-mana">
                Google Calendar Layer Connector
              </h2>
              <p className="font-mono text-[0.65rem] text-text-mana/70">
                Configure visible calendar feeds &amp; sync intervals for the Calendar Bay
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded border border-accent-teal/40 text-text-mana/70 hover:border-alert-orange hover:text-alert-orange"
          >
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        </div>

        {/* Sources Checklist */}
        <div className="p-6 space-y-4 font-mono text-xs">
          <div>
            <span className="font-mono text-[0.68rem] uppercase tracking-wider text-text-mana/60 block mb-2">
              Active Google Calendars ({sources.filter((s) => s.enabled).length} Enabled)
            </span>
            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  onClick={() => onToggleSource(source.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    source.enabled
                      ? 'border-accent-teal bg-primary-plum/40 text-text-mana'
                      : 'border-accent-teal/30 bg-bg-obsidian/40 text-text-mana/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={source.enabled}
                      onChange={() => onToggleSource(source.id)}
                      className="h-4 w-4 rounded border-accent-teal text-highlight-gold focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full inline-block"
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="font-bold text-xs">{source.name}</span>
                        {source.isPrimary && (
                          <span className="px-1.5 py-0.2 rounded bg-highlight-gold/20 text-highlight-gold text-[0.55rem] font-bold">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <span className="text-[0.62rem] text-text-mana/60 block mt-0.5">
                        {source.emailOrId}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[0.65rem] font-bold ${source.enabled ? 'text-highlight-gold' : 'text-text-mana/30'}`}>
                    {source.enabled ? 'SYNCED' : 'MUTED'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Add custom feed */}
          <form onSubmit={handleAdd} className="border-t border-accent-teal/30 pt-4 space-y-3">
            <span className="font-mono text-[0.68rem] uppercase tracking-wider text-text-mana/60 block">
              Link Additional Calendar ID or Resource
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Calendar Label (e.g. Sales)"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                className="rounded border border-accent-teal bg-bg-obsidian px-2.5 py-1.5 text-xs text-text-mana focus:border-highlight-gold focus:outline-none"
              />
              <input
                type="text"
                placeholder="Google ID / Email"
                value={newCalendarId}
                onChange={(e) => setNewCalendarId(e.target.value)}
                className="rounded border border-accent-teal bg-bg-obsidian px-2.5 py-1.5 text-xs text-text-mana focus:border-highlight-gold focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!newCalendarName.trim() || !newCalendarId.trim()}
              className="w-full py-1.5 rounded border border-accent-teal bg-primary-plum/30 text-xs font-display font-semibold text-text-mana hover:bg-accent-teal/20 disabled:opacity-40"
            >
              <i className="fa-solid fa-plus mr-1" />
              Add Calendar Feed
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-accent-teal/60 bg-primary-plum/30 px-6 py-3">
          <span className="font-mono text-[0.62rem] text-text-mana/50">
            OAuth Calendar Scope: https://www.googleapis.com/auth/calendar
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-highlight-gold bg-highlight-gold px-4 py-1.5 font-display text-xs font-bold text-bg-obsidian hover:bg-highlight-gold/90"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
