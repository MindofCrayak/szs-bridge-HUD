import { CommandAbility } from '../types';

export const CLIENT_TEMPLATES: Record<string, { name: string; serviceArea: string; avatar: string; contractValue: number }> = {
  strategy: { name: 'Strategy Lead', serviceArea: 'Product Strategy', avatar: 'ST', contractValue: 3500 },
  operations: { name: 'Operations Lead', serviceArea: 'Operations Consulting', avatar: 'OP', contractValue: 5000 },
  business: { name: 'Business Lead', serviceArea: 'Business Consulting', avatar: 'BU', contractValue: 4200 },
  growth: { name: 'Growth Partner', serviceArea: 'Growth Strategy', avatar: 'GR', contractValue: 35000 },
  finance: { name: 'Finance Partner', serviceArea: 'Financial Technology', avatar: 'FI', contractValue: 18500 },
  brand: { name: 'Brand Partner', serviceArea: 'Brand Design', avatar: 'BR', contractValue: 6800 }
};

export const COMMAND_ABILITIES: CommandAbility[] = [
  { key: 'Q', label: 'Pre-fill Gmail', action: 'Pre-fill Gmail', icon: 'fa-solid fa-envelope', description: 'Draft an email to the selected client.' },
  { key: 'W', label: 'Open Chat Space', action: 'Open Chat Space', icon: 'fa-solid fa-comments', description: 'Open the client conversation in Chat.' },
  { key: 'E', label: 'Schedule Meet', action: 'Schedule Meet', icon: 'fa-solid fa-video', description: 'Schedule a Google Meet with the selected client.' },
  { key: 'A', label: 'New Project Onboarding', action: 'New Project Onboarding', icon: 'fa-solid fa-folder-plus', description: 'Start a new client onboarding project.' },
  { key: 'S', label: 'Draft Milestone Invoice', action: 'Draft Milestone Invoice', icon: 'fa-solid fa-file-invoice-dollar', description: 'Prepare the next milestone invoice draft for the selected client.' },
  { key: 'D', label: 'Open Google Tasks Checklist', action: 'Open Google Tasks Checklist', icon: 'fa-solid fa-tasks', description: 'Review the selected client’s task checklist.' },
  { key: 'Z', label: 'Oracle Scan / Sourcebook', action: 'Open Oracle', icon: 'fa-solid fa-eye', description: 'Open Oracle target intelligence and sourcebook tools.' },
  { key: 'X', label: 'Open Meeting Notes Doc', action: 'Open Meeting Notes Doc', icon: 'fa-solid fa-file-lines', description: 'Open the selected client’s meeting notes document.' },
  { key: 'C', label: 'Compliance Check', action: 'Compliance Check', icon: 'fa-solid fa-shield-halved', description: 'Audit the active client for required folders, docs, and provisioning gaps.' }
];
