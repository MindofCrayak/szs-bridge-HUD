import { ServiceComponent } from '../types';

export const SERVICE_REGISTRY: ServiceComponent[] = [
  {
    id: 'comp_dns_shield',
    name: 'DNS & DMARC Armor',
    category: 'INFRA',
    price: 1500,
    description: 'Autonomous SPF/DKIM/DMARC hardening, custom return paths, and Google Workspace routing.',
    tasksToInject: [
      'Audit existing Cloudflare/Route53 DNS records',
      'Generate 2048-bit DKIM selector keys',
      'Enforce DMARC p=reject quarantine policy',
    ],
    legalClauses: [
      'Client retains ownership of primary domain zone files.',
      'Provider is authorized to manage tactical records under sub-delegation.',
    ],
  },
  {
    id: 'comp_mcc_engine',
    name: 'MCC Autonomous Dispatch',
    category: 'GROWTH',
    price: 3200,
    description: 'Daisy Adare Mail Command Center broadcast pipeline with 10-step nurture queues.',
    tasksToInject: [
      'Calibrate transactional Google Group inbox aliases',
      'Deploy 10-stage milestone status templates',
      'Wire webhook listeners for Google Tasks triggers',
    ],
    legalClauses: [
      'Email volumes strictly governed by Google Workspace Enterprise sending limits.',
      'CAN-SPAM and GDPR zero-tolerance unsubscribe guarantees enabled.',
    ],
  },
  {
    id: 'comp_oracle_deepscan',
    name: 'Oracle Deep OSINT Core',
    category: 'AI',
    price: 2400,
    description: 'Executive digital fingerprinting, SEC filings review, and competitive vector matrix.',
    tasksToInject: [
      'Run OSINT public exposure scan on target executives',
      'Compile competitive case_file.json dossier',
      'Generate SWOT vector telemetry overlay',
    ],
    legalClauses: [
      'All OSINT gathers use strictly ethical, public-domain sources.',
      'Data quarantined within client-isolated Drive vault.',
    ],
  },
  {
    id: 'comp_gantt_symphony',
    name: 'Dolores Symphony 45-Day Gantt',
    category: 'DELIVERY',
    price: 2800,
    description: 'Real-time sprint dependency graph, Google Tasks sync, and blocker escalation.',
    tasksToInject: [
      'Establish 45-day milestone deliverables calendar',
      'Generate Google Tasks checklist for Phase 03/04',
      'Set automated 48-hour blocker escalation alert',
    ],
    legalClauses: [
      'Milestones tracked on 1/3 payment intervals.',
      'Deliverables verified via signed digital change order.',
    ],
  },
  {
    id: 'comp_iron_gate_legal',
    name: 'Pamela Iron Gate Legal Vault',
    category: 'LEGAL',
    price: 1800,
    description: 'Automated Master Services Agreement (MSA) and SOW generation with Drive containment.',
    tasksToInject: [
      'Generate client RootFolder and scoped sub-directories',
      'Provision bound Google Doc MSA with electronic execution block',
      'Bind SOW milestone deliverables and rate table',
    ],
    legalClauses: [
      'Strict intellectual property escrow until 100% final invoice clearance.',
      'Arbitration under DrakeCo LLC governing laws.',
    ],
  },
];
