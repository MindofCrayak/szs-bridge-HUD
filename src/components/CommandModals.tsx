import React, { useState } from 'react';
import { ActiveModal, ClientUnit } from '../types';

interface CommandModalsProps {
  activeModal: ActiveModal;
  onClose: () => void;
  activeUnit: ClientUnit | null;
  onAddUnit: (newUnit: ClientUnit) => void;
  onLogTerminal: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

const ACTION_DETAILS: Partial<Record<Exclude<ActiveModal, null | 'MENU'>, { title: string; description: string; href: string; action: string }>> = {
  Q: {
    title: 'Pre-fill Gmail',
    description: 'Open a new Gmail draft addressed to the selected client.',
    href: 'https://mail.google.com/mail/?view=cm&fs=1',
    action: 'Open Gmail draft',
  },
  W: {
    title: 'Open Chat Space',
    description: 'Continue the client conversation in Google Chat.',
    href: 'https://chat.google.com/',
    action: 'Open Google Chat',
  },
  E: {
    title: 'Schedule Meet',
    description: 'Create a calendar event for a client meeting.',
    href: 'https://calendar.google.com/calendar/u/0/r/eventedit',
    action: 'Open Calendar',
  },
  S: {
    title: 'Draft Invoice',
    description: 'Start an invoice document for the client contract.',
    href: 'https://docs.google.com/document/create',
    action: 'Create invoice document',
  },
  D: {
    title: 'Open Google Tasks',
    description: 'Review follow-ups and task lists in Google Tasks.',
    href: 'https://tasks.google.com/',
    action: 'Open Google Tasks',
  },
  X: {
    title: 'Open Meet Notes',
    description: 'Open Google Docs to review or create meeting notes.',
    href: 'https://docs.google.com/document/u/0/',
    action: 'Open Google Docs',
  },
  C: {
    title: 'Generate Pitch Deck',
    description: 'Create a Google Slides deck for the client.',
    href: 'https://slides.google.com/create',
    action: 'Create pitch deck',
  },
};

export const CommandModals: React.FC<CommandModalsProps> = ({
  activeModal,
  onClose,
  activeUnit,
  onAddUnit,
  onLogTerminal,
}) => {
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contractValue, setContractValue] = useState('5000');
  if (!activeModal) return null;

  const actionDetails = activeModal === 'MENU' ? undefined : ACTION_DETAILS[activeModal];
  const actionHref = actionDetails
    ? new URLSearchParams({
        view: 'cm',
        fs: '1',
        to: activeModal === 'Q' ? activeUnit?.contactEmail || '' : '',
        su: activeModal === 'Q' ? `Session Zero Solutions - ${activeUnit?.name || 'Client follow-up'}` : '',
        body: activeModal === 'Q' ? `Hi ${activeUnit?.name || 'there'},\n\n` : '',
        text: activeModal === 'E' ? `Client meeting: ${activeUnit?.name || ''}` : '',
        details: activeModal === 'E' ? `Session Zero Solutions client meeting${activeUnit ? ` with ${activeUnit.name}` : ''}` : '',
        add: activeModal === 'E' ? activeUnit?.contactEmail || '' : '',
      })
    : null;
  const finalActionHref = actionDetails && actionHref
    ? activeModal === 'Q'
      ? `https://mail.google.com/mail/?${actionHref.toString()}`
      : activeModal === 'E'
        ? `https://calendar.google.com/calendar/u/0/r/eventedit?${actionHref.toString()}`
        : actionDetails.href
    : '';

  const handleCreateClient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericValue = Number(contractValue);
    if (!clientName.trim() || !Number.isFinite(numericValue) || numericValue < 0) return;

