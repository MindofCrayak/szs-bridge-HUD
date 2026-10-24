import { useState, useEffect } from 'react';

export type KanbanTopology = 
  | 'MACRO_4'      // Ctrl+1: Intake, Session Zero, Active Sprints, Liftoff
  | 'DEEP_10'      // Ctrl+2: Granular 00 through 09 columns
  | 'SPRINTS_ONLY' // Ctrl+3: Stages 04, 05, 06, 07
  | 'GATE_TRIAGE'  // Ctrl+4: Stages 02, 03 (Audit unpaid deposits/docs)
  | 'STAGE_ISOLATE'; // Ctrl+5..0: Focus single stage

export function useKanbanMode() {
  const [topology, setTopology] = useState<KanbanTopology>('MACRO_4');
  const [isolatedStage, setIsolatedStage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept Ctrl + Digit
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && !isNaN(Number(e.key))) {
        const digit = Number(e.key);
        e.preventDefault();

        switch (digit) {
          case 1:
            setTopology('MACRO_4');
            setIsolatedStage(null);
            break;
          case 2:
            setTopology('DEEP_10');
            setIsolatedStage(null);
            break;
          case 3:
            setTopology('SPRINTS_ONLY');
            setIsolatedStage(null);
            break;
          case 4:
            setTopology('GATE_TRIAGE');
            setIsolatedStage(null);
            break;
          default:
            // Ctrl + 5..9 isolates specific numerical stages (05..09)
            setTopology('STAGE_ISOLATE');
            setIsolatedStage(String(digit).padStart(2, '0'));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { topology, isolatedStage, setTopology, setIsolatedStage };
}
