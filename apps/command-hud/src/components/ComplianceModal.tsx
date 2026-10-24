import React, { useState } from 'react';
import { postMasterControlAction } from '../data/api';
import { ClientUnit } from '../types';

interface ComplianceModalProps {
  activeUnit: ClientUnit | null;
  onClose: () => void;
}

const REQUIRED_ITEMS = [
  { label: 'Root Folder', key: 'RootFolderID' },
  { label: 'MSA', key: 'MSA_DocID' },
  { label: 'Project Folder', key: 'ProjectFolderID' },
  { label: 'SOW', key: 'SOW_DocID' },
  { label: 'Meeting Notes', key: 'MeetingNotes_DriveFolderID' },
] as const;

export const ComplianceModal: React.FC<ComplianceModalProps> = ({ activeUnit, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const missingCount = REQUIRED_ITEMS.filter(({ key }) => !activeUnit?.[key]?.trim()).length;

  const handleProvisioning = async () => {
    if (!activeUnit || isLoading) return;
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await postMasterControlAction({
        action: 'RUN_PROVISIONING',
        clientData: activeUnit,
        projectData: { ProjectName: 'Session_Zero_Audit' },
      });
      setSuccess(true);
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Provisioning could not be completed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-obsidian/75 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="compliance-modal-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-accent-teal/80 bg-[#020500]/95 shadow-[0_0_40px_rgba(8,99,117,0.25)]"
      >
        <header className="flex items-center justify-between border-b border-accent-teal/60 bg-gradient-to-r from-primary-plum/50 to-[#020500] px-5 py-4">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-alert-orange">Client integrity</p>
            <h2 id="compliance-modal-title" className="mt-1 font-display text-lg font-bold text-text-mana">Compliance Check</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close compliance check"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-teal text-text-mana hover:border-alert-orange hover:text-alert-orange disabled:opacity-50"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </header>

        <div className="p-5">
          <div className="mb-4 rounded-lg border border-accent-teal/40 bg-accent-teal/10 px-3 py-2">
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-text-mana/50">Active client</p>
            <p className="mt-0.5 font-display text-sm font-semibold text-text-mana">{activeUnit?.name || 'No client selected'}</p>
          </div>

          <ul className="space-y-2" aria-label="Required compliance documents">
            {REQUIRED_ITEMS.map(({ label, key }) => {
              const isPresent = Boolean(activeUnit?.[key]?.trim());
              return (
                <li key={key} className="flex items-center justify-between rounded-lg border border-accent-teal/45 bg-black/25 px-4 py-3">
                  <span className="font-display text-sm text-text-mana">{label}</span>
                  <span
                    aria-label={`${label}: ${isPresent ? 'Found' : 'Missing'}`}
                    className={`flex items-center gap-2 font-mono text-xs font-bold ${isPresent ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    <span aria-hidden="true">{isPresent ? '✅' : '❌'}</span>
                    {isPresent ? 'FOUND' : 'MISSING'}
                  </span>
                </li>
              );
            })}
          </ul>

          {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-300">{error}</p>}
          {success && (
            <p role="status" className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 font-mono text-xs text-emerald-300">
              Provisioning request submitted. Refresh client records to view updated compliance IDs.
            </p>
          )}

          {missingCount > 0 && (
            <button
              type="button"
              onClick={() => void handleProvisioning()}
              disabled={!activeUnit || isLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-alert-orange px-4 py-3 font-display text-sm font-bold tracking-wide text-bg-obsidian shadow-[0_0_18px_rgba(254,95,0,0.2)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin" />
                  Provisioning...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles" />
                  Run Provisioning
                </>
              )}
            </button>
          )}
          {!activeUnit && <p className="mt-3 text-center font-mono text-xs text-alert-orange">Select an active client before provisioning.</p>}
        </div>
      </section>
    </div>
  );
};
