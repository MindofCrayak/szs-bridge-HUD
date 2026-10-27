import React from 'react';
import { AlertTriangle, DollarSign, ShieldAlert } from 'lucide-react';

interface DropConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  serviceName: string;
  priceDelta: number;
  currentValue: number;
  targetClientName: string;
}

export const DropConfirmDialog: React.FC<DropConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  serviceName,
  priceDelta,
  currentValue,
  targetClientName,
}) => {
  if (!isOpen) return null;

  const finalValue = currentValue + priceDelta;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm select-none font-mono">
      <div className="w-[420px] rounded-2xl border-2 border-[#FE5F00] bg-[#020500] p-5 shadow-[0_0_50px_rgba(254,95,0,0.4)] text-[#DDFBD0] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-[#FE5F00]/40 pb-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#FE5F00]/20 border border-[#FE5F00] flex items-center justify-center text-[#FE5F00]">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm tracking-wide text-white uppercase">
              Financial Mutation Confirmation
            </h3>
            <span className="text-[10px] text-[#FE5F00] font-bold">
              IRON GATE LEDGER OVERRIDE REQUIRED
            </span>
          </div>
        </div>

        {/* Target Entity */}
        <div className="p-2.5 rounded-lg bg-[#086375]/15 border border-[#086375]/40 mb-3 text-xs">
          <span className="text-[10px] text-[#086375] uppercase block font-bold">Client Target:</span>
          <span className="font-bold text-[#E0CA3C] text-sm">{targetClientName}</span>
        </div>

        {/* Ledger Impact Delta */}
        <div className="space-y-2 mb-4 bg-[#0d1513] p-3 rounded-xl border border-[#086375]/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#DDFBD0]/70">Modular Component:</span>
            <span className="font-bold text-white">{serviceName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#DDFBD0]/70">Current Contract Value:</span>
            <span className="font-mono text-white">${currentValue.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#FE5F00]">
            <span className="font-bold">+ Ledger Increment:</span>
            <span className="font-bold font-mono">+${priceDelta.toLocaleString()}</span>
          </div>
          <div className="border-t border-[#086375]/40 pt-2 flex items-center justify-between text-sm font-bold text-[#E0CA3C]">
            <span>Authoritative New Value:</span>
            <span>${finalValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Guardrail Warning */}
        <div className="flex items-start gap-2 p-2 rounded bg-[#FE5F00]/10 border border-[#FE5F00]/30 text-[10px] text-[#FE5F00] mb-5">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            According to the Brief, any action changing Contract Value must be verified and confirmed by the human operator before syncing to Master Control.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-[#086375] bg-[#020500] hover:bg-[#086375]/30 text-xs font-bold transition-colors cursor-pointer text-[#DDFBD0]/80"
          >
            ABORT DROP
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg border border-[#FE5F00] bg-[#FE5F00] hover:bg-[#FE5F00]/80 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(254,95,0,0.5)] cursor-pointer"
          >
            AUTHORIZE MUTATION
          </button>
        </div>
      </div>
    </div>
  );
};
