import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ClientUnit } from '../types';

interface CardContextMenuProps {
  x: number;
  y: number;
  client: ClientUnit;
  onClose: () => void;
  onAdvanceStage: (client: ClientUnit) => void;
  onDraftInvoice: (client: ClientUnit) => void;
  onFlagBlocker: (client: ClientUnit) => void;
  onSunsetClient: (client: ClientUnit) => void;
  onDeleteDraftCard: (client: ClientUnit) => void;
}

export const CardContextMenu: React.FC<CardContextMenuProps> = ({
  x,
  y,
  client,
  onClose,
  onAdvanceStage,
  onDraftInvoice,
  onFlagBlocker,
  onSunsetClient,
  onDeleteDraftCard,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    x: Number.isFinite(x) ? x : 8,
    y: Number.isFinite(y) ? y : 8,
  });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const bounds = menu.getBoundingClientRect();
    const requestedX = Number.isFinite(x) ? x : 8;
    const requestedY = Number.isFinite(y) ? y : 8;
    setPosition({
      x: Math.max(8, Math.min(requestedX, window.innerWidth - bounds.width - 8)),
      y: Math.max(8, Math.min(requestedY, window.innerHeight - bounds.height - 8)),
    });
  }, [x, y]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const handleScroll = () => onClose();
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const openUrl = (url: string | undefined) => {
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:') window.open(parsed.href, '_blank', 'noopener,noreferrer');
    } finally {
      onClose();
    }
  };

  const itemClass = 'flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-text-mana hover:bg-primary-plum hover:text-highlight-gold disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`${client.companyName || client.name} actions`}
      className="fixed z-[70] w-60 rounded border border-accent-teal bg-bg-obsidian/95 p-1 font-mono shadow-2xl backdrop-blur-md"
      style={{ top: position.y, left: position.x }}
    >
      <div className="truncate border-b border-accent-teal px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-highlight-gold">
        {client.companyName || client.id || 'Unassigned node'}
      </div>
      <div className="space-y-0.5 py-1">
        <button type="button" role="menuitem" className={itemClass} disabled={!client.driveFolderUrl} onClick={() => openUrl(client.driveFolderUrl)}>
          <i className="fa-solid fa-folder w-4 text-center" /> Open Drive Folder
        </button>
        <button type="button" role="menuitem" className={itemClass} disabled={!client.notesDocUrl} onClick={() => openUrl(client.notesDocUrl)}>
          <i className="fa-solid fa-file-lines w-4 text-center" /> Open Meeting Notes
        </button>
        <button type="button" role="menuitem" className={itemClass} disabled={!client.chatSpaceUrl} onClick={() => openUrl(client.chatSpaceUrl)}>
          <i className="fa-solid fa-comments w-4 text-center" /> Dolores: Chat Space
        </button>
        <div className="my-1 border-t border-accent-teal/40" />
        <button type="button" role="menuitem" className={itemClass} onClick={() => { onAdvanceStage(client); onClose(); }}>
          <i className="fa-solid fa-forward w-4 text-center" /> Advance Stage
        </button>
        <button type="button" role="menuitem" className={itemClass} onClick={() => { onDraftInvoice(client); onClose(); }}>
          <i className="fa-solid fa-file-invoice-dollar w-4 text-center" /> Draft Invoice
        </button>
        <button type="button" role="menuitem" className={`${itemClass} text-alert-orange`} onClick={() => { onFlagBlocker(client); onClose(); }}>
          <i className="fa-solid fa-triangle-exclamation w-4 text-center" /> Flag Blocker
        </button>
        <div className="my-1 border-t border-accent-teal/40" />
        <button
          type="button"
          role="menuitem"
          className={`${itemClass} text-alert-orange hover:bg-alert-orange/20`}
          onClick={() => {
            onSunsetClient(client);
            onClose();
          }}
        >
          <i className="fa-solid fa-box-archive w-4 text-center" /> Soft-Archive to 09: Sunset
        </button>
      </div>
    </div>
  );
};
