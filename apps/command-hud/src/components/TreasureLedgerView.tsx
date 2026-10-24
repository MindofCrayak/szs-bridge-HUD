import React, { useState } from 'react';
import { ClientUnit } from '../types';

interface TreasureLedgerViewProps {
  units: ClientUnit[];
  activeUnit: ClientUnit | null;
  onSelectUnit: (id: string) => void;
  onNavigateToDashboard: () => void;
  onLogTerminal: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const TreasureLedgerView: React.FC<TreasureLedgerViewProps> = ({
  units,
  activeUnit,
  onSelectUnit,
  onNavigateToDashboard,
  onLogTerminal,
}) => {
  const currentClient = activeUnit || units[0] || null;
  const [invoiceType, setInvoiceType] = useState<'deposit' | 'midterm' | 'completion'>('deposit');

  const totalPipelineValue = units.reduce((acc, u) => acc + (u.contractValue || 0), 0);
  const paidDeposits = units.filter((u) => u.depositPaid);
  const totalPaidDeposits = paidDeposits.reduce((acc, u) => acc + (u.contractValue * 0.5), 0);
  const pendingDeposits = units.filter((u) => !u.depositPaid);
  const totalPendingDeposits = pendingDeposits.reduce((acc, u) => acc + (u.contractValue * 0.5), 0);

  const calculateInvoiceAmount = (val: number, type: 'deposit' | 'midterm' | 'completion') => {
    if (type === 'deposit') return val * 0.5;
    if (type === 'midterm') return val * 0.25;
    return val * 0.25;
  };

  return (
    <main className="flex-1 min-h-0 flex flex-col bg-bg-obsidian text-text-mana p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-accent-teal/60 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-highlight-gold animate-pulse-glow" />
            <p className="font-mono text-xs uppercase tracking-widest text-highlight-gold">Vala Sub-Routine // Treasury &amp; Fiscal Ledger</p>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-mana">Treasure Ledger &amp; Milestone Billing</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="flex items-center gap-1.5 rounded border border-accent-teal px-3 py-1.5 font-display text-xs text-text-mana hover:bg-accent-teal/20"
          >
            <i className="fa-solid fa-diagram-project" />
            <span>Return to Tactical Canvas</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-accent-teal bg-primary-plum/30 p-4">
          <p className="font-mono text-[0.65rem] uppercase text-text-mana/60">Total Pipeline Value</p>
          <p className="font-display text-2xl font-bold text-highlight-gold mt-1">
            {currencyFormatter.format(totalPipelineValue)}
          </p>
          <p className="font-mono text-[0.62rem] text-accent-teal mt-1">{units.length} total client nodes active</p>
        </div>

        <div className="rounded-xl border border-accent-teal bg-primary-plum/30 p-4">
          <p className="font-mono text-[0.65rem] uppercase text-text-mana/60">Cleared Mobilization Deposits</p>
          <p className="font-display text-2xl font-bold text-text-mana mt-1">
            {currencyFormatter.format(totalPaidDeposits)}
          </p>
          <p className="font-mono text-[0.62rem] text-text-mana/70 mt-1">{paidDeposits.length} clients cleared Stage 02 gate</p>
        </div>

        <div className="rounded-xl border border-accent-teal bg-primary-plum/30 p-4">
          <p className="font-mono text-[0.65rem] uppercase text-text-mana/60">Deposits Due (Iron Gate Blocked)</p>
          <p className="font-display text-2xl font-bold text-alert-orange mt-1">
            {currencyFormatter.format(totalPendingDeposits)}
          </p>
          <p className="font-mono text-[0.62rem] text-alert-orange mt-1">{pendingDeposits.length} clients awaiting payment clearance</p>
        </div>
      </div>

      {/* Main Section: Ledger Table + Invoice Drafter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ledger Table */}
        <div className="lg:col-span-2 rounded-xl border border-accent-teal bg-primary-plum/20 p-4">
          <div className="flex items-center justify-between mb-3 border-b border-accent-teal/40 pb-2">
            <h2 className="font-display text-sm font-bold text-highlight-gold uppercase tracking-wide">
              Master Control Fiscal Reconciliation Ledger
            </h2>
            <span className="font-mono text-[0.65rem] text-accent-teal">THE IRON GATE AUDIT</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-accent-teal/40 text-text-mana/60 text-[0.65rem] uppercase">
                  <th className="py-2 px-2">Client Entity</th>
                  <th className="py-2 px-2">Contract Value</th>
                  <th className="py-2 px-2">Deposit (50%)</th>
                  <th className="py-2 px-2">Iron Gate Status</th>
                  <th className="py-2 px-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-teal/20">
                {units.map((u) => {
                  const isSelected = u.id === currentClient?.id;
                  const depositDue = u.contractValue * 0.5;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => onSelectUnit(u.id)}
                      className={`hover:bg-primary-plum/40 cursor-pointer transition-colors ${
                        isSelected ? 'bg-accent-teal/20 font-bold text-highlight-gold' : 'text-text-mana/80'
                      }`}
                    >
                      <td className="py-2.5 px-2">
                        <span className="block font-bold">{u.companyName || u.name}</span>
                        <span className="text-[0.6rem] text-text-mana/50">{u.id} · {u.pipelineStage}</span>
                      </td>
                      <td className="py-2.5 px-2">{currencyFormatter.format(u.contractValue)}</td>
                      <td className="py-2.5 px-2 font-bold">{currencyFormatter.format(depositDue)}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${
                          u.depositPaid
                            ? 'bg-text-mana/20 text-text-mana'
                            : 'bg-alert-orange/20 text-alert-orange'
                        }`}>
                          {u.depositPaid ? 'CLEARED (TRUE)' : 'GATED (UNPAID)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectUnit(u.id);
                            onLogTerminal(`Invoice drafted for ${u.companyName || u.name}: ${currencyFormatter.format(depositDue)}.`, 'action');
                          }}
                          className="px-2 py-1 rounded border border-highlight-gold/50 text-[0.62rem] text-highlight-gold hover:bg-highlight-gold/20"
                        >
                          Draft
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Milestone Invoice Builder Card */}
        <div className="rounded-xl border border-accent-teal bg-primary-plum/30 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-accent-teal/40 pb-2">
              <h3 className="font-display text-sm font-bold text-text-mana">Milestone Invoice Builder</h3>
              <span className="font-mono text-[0.65rem] text-highlight-gold">VALA DRAFTER</span>
            </div>

            <p className="font-mono text-xs text-text-mana/70 mb-3">
              Target: <span className="font-bold text-highlight-gold">{currentClient?.companyName || currentClient?.name}</span> ({currentClient?.id})
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[0.65rem] text-accent-teal uppercase mb-1">Milestone Tranche</label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setInvoiceType('deposit')}
                    className={`p-1.5 rounded border text-[0.65rem] ${invoiceType === 'deposit' ? 'border-highlight-gold bg-highlight-gold/20 text-highlight-gold font-bold' : 'border-accent-teal/40 text-text-mana/60'}`}
                  >
                    50% Mobilization
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceType('midterm')}
                    className={`p-1.5 rounded border text-[0.65rem] ${invoiceType === 'midterm' ? 'border-highlight-gold bg-highlight-gold/20 text-highlight-gold font-bold' : 'border-accent-teal/40 text-text-mana/60'}`}
                  >
                    25% Mid-Flight
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceType('completion')}
                    className={`p-1.5 rounded border text-[0.65rem] ${invoiceType === 'completion' ? 'border-highlight-gold bg-highlight-gold/20 text-highlight-gold font-bold' : 'border-accent-teal/40 text-text-mana/60'}`}
                  >
                    25% Liftoff
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-bg-obsidian border border-accent-teal/30 space-y-1.5">
                <div className="flex justify-between text-text-mana/70">
                  <span>Contract Baseline:</span>
                  <span className="text-text-mana">{currencyFormatter.format(currentClient?.contractValue || 0)}</span>
                </div>
                <div className="flex justify-between text-text-mana/70">
                  <span>Tranche Ratio:</span>
                  <span className="text-text-mana">{invoiceType === 'deposit' ? '50%' : '25%'}</span>
                </div>
                <div className="flex justify-between border-t border-accent-teal/30 pt-1.5 text-highlight-gold font-bold">
                  <span>Draft Total:</span>
                  <span>{currencyFormatter.format(calculateInvoiceAmount(currentClient?.contractValue || 0, invoiceType))}</span>
                </div>
              </div>

              <div className="text-[0.65rem] text-text-mana/50 italic">
                * Conforms to Session Zero Master Services Agreement (MSA) net-15 payment terms.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onLogTerminal(`Vala generated draft invoice for ${currentClient?.companyName || currentClient?.name}: ${currencyFormatter.format(calculateInvoiceAmount(currentClient?.contractValue || 0, invoiceType))}.`, 'action')}
            className="mt-4 w-full rounded border border-highlight-gold bg-highlight-gold/20 py-2.5 font-display text-xs font-bold text-highlight-gold hover:bg-highlight-gold/30 transition-colors"
          >
            <i className="fa-solid fa-file-invoice-dollar mr-1.5" />
            Generate &amp; Stage Invoice Draft
          </button>
        </div>
      </div>
    </main>
  );
};
