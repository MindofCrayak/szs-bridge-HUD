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
  { key: 'S', label: 'Draft Invoice', action: 'Draft Invoice', icon: 'fa-solid fa-file-invoice-dollar', description: 'Prepare an invoice for the selected client.' },
  { key: 'D', label: 'Open Google Tasks', action: 'Open Google Tasks', icon: 'fa-solid fa-tasks', description: 'Review tasks for the selected client.' },
  { key: 'Z', label: 'Leave Blank/Disabled', action: 'Disabled', icon: 'fa-solid fa-ban', description: 'This shortcut is intentionally disabled.', disabled: true },
  { key: 'X', label: 'Open Meet Notes', action: 'Open Meet Notes', icon: 'fa-solid fa-file-lines', description: 'Open notes from the client meeting.' },
  { key: 'C', label: 'Generate Pitch Deck', action: 'Generate Pitch Deck', icon: 'fa-solid fa-file-powerpoint', description: 'Create a pitch deck for the selected client.' }
];
