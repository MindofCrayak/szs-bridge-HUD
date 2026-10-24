import React, { useState, useEffect } from 'react';
import { KeymapConfig, DEFAULT_KEYMAP, saveStoredKeymap } from '../hooks/useBridgeKeybindings';
import { COMMAND_ABILITIES } from '../data/initialFleet';

interface KeybindingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKeymap: KeymapConfig;
  onUpdateKeymap: (newKeymap: KeymapConfig) => void;
  onLogTerminal: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

export const KeybindingSettingsModal: React.FC<KeybindingSettingsModalProps> = ({
  isOpen,
  onClose,
  currentKeymap,
  onUpdateKeymap,
  onLogTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<'viewports' | 'kanban' | 'macropad' | 'json'>('viewports');
  const [keymapDraft, setKeymapDraft] = useState<KeymapConfig>(currentKeymap);
  const [listeningFor, setListeningFor] = useState<{
    section: 'departments' | 'kanbanViews' | 'macroPad';
    actionKey: string;
  } | null>(null);
  const [testLog, setTestLog] = useState<string>('Press any key or combo to test active bindings...');

  useEffect(() => {
    setKeymapDraft(currentKeymap);
  }, [currentKeymap, isOpen]);

  // Key capture listener for remapping
  useEffect(() => {
    if (!listeningFor) return;

    const handleCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setListeningFor(null);
        return;
      }

      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');

      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        parts.push(keyName);
      } else {
        return; // wait for non-modifier key
      }

      const combo = parts.join('+');

      setKeymapDraft((prev) => {
        const next = { ...prev };
        if (listeningFor.section === 'departments') {
          // Find old combo for this target and delete
          const entries = Object.entries(next.departments).filter(([_, v]) => v !== listeningFor.actionKey);
          next.departments = Object.fromEntries(entries);
          next.departments[combo] = listeningFor.actionKey;
        } else if (listeningFor.section === 'kanbanViews') {
          const entries = Object.entries(next.kanbanViews).filter(([_, v]) => v !== listeningFor.actionKey);
          next.kanbanViews = Object.fromEntries(entries);
          next.kanbanViews[combo] = listeningFor.actionKey;
        } else if (listeningFor.section === 'macroPad') {
          next.macroPad = { ...next.macroPad, [combo]: listeningFor.actionKey };
        }
        return next;
      });

      setTestLog(`Remapped ${listeningFor.actionKey} to [${combo}]`);
      setListeningFor(null);
    };

    window.addEventListener('keydown', handleCapture, { capture: true });
    return () => window.removeEventListener('keydown', handleCapture, { capture: true });
  }, [listeningFor]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredKeymap(keymapDraft);
    onUpdateKeymap(keymapDraft);
    onLogTerminal('Bridge keybindings updated & saved to local storage.', 'action');
    onClose();
  };

  const handleResetDefaults = () => {
    setKeymapDraft(DEFAULT_KEYMAP);
    saveStoredKeymap(DEFAULT_KEYMAP);
    onUpdateKeymap(DEFAULT_KEYMAP);
    onLogTerminal('Bridge keybindings reset to manufacturer default scheme.', 'server');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(keymapDraft, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'szs_keymap_profile.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const departmentLabels: Record<string, string> = {
    dashboard: 'Tactical 4-Column Pipeline Canvas',
    osint: 'OSINT War Room (Oracle Canvas)',
    symphony: 'Symphony Roadmap & Sprint Matrix (Dolores)',
    treasure: 'Treasure Billing & Milestone Ledger (Vala)',
    archive: 'Mail Command Center & Retention Drips (Daisy)',
    clients: 'Master Client Directory',
    actions: 'Macro Matrix & Workspace Shortcuts',
  };

  const kanbanLabels: Record<string, string> = {
    macro4: '4-Column Macro Horizon (Intake, S-Zero, Sprints, Liftoff)',
    deep10: '10-Stage Deep Deck (Full Granular Stages 00–09)',
    active_sprints: 'Active Delivery Sprints Only (Stages 04–07)',
    gate_triage: 'Inception & Gate Triage (Audit Stages 02 & 03)',
    stage_00: 'Isolate Stage 00: Discovery',
    stage_01: 'Isolate Stage 01: Pitch Staged',
    stage_02: 'Isolate Stage 02: Contract & Inception',
    stage_04: 'Isolate Stage 04: Session Zero Kickoff',
    stage_05: 'Isolate Stage 05: Builds',
    all: 'Show All Pipeline Stages (Reset Filters)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-obsidian/85 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keymap-modal-title"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-xl border border-accent-teal bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] shadow-[0_0_35px_rgba(8,99,117,0.4)] overflow-hidden text-text-mana">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-accent-teal/60 bg-primary-plum/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-highlight-gold/60 bg-highlight-gold/20 text-highlight-gold">
              <i className="fa-solid fa-keyboard text-base" />
            </div>
            <div>
              <h2 id="keymap-modal-title" className="font-display text-base font-bold text-text-mana">
                Bridge Keybinding Orchestrator &amp; Remapper
              </h2>
              <p className="font-mono text-xs text-text-mana/70">
                Unified dual-display hotkeys · Strict Chrome intercept prevention · Hardware macro profile
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded border border-accent-teal/50 text-text-mana/70 hover:border-alert-orange hover:text-alert-orange"
            title="Close Settings (Esc)"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-accent-teal/40 bg-bg-obsidian/60 px-6 pt-3 gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('viewports')}
            className={`px-4 py-2 rounded-t border-t border-x transition-colors ${
              activeTab === 'viewports'
                ? 'border-highlight-gold bg-primary-plum/40 text-highlight-gold font-bold'
                : 'border-transparent text-text-mana/60 hover:text-text-mana'
            }`}
          >
            <i className="fa-solid fa-layer-group mr-1.5" />
            Departments (Alt + 1..7)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 rounded-t border-t border-x transition-colors ${
              activeTab === 'kanban'
                ? 'border-highlight-gold bg-primary-plum/40 text-highlight-gold font-bold'
                : 'border-transparent text-text-mana/60 hover:text-text-mana'
            }`}
          >
            <i className="fa-solid fa-table-columns mr-1.5" />
            Kanban Granularity (Ctrl + 1..0)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('macropad')}
            className={`px-4 py-2 rounded-t border-t border-x transition-colors ${
              activeTab === 'macropad'
                ? 'border-highlight-gold bg-primary-plum/40 text-highlight-gold font-bold'
                : 'border-transparent text-text-mana/60 hover:text-text-mana'
            }`}
          >
            <i className="fa-solid fa-gamepad mr-1.5" />
            Macro Pad (Q–C Grid)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2 rounded-t border-t border-x transition-colors ${
              activeTab === 'json'
                ? 'border-highlight-gold bg-primary-plum/40 text-highlight-gold font-bold'
                : 'border-transparent text-text-mana/60 hover:text-text-mana'
            }`}
          >
            <i className="fa-solid fa-code mr-1.5" />
            JSON Profile / Backup
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          {/* Listening Overlay Notification */}
          {listeningFor && (
            <div className="rounded-lg border-2 border-dashed border-highlight-gold bg-highlight-gold/15 p-4 text-center animate-pulse">
              <p className="font-display text-sm font-bold text-highlight-gold">
                Listening for new hotkey combination for: <span className="underline">{listeningFor.actionKey}</span>
              </p>
              <p className="font-mono text-xs text-text-mana/80 mt-1">
                Press your desired key combination (e.g., Alt+1, Ctrl+Shift+K, or any single key) or press <kbd className="px-1.5 py-0.5 rounded bg-bg-obsidian border border-accent-teal">Esc</kbd> to cancel.
              </p>
            </div>
          )}

          {/* TAB 1: Department Viewports */}
          {activeTab === 'viewports' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-accent-teal/40 bg-primary-plum/20 p-3">
                <p className="font-mono text-xs text-text-mana/80">
                  <span className="font-bold text-highlight-gold">Department Viewports (`Alt + [1–7]`):</span> Swaps the active operational horizon across the command bridges without reloading state.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {Object.entries(departmentLabels).map(([target, label]) => {
                  const currentCombo = Object.entries(keymapDraft.departments).find(([_, v]) => v === target)?.[0] || 'Unbound';
                  return (
                    <div
                      key={target}
                      className="flex items-center justify-between rounded-lg border border-accent-teal/40 bg-bg-obsidian/70 p-3 hover:border-accent-teal"
                    >
                      <div>
                        <span className="font-display text-xs font-bold text-text-mana block">{label}</span>
                        <span className="font-mono text-[0.65rem] text-text-mana/60">Target: {target}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2.5 py-1 rounded border border-highlight-gold/60 bg-highlight-gold/15 font-mono text-xs font-bold text-highlight-gold">
                          {currentCombo}
                        </kbd>
                        <button
                          type="button"
                          onClick={() => setListeningFor({ section: 'departments', actionKey: target })}
                          className="px-2 py-1 rounded border border-accent-teal text-xs font-mono text-text-mana hover:bg-accent-teal/30"
                        >
                          Remap
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RTS Client Control Groups Info */}
              <div className="mt-4 rounded-lg border border-accent-teal/40 bg-bg-obsidian/70 p-3.5 space-y-2">
                <h3 className="font-display text-xs font-bold text-highlight-gold uppercase">
                  RTS Client Control Groups (StarCraft Style)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs text-text-mana/80">
                  <div className="p-2 rounded bg-primary-plum/30 border border-accent-teal/30">
                    <span className="font-bold text-highlight-gold">Shift + [1–9]:</span> Bind currently selected client to Slot N
                  </div>
                  <div className="p-2 rounded bg-primary-plum/30 border border-accent-teal/30">
                    <span className="font-bold text-highlight-gold">[1–9] (Unmodified):</span> Recall Slot N (snaps canvas, filters checklists)
                  </div>
                  <div className="p-2 rounded bg-primary-plum/30 border border-accent-teal/30">
                    <span className="font-bold text-highlight-gold">Shift + 0 / [0]:</span> Clear active client lock &amp; return to global view
                  </div>
                  <div className="p-2 rounded bg-primary-plum/30 border border-accent-teal/30">
                    <span className="font-bold text-highlight-gold">Ctrl + Shift + Wheel:</span> Safe Canvas Zoom (Bypasses Chrome Zoom)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Kanban Views */}
          {activeTab === 'kanban' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-accent-teal/40 bg-primary-plum/20 p-3">
                <p className="font-mono text-xs text-text-mana/80">
                  <span className="font-bold text-highlight-gold">Kanban Topology Modes (`Ctrl + [1–0]`):</span> Switches between compressed 4-column macro view and deep stage isolation. Chromium native tab-switching is suppressed via strict prevention handlers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {Object.entries(kanbanLabels).map(([target, label]) => {
                  const currentCombo = Object.entries(keymapDraft.kanbanViews).find(([_, v]) => v === target)?.[0] || 'Unbound';
                  return (
                    <div
                      key={target}
                      className="flex items-center justify-between rounded-lg border border-accent-teal/40 bg-bg-obsidian/70 p-3 hover:border-accent-teal"
                    >
                      <div>
                        <span className="font-display text-xs font-bold text-text-mana block">{label}</span>
                        <span className="font-mono text-[0.65rem] text-text-mana/60">Mode: {target}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2.5 py-1 rounded border border-highlight-gold/60 bg-highlight-gold/15 font-mono text-xs font-bold text-highlight-gold">
                          {currentCombo}
                        </kbd>
                        <button
                          type="button"
                          onClick={() => setListeningFor({ section: 'kanbanViews', actionKey: target })}
                          className="px-2 py-1 rounded border border-accent-teal text-xs font-mono text-text-mana hover:bg-accent-teal/30"
                        >
                          Remap
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Macro Pad */}
          {activeTab === 'macropad' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-accent-teal/40 bg-primary-plum/20 p-3">
                <p className="font-mono text-xs text-text-mana/80">
                  <span className="font-bold text-highlight-gold">3x3 Hardware Macro Pad Simulation:</span> Direct action dispatches mapped to keyboard keys.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto pt-2">
                {COMMAND_ABILITIES.map((cmd) => {
                  const assignedKey = Object.entries(keymapDraft.macroPad).find(([_, v]) => v === cmd.key)?.[0] || cmd.key;
                  return (
                    <div
                      key={cmd.key}
                      className={`flex flex-col justify-between p-3.5 rounded-xl border text-center transition-all ${
                        cmd.disabled
                          ? 'border-accent-teal/30 bg-bg-obsidian/40 opacity-50'
                          : 'border-accent-teal bg-bg-obsidian hover:border-highlight-gold hover:shadow-[0_0_12px_rgba(224,202,60,0.2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-primary-plum text-xs text-highlight-gold font-bold">
                          <i className={cmd.icon} />
                        </span>
                        <kbd className="px-2 py-0.5 rounded border border-highlight-gold bg-highlight-gold/20 font-mono text-xs font-bold text-highlight-gold">
                          {assignedKey}
                        </kbd>
                      </div>
                      <div className="my-2">
                        <span className="font-display text-xs font-bold text-text-mana block">{cmd.label}</span>
                        <span className="font-mono text-[0.6rem] text-text-mana/60 block mt-0.5 line-clamp-1">{cmd.description}</span>
                      </div>
                      <button
                        type="button"
                        disabled={cmd.disabled}
                        onClick={() => setListeningFor({ section: 'macroPad', actionKey: cmd.key })}
                        className="mt-1 w-full py-1 rounded border border-accent-teal text-[0.65rem] font-mono hover:bg-accent-teal/30 disabled:opacity-30"
                      >
                        Remap Key
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: JSON Backup / Export */}
          {activeTab === 'json' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="rounded-lg border border-accent-teal/40 bg-primary-plum/20 p-3">
                <p className="text-text-mana/80">
                  Export or import your active keymapping configuration as JSON to synchronize across workstations.
                </p>
              </div>

              <textarea
                readOnly
                value={JSON.stringify(keymapDraft, null, 2)}
                rows={12}
                className="w-full rounded-lg border border-accent-teal bg-bg-obsidian p-3 text-text-mana font-mono text-xs focus:outline-none"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-1.5 rounded border border-highlight-gold bg-highlight-gold/20 font-bold text-highlight-gold hover:bg-highlight-gold/30"
                >
                  <i className="fa-solid fa-download mr-1.5" />
                  Download JSON Profile
                </button>
              </div>
            </div>
          )}

          {/* Test area banner */}
          <div className="rounded-lg border border-accent-teal/50 bg-bg-obsidian/80 px-4 py-2 font-mono text-xs flex items-center justify-between">
            <span className="text-text-mana/60">Live Keypress Diagnostic:</span>
            <span className="text-highlight-gold font-bold">{testLog}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-accent-teal/60 bg-primary-plum/30 px-6 py-4">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="rounded border border-alert-orange/50 px-3 py-1.5 font-mono text-xs text-alert-orange hover:bg-alert-orange/15 transition-colors"
          >
            <i className="fa-solid fa-rotate-left mr-1.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-accent-teal/50 px-4 py-1.5 font-mono text-xs text-text-mana/80 hover:bg-accent-teal/20"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded border border-highlight-gold bg-highlight-gold px-5 py-1.5 font-display text-xs font-bold text-bg-obsidian hover:bg-highlight-gold/90 shadow-md"
            >
              Save Keymap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
