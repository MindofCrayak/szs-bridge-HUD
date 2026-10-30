import type { Department } from './catalog';
import type { ProposalType } from './proposals';
import type { HudEventType } from './events';
import type { LinkKind } from './links';

export type RuleStatus = 'suggested' | 'approved';
export type RuleSource = Department | 'component';
export type RuleTarget = Department | '*';

export interface HudRule {
  id: string;
  status: RuleStatus;
  on: HudEventType;
  from: RuleSource;
  kind: LinkKind;
  to: RuleTarget;
  effect: 'unblock' | 'propose' | 'context';
  proposal?: ProposalType;
  moneyGate?: boolean;
  clientFacing?: boolean;
  note: string;
}

export const RULES: readonly HudRule[] = [
  { id: 'pamela-msa-unblocks-vala', status: 'suggested', on: 'msa.signed', from: 'pamela', kind: 'dependency', to: 'vala', effect: 'unblock', note: 'Unblocks invoice drafting.' },
  { id: 'pamela-msa-kickoff', status: 'suggested', on: 'msa.signed', from: 'pamela', kind: 'trigger', to: 'dolores', effect: 'propose', proposal: 'create_tasks', note: 'Prepare kickoff tasks for human review.' },
  { id: 'component-installed-tasks', status: 'suggested', on: 'component.installed', from: 'component', kind: 'trigger', to: 'dolores', effect: 'propose', proposal: 'create_tasks', note: 'Prepare component tasks for human review.' },
  { id: 'component-installed-ledger', status: 'suggested', on: 'component.installed', from: 'component', kind: 'trigger', to: 'vala', effect: 'propose', proposal: 'ledger_increment', moneyGate: true, note: 'Prepare a ledger proposal for the Financial Mutation gate.' },
  { id: 'oracle-sweep-context', status: 'suggested', on: 'sweep.complete', from: 'oracle', kind: 'context', to: '*', effect: 'context', note: 'Share a summary only; never expose Oracle internals.' },
  { id: 'milestone-invoice', status: 'suggested', on: 'milestone.done', from: 'dolores', kind: 'trigger', to: 'vala', effect: 'propose', proposal: 'draft_invoice', moneyGate: true, note: 'Prepare an invoice proposal for the Financial Mutation gate.' },
  { id: 'milestone-nurture', status: 'suggested', on: 'milestone.done', from: 'dolores', kind: 'trigger', to: 'daisy', effect: 'propose', proposal: 'nurture_step', clientFacing: true, note: 'Prepare a client journey proposal for Daisy to review.' },
  { id: 'paid-thankyou', status: 'suggested', on: 'invoice.paid', from: 'vala', kind: 'trigger', to: 'daisy', effect: 'propose', proposal: 'send_email', clientFacing: true, note: 'Prepare a client-facing message for Daisy to review.' },
  { id: 'paid-next-phase', status: 'suggested', on: 'invoice.paid', from: 'vala', kind: 'trigger', to: 'dolores', effect: 'propose', proposal: 'unlock_next_phase', note: 'Prepare a next-phase proposal for human review.' },
  { id: 'overdue-roadblock', status: 'suggested', on: 'task.overdue', from: 'dolores', kind: 'trigger', to: 'daisy', effect: 'propose', proposal: 'client_checkin', clientFacing: true, note: 'Prepare a client check-in proposal for Daisy to review.' },
];
