import { useEffect } from 'react';

export function useRTSHotkeys(clients: any[], onSelectClient: (client: any) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (['INPUT', 'TEXTAREA'].includes(target.tagName) ||
          target.isContentEditable ||
          (target as HTMLInputElement).type === 'search')
      ) {
        return;
      }

      // Intercept Ctrl + 1 through Ctrl + 9 (or Cmd on macOS)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        const digit = parseInt(e.key, 10);
        if (!isNaN(digit) && digit >= 1 && digit <= 9) {
          const targetIndex = digit - 1;
          if (clients && clients[targetIndex]) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🛰️ RTS Quick-Recall: Jumping to Solar Workbench [${digit}] -> ${clients[targetIndex].Company_Name || clients[targetIndex].name}`);
            onSelectClient(clients[targetIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [clients, onSelectClient]);
}