    const initials = clientName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    const newClient: ClientUnit = {
      id: `C-${Date.now()}`,
      name: clientName.trim(),
      archetype: company.trim() || 'New client',
      serviceArea: company.trim() || 'New client',
      avatar: initials,
      contractValue: numericValue,
      depositPaid: false,
      currentMilestone: 'Initial consultation',
      totalMilestones: 4,
      completedMilestones: 0,
      posX: 35,
      posY: 45,
      pipelineStage: '01: Intake',
      roadblock: 'Confirm project scope',
      contactEmail: contactEmail.trim(),
    };
    onAddUnit(newClient);
    onLogTerminal(`Client Onboarded: ${newClient.name} added to Intake.`, 'action');
    onClose();
  };

  const title = activeModal === 'MENU'
    ? 'Workspace settings'
    : activeModal === 'A'
      ? 'New Project Onboarding'
      : actionDetails?.title || 'Workspace action';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-obsidian/80 p-4 backdrop-blur-sm">
      <section className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-accent-teal bg-bg-obsidian shadow-2xl">
        <header className="flex items-center justify-between border-b border-accent-teal/60 bg-primary-plum/60 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-text-mana">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent-teal text-text-mana hover:border-alert-orange"
            title="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </header>

        <div className="overflow-y-auto p-5">
          {activeModal === 'A' && (
            <form onSubmit={handleCreateClient} className="space-y-4">
              <p className="text-sm text-text-mana/70">Create a client record and add the new project to the Intake stage.</p>
              <label className="block text-sm text-text-mana">
                Client name
                <input value={clientName} onChange={(event) => setClientName(event.target.value)} required className="mt-1 w-full rounded-lg border border-accent-teal bg-primary-plum/30 px-3 py-2" />
              </label>
              <label className="block text-sm text-text-mana">
                Company or service area
                <input value={company} onChange={(event) => setCompany(event.target.value)} className="mt-1 w-full rounded-lg border border-accent-teal bg-primary-plum/30 px-3 py-2" />
              </label>
              <label className="block text-sm text-text-mana">
                Contact email
                <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-accent-teal bg-primary-plum/30 px-3 py-2" />
              </label>
              <label className="block text-sm text-text-mana">
                Contract value (USD)
                <input type="number" min="0" step="1" value={contractValue} onChange={(event) => setContractValue(event.target.value)} required className="mt-1 w-full rounded-lg border border-accent-teal bg-primary-plum/30 px-3 py-2" />
              </label>
              <button type="submit" className="w-full rounded-lg bg-alert-orange px-4 py-2 font-accent text-bg-obsidian">
                Add client to Intake
              </button>
            </form>
          )}

          {actionDetails && (
            <div className="space-y-4">
              <p className="text-sm text-text-mana/70">{actionDetails.description}</p>
              <div className="rounded-lg border border-accent-teal bg-primary-plum/30 p-4">
                <div className="text-xs uppercase text-text-mana/55">Selected client</div>
                <div className="mt-1 font-display text-lg text-text-mana">{activeUnit?.name || 'No client selected'}</div>
                {activeUnit && (
                  <div className="mt-2 space-y-1 text-sm text-text-mana/70">
                    <div>{activeUnit.contactEmail || 'No email address saved'}</div>
                    <div>Contract: ${activeUnit.contractValue.toLocaleString()}</div>
                    <div>Milestone: {activeUnit.currentMilestone}</div>
                  </div>
                )}
              </div>
              {activeModal === 'Q' && !activeUnit?.contactEmail && (
                <p className="text-sm text-alert-orange">Add a contact email to pre-fill the recipient.</p>
              )}
              <a
                href={finalActionHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onLogTerminal(`${actionDetails.title} opened${activeUnit ? ` for ${activeUnit.name}` : ''}.`, 'action')}
                className="block rounded-lg bg-alert-orange px-4 py-3 text-center font-accent text-bg-obsidian"
              >
                {actionDetails.action}
              </a>
            </div>
          )}

          {activeModal === 'Z' && (
            <p className="text-sm text-text-mana/70">This shortcut is intentionally disabled.</p>
          )}

          {activeModal === 'MENU' && (
            <div className="space-y-4 text-sm text-text-mana">
              <p>Session Zero Solutions workspace preferences.</p>
              <button onClick={onClose} className="w-full rounded-lg border border-accent-teal px-4 py-3 hover:border-alert-orange">
                Close settings
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
