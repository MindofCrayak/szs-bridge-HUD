import React from 'react';
import { ClientUnit } from '../types';
import { getPipelineColumnIndex, normalizePipelineStage, PIPELINE_COLUMNS } from '../data/pipeline';

interface PipelineOverviewProps {
  units: ClientUnit[];
  onSelectUnit: (id: string) => void;
  onNavigateToDashboard: () => void;
  onLogTerminal: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

export const PipelineOverview: React.FC<PipelineOverviewProps> = ({
  units,
  onSelectUnit,
  onNavigateToDashboard,
  onLogTerminal,
}) => {
  const activeUnits = units.filter((unit) => normalizePipelineStage(String(unit?.AccountPhase ?? unit?.pipelineStage ?? '')) !== '09: Sunset / Retainer');
  return (
  <main className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden bg-bg-obsidian p-5">
    <div className="mb-4 flex items-end justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-alert-orange">Delivery workflow</p>
        <h1 className="font-display text-2xl font-bold text-text-mana">Client Pipeline</h1>
      </div>
      <span className="font-mono text-xs text-text-mana/65">{activeUnits.length} ACTIVE CLIENTS</span>
    </div>
    <div className="grid h-[calc(100%-4rem)] min-w-[900px] grid-cols-4 gap-3">
      {PIPELINE_COLUMNS.map((column, columnIndex) => {
        const clients = activeUnits.filter((client) => getPipelineColumnIndex(String(client?.AccountPhase ?? client?.pipelineStage ?? '')) === columnIndex);
        return (
          <section key={column.id} className="flex min-h-0 flex-col rounded-xl border border-accent-teal bg-primary-plum/25">
            <div className="flex items-center justify-between border-b border-accent-teal/50 bg-primary-plum/70 px-3 py-2">
              <div>
                <h2 className="font-display text-sm font-bold text-text-mana">{column.title}</h2>
                <p className="font-mono text-[0.58rem] text-text-mana/50">{column.stages.join(' · ')}</p>
              </div>
              <span className="rounded-full bg-bg-obsidian px-2 py-0.5 font-mono text-xs text-alert-orange">{clients.length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {clients.map((client) => {
                const progress = client.totalMilestones > 0
                  ? Math.min(100, (client.completedMilestones / client.totalMilestones) * 100)
                  : 0;
                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      onSelectUnit(client.id);
                      onLogTerminal(`Client selected: ${client.name}.`, 'action');
                      onNavigateToDashboard();
                    }}
                    className="block w-full rounded-lg border border-accent-teal/60 bg-bg-obsidian/85 p-3 text-left hover:border-alert-orange"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-plum font-display text-xs text-alert-orange">{client.avatar}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-text-mana">{client.name}</span>
                        <span className="block truncate text-xs text-text-mana/60">{client.serviceArea}</span>
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-text-mana/70">
                      <span>{client.currentMilestone}</span>
                      <span>{client.completedMilestones}/{client.totalMilestones}</span>
                    </div>
                    <div className="mt-1 font-mono text-[0.62rem] text-text-mana/50">{client.pipelineStage || 'Stage not recorded'}</div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-accent-teal/30">
                      <div className="h-full bg-alert-orange" style={{ width: `${progress}%` }} />
                    </div>
                    {client.roadblock && (
                      <div className="mt-2 truncate text-xs text-alert-orange">
                        <i className="fa-solid fa-triangle-exclamation mr-1" />
                        {client.roadblock}
                      </div>
                    )}
                    <div className="mt-2 font-mono text-xs text-text-mana/65">${(client?.ContractValue ?? client?.contractValue ?? 0).toLocaleString()}</div>
                  </button>
                );
              })}
              {clients.length === 0 && <p className="p-3 text-xs text-text-mana/45">No clients in this stage.</p>}
            </div>
          </section>
        );
      })}
    </div>
  </main>
  );
};
