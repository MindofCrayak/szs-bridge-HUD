import React, { useState, useMemo } from 'react';
import { ClientUnit } from '../types';

interface MailCommandCenterViewProps {
  units: ClientUnit[];
  activeUnit: ClientUnit | null;
  onSelectUnit: (id: string) => void;
  onNavigateToDashboard: () => void;
  onLogTerminal: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

interface CampaignRecord {
  id: string;
  name: string;
  segment: string;
  splitTest: string;
  status: 'SENT' | 'SCHEDULED' | 'DRAFTING' | 'ACTIVE';
  sentDate: string;
  opens: number;
  openRate: number;
  clicks: number;
  clickRate: number;
  bounces: number;
}

interface DripStep {
  step: number;
  day: number;
  track: 'onboarding' | 'day30' | 'day90' | 'day365';
  title: string;
  subject: string;
  triggerEvent: string;
  status: 'ACTIVE' | 'PAUSED';
  openRate: number;
}

export const MailCommandCenterView: React.FC<MailCommandCenterViewProps> = ({
  units,
  activeUnit,
  onSelectUnit,
  onNavigateToDashboard,
  onLogTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'drips' | 'studio' | 'subscribers' | 'archive'>('campaigns');
  const currentClient = activeUnit || units[0] || null;

  // Tab 1: Campaigns Data
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([
    {
      id: 'CMP-2026-04',
      name: 'Q2 Strategy & Engineering Briefing',
      segment: 'All Active Clients (Stages 02–08)',
      splitTest: 'A/B: "Tactical Horizon" vs "Q2 Roadmap"',
      status: 'SENT',
      sentDate: '2026-04-12',
      opens: 142,
      openRate: 64.8,
      clicks: 89,
      clickRate: 40.6,
      bounces: 0,
    },
    {
      id: 'CMP-2026-03',
      name: 'The Iron Gate: Financial Automation Playbook',
      segment: 'VIP & Inception Tier',
      splitTest: 'Direct vs Curiosity Subject',
      status: 'SENT',
      sentDate: '2026-03-28',
      opens: 98,
      openRate: 72.1,
      clicks: 64,
      clickRate: 47.0,
      bounces: 1,
    },
    {
      id: 'CMP-2026-05',
      name: 'Mid-Year Architecture Recalibration',
      segment: 'Retainer & Sunset Alumni',
      splitTest: 'Executive Briefing Format',
      status: 'SCHEDULED',
      sentDate: '2026-05-01',
      opens: 0,
      openRate: 0,
      clicks: 0,
      clickRate: 0,
      bounces: 0,
    },
  ]);

  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
  const [newBroadcastSubject, setNewBroadcastSubject] = useState('');
  const [newBroadcastSegment, setNewBroadcastSegment] = useState('All Active Clients');

  // Tab 2: Drips Data
  const [selectedTrack, setSelectedTrack] = useState<'onboarding' | 'day30' | 'day90' | 'day365'>('onboarding');
  const dripSteps: DripStep[] = [
    // Onboarding
    { step: 1, day: 0, track: 'onboarding', title: 'Welcome to the Airship', subject: 'Welcome to Session Zero: Your Sanctum Credentials & Google Chat Space', triggerEvent: 'Graduation to Stage 02 / Deposit Paid', status: 'ACTIVE', openRate: 88.5 },
    { step: 2, day: 3, track: 'onboarding', title: 'Tactical Communication Protocols', subject: 'Inside the War Room: Google Chat & Asynchronous Approvals', triggerEvent: '3 Days After Welcome', status: 'ACTIVE', openRate: 76.2 },
    { step: 3, day: 7, track: 'onboarding', title: 'Sprint 1 Inception Briefing', subject: 'Liftoff Readiness: Your First Milestone Architecture Review', triggerEvent: '7 Days Post-Onboarding', status: 'ACTIVE', openRate: 71.4 },
    { step: 4, day: 14, track: 'onboarding', title: 'Executive Operations Velocity', subject: 'The 45-Day Horizon: Mid-Flight Velocity & Scope Baseline', triggerEvent: '14 Days Post-Onboarding', status: 'ACTIVE', openRate: 68.0 },
    // Day 30
    { step: 5, day: 30, track: 'day30', title: '30-Day Velocity Audit', subject: '30 Days In Flight: System Health & Velocity Metrics', triggerEvent: '30 Days Post-Kickoff', status: 'ACTIVE', openRate: 64.0 },
    { step: 6, day: 35, track: 'day30', title: 'Mid-Sprint Feedback Loop', subject: 'Quick Pulse: How is the Airship Command cadence feeling?', triggerEvent: '35 Days Post-Kickoff', status: 'ACTIVE', openRate: 59.2 },
    // Day 90
    { step: 7, day: 90, track: 'day90', title: 'Quarterly Retainer Horizon', subject: 'Q2 Strategy: Unlocking the Retainer Tier & Ongoing Velocity', triggerEvent: 'Stage 08 Handover or Day 90', status: 'ACTIVE', openRate: 62.5 },
    { step: 8, day: 105, track: 'day90', title: 'Architectural Expansion Scope', subject: 'Next Chapter: Expanding Google Workspace Integrations', triggerEvent: '15 Days Post-Handover', status: 'ACTIVE', openRate: 55.0 },
    // Day 365
    { step: 9, day: 365, track: 'day365', title: 'Annual Retrospective & Health Check', subject: '365 Days Since Liftoff: System Maintenance & Security Review', triggerEvent: '1 Year Post-Graduation', status: 'ACTIVE', openRate: 78.4 },
  ];

  // Tab 3: Template Studio State
  const [templateGoal, setTemplateGoal] = useState<'onboarding' | 'milestone' | 'retainer' | 'blocker' | 'briefing'>('milestone');
  const [selectedSubjectVariant, setSelectedSubjectVariant] = useState(0);

  const templateVariants = useMemo(() => {
    switch (templateGoal) {
      case 'onboarding':
        return {
          subjects: [
            'Direct: Session Zero Airship Access & Sanctum Folder Ready',
            'Curiosity: Your operational directives are staged inside the War Room',
            'Executive: Session Zero Solutions // Client Inception Credentials',
          ],
          previewBody: `Greetings ${currentClient?.primaryContact || 'Partner'},

We are thrilled to officially welcome ${currentClient?.companyName || 'your organization'} to the Session Zero Airship. 

Your dedicated Google Workspace Sanctum directory and war room chat channels have been provisioned under ID ${currentClient?.id || 'SZS-CLI'}.

1. Google Drive Sanctum: Ready for shared asset drops.
2. Meeting Notes Doc: Pre-formatted for all synchronous sprints.
3. Chat Delegation Space: Active for asynchronous operational pings.

Liftoff protocol initiates Monday 09:00 EST.`,
        };
      case 'milestone':
        return {
          subjects: [
            'Direct: Milestone ${currentClient?.completedMilestones || 1} Delivered & Staged for Review',
            'Executive: Sprint Milestone Completion Notice // ${currentClient?.companyName || "Client"}',
            'Curiosity: The next delivery phase is live — review preview links inside',
          ],
          previewBody: `Hello ${currentClient?.primaryContact || 'Team'},

We have officially concluded Milestone ${currentClient?.completedMilestones || 1} for ${currentClient?.companyName || 'your project'}.

Highlights delivered this cycle:
• Central router logic compiled and deployed
• Pipeline state synced to Master Control SSOT
• Google Chat interactive notification cards verified

Please inspect the staging preview in your Sanctum drive. Once approved, Vala will stage Milestone Invoice #${(currentClient?.completedMilestones || 1) + 1}.`,
        };
      case 'retainer':
        return {
          subjects: [
            'Executive: Preserving Strategic Velocity // Post-Liftoff Retainer Architecture',
            'Direct: Retainer Roadmap & Continued Workspace Maintenance for ${currentClient?.companyName || "Your Team"}',
            'Curiosity: What happens when the 45-day sprint concludes?',
          ],
          previewBody: `Dear ${currentClient?.primaryContact || 'Executive'},

As we approach Stage 08 (Liftoff) for ${currentClient?.companyName || 'your system'}, we want to ensure zero deceleration in your operational tempo.

Our Retainer Architecture tier provides:
- Continuous Google Workspace script and permission maintenance
- 15-minute SLA on blocker resolution via Alfred Police triggers
- Monthly OSINT competitive updates curated by Oracle

Let's schedule a 15-minute briefing to align on your post-launch cadence.`,
        };
      case 'blocker':
        return {
          subjects: [
            'Urgent: Operational Pebble Identified // Action Needed for ${currentClient?.companyName || "Sprint"}',
            'Direct: Blocker Notice: Outstanding Deposit or Missing SOW Gate',
            'Executive: Action Required: Session Zero Iron Gate Halt',
          ],
          previewBody: `Attention ${currentClient?.primaryContact || 'Lead'},

Our police audit has flagged an operational gate requirement currently halting progression into the next delivery stage:

Status: Gate blocked
Item: ${currentClient?.activePebble || 'Deposit or signed agreement pending verification'}
Client: ${currentClient?.companyName || currentClient?.id}

Please address the outstanding item or reply to this transmission so Dolores can clear the sprint runway.`,
        };
      case 'briefing':
      default:
        return {
          subjects: [
            'Executive: Monthly Airship Operations & Delivery Dispatch',
            'Direct: SZS Command Briefing: Architecture updates and pipeline velocity',
            'Curiosity: Inside the Airship: How we orchestrate 10-stage delivery',
          ],
          previewBody: `Greetings from the Airship Command Bridge,

Here is your monthly summary of system developments, automation blueprints, and workspace governance upgrades from Session Zero Solutions.

Current Fleet Status:
• All Inception Gates guarded with 30s LockService concurrency controls
• Mail Command Center operating with zero third-party telemetry
• Google Cloud OAuth client scopes fully synced

Thank you for partnering with Session Zero Solutions.`,
        };
    }
  }, [templateGoal, currentClient]);

  // Tab 4: Subscriber Matrix Data
  const [subscriberFilter, setSubscriberFilter] = useState('');
  const subscribers = useMemo(() => {
    return units.map((u, i) => ({
      id: u.id,
      name: u.primaryContact || u.name,
      company: u.companyName || u.name,
      email: u.contactEmail || `contact@${u.id.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      stage: u.pipelineStage,
      tag: i % 3 === 0 ? 'VIP Inception' : i % 2 === 0 ? 'Active Sprint' : 'Retainer Alumni',
      tier: u.contractValue > 15000 ? 'Diamond Tier' : u.contractValue > 7000 ? 'Velocity Tier' : 'Standard Tier',
      openRate: `${Math.floor(55 + (i * 7) % 40)}%`,
      health: '100% Valid (DKIM/SPF Passed)',
    })).filter((s) => {
      const q = subscriberFilter.toLowerCase();
      return !q || s.name.toLowerCase().includes(q) || s.company.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.tag.toLowerCase().includes(q);
    });
  }, [units, subscriberFilter]);

  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcastSubject.trim()) return;

    const newCamp: CampaignRecord = {
      id: `CMP-${Date.now().toString().slice(-4)}`,
      name: newBroadcastSubject,
      segment: newBroadcastSegment,
      splitTest: 'Automated 50/50 Subject Variant',
      status: 'SCHEDULED',
      sentDate: new Date().toISOString().split('T')[0],
      opens: 0,
      openRate: 0,
      clicks: 0,
      clickRate: 0,
      bounces: 0,
    };
    setCampaigns([newCamp, ...campaigns]);
    setIsNewBroadcastOpen(false);
    setNewBroadcastSubject('');
    onLogTerminal(`Campaign "${newCamp.name}" scheduled for ${newBroadcastSegment} via Mail Command Center.`, 'action');
  };

  const sunsetClients = units.filter((u) => u.pipelineStage?.includes('09') || u.pipelineStage?.toLowerCase().includes('sunset'));

  return (
    <main className="flex-1 min-h-0 flex flex-col bg-bg-obsidian text-text-mana p-4 sm:p-6 overflow-y-auto">
      {/* Header with Anti-Slop Title and 3-Zone Contract */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-accent-teal/60 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-mana/70 font-mono">
            <span>Daisy Sub-Routine</span>
            <span aria-hidden="true">·</span>
            <span>Mail Command Center (MCC)</span>
            <span aria-hidden="true">·</span>
            <span className="text-highlight-gold">Self-Hosted Drip &amp; Broadcast Engine</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-mana mt-1">
            Mail Command Center &amp; Retention Matrix
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNewBroadcastOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-highlight-gold bg-highlight-gold px-3.5 py-1.5 font-display text-xs font-bold text-bg-obsidian hover:bg-highlight-gold/90 transition-colors shadow-sm"
          >
            <i className="fa-solid fa-paper-plane" />
            <span>Launch Broadcast</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="flex items-center gap-1.5 rounded-lg border border-accent-teal px-3 py-1.5 font-display text-xs text-text-mana hover:bg-accent-teal/20 transition-colors"
          >
            <i className="fa-solid fa-diagram-project" />
            <span>Tactical Horizon</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 font-mono">
        <div className="rounded-lg border border-accent-teal/50 bg-primary-plum/30 p-3">
          <span className="text-[0.65rem] uppercase text-text-mana/70 block">Total Broadcasts</span>
          <span className="font-display text-lg font-bold text-text-mana tabular-nums">28 Dispatched</span>
        </div>
        <div className="rounded-lg border border-accent-teal/50 bg-primary-plum/30 p-3">
          <span className="text-[0.65rem] uppercase text-text-mana/70 block">Average Open Rate</span>
          <span className="font-display text-lg font-bold text-highlight-gold tabular-nums">67.4%</span>
        </div>
        <div className="rounded-lg border border-accent-teal/50 bg-primary-plum/30 p-3">
          <span className="text-[0.65rem] uppercase text-text-mana/70 block">Click-Through Ratio</span>
          <span className="font-display text-lg font-bold text-text-mana tabular-nums">42.8%</span>
        </div>
        <div className="rounded-lg border border-accent-teal/50 bg-primary-plum/30 p-3">
          <span className="text-[0.65rem] uppercase text-text-mana/70 block">Daily Quota Reserve</span>
          <span className="font-display text-lg font-bold text-highlight-gold tabular-nums">1,940 / 2,000</span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap gap-1 mb-4 p-1 rounded-lg border border-accent-teal/40 bg-bg-obsidian/80 font-mono text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'campaigns'
              ? 'bg-primary-plum text-highlight-gold font-bold shadow-sm border border-highlight-gold/50'
              : 'text-text-mana/70 hover:text-text-mana'
          }`}
        >
          <i className="fa-solid fa-bullhorn mr-1.5" />
          Campaigns &amp; Broadcasts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('drips')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'drips'
              ? 'bg-primary-plum text-highlight-gold font-bold shadow-sm border border-highlight-gold/50'
              : 'text-text-mana/70 hover:text-text-mana'
          }`}
        >
          <i className="fa-solid fa-timeline mr-1.5" />
          Drip Sequences (30/90/365)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'studio'
              ? 'bg-primary-plum text-highlight-gold font-bold shadow-sm border border-highlight-gold/50'
              : 'text-text-mana/70 hover:text-text-mana'
          }`}
        >
          <i className="fa-solid fa-pen-nib mr-1.5" />
          The Template Studio
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subscribers')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'subscribers'
              ? 'bg-primary-plum text-highlight-gold font-bold shadow-sm border border-highlight-gold/50'
              : 'text-text-mana/70 hover:text-text-mana'
          }`}
        >
          <i className="fa-solid fa-users mr-1.5" />
          Subscriber Matrix ({units.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('archive')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'archive'
              ? 'bg-primary-plum text-highlight-gold font-bold shadow-sm border border-highlight-gold/50'
              : 'text-text-mana/70 hover:text-text-mana'
          }`}
        >
          <i className="fa-solid fa-box-archive mr-1.5" />
          Grand Archive &amp; Sunset ({sunsetClients.length})
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS & BROADCASTS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-accent-teal/50 bg-primary-plum/20 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-accent-teal/30 pb-2">
              <h2 className="font-display text-sm font-bold text-highlight-gold uppercase tracking-wider">
                Active &amp; Scheduled Email Broadcasts
              </h2>
              <span className="font-mono text-xs text-text-mana/60">SELF-HOSTED GMAIL WORKSPACE ROUTER</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-accent-teal/40 text-[0.68rem] text-text-mana/60 uppercase">
                    <th className="py-2.5 px-3">Campaign Name &amp; ID</th>
                    <th className="py-2.5 px-3">Target Segment</th>
                    <th className="py-2.5 px-3">Split Test</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Opens</th>
                    <th className="py-2.5 px-3 text-right">Open Rate</th>
                    <th className="py-2.5 px-3 text-right">Click Rate</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent-teal/20">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-primary-plum/40 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-text-mana block">{camp.name}</span>
                        <span className="text-[0.65rem] text-text-mana/60">{camp.id} · {camp.sentDate}</span>
                      </td>
                      <td className="py-3 px-3 text-text-mana/80">{camp.segment}</td>
                      <td className="py-3 px-3 text-text-mana/70 text-[0.68rem]">{camp.splitTest}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[0.62rem] font-bold ${
                          camp.status === 'SENT'
                            ? 'bg-text-mana/20 text-text-mana'
                            : camp.status === 'SCHEDULED'
                            ? 'bg-highlight-gold/20 text-highlight-gold'
                            : 'bg-accent-teal/20 text-accent-teal'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">{camp.opens}</td>
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-highlight-gold">
                        {camp.openRate > 0 ? `${camp.openRate}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        {camp.clickRate > 0 ? `${camp.clickRate}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onLogTerminal(`Campaign report downloaded for ${camp.id}.`, 'action')}
                          className="px-2 py-1 rounded border border-accent-teal text-[0.65rem] text-text-mana hover:bg-accent-teal/20"
                        >
                          Telemetry
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DRIP SEQUENCES */}
      {activeTab === 'drips' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-accent-teal/50 bg-primary-plum/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-accent-teal/30 pb-3">
              <div>
                <h2 className="font-display text-sm font-bold text-highlight-gold uppercase tracking-wider">
                  Automated Lifecycle Drip Tracks
                </h2>
                <p className="font-mono text-xs text-text-mana/70">
                  Event-driven client retention &amp; milestone check-in sequences
                </p>
              </div>

              {/* Track Selector */}
              <div className="flex gap-1.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedTrack('onboarding')}
                  className={`px-3 py-1 rounded border transition-colors ${
                    selectedTrack === 'onboarding'
                      ? 'border-highlight-gold bg-highlight-gold/20 text-highlight-gold font-bold'
                      : 'border-accent-teal/40 text-text-mana/70 hover:text-text-mana'
                  }`}
                >
                  Onboarding (0–14 Days)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTrack('day30')}
                  className={`px-3 py-1 rounded border transition-colors ${
                    selectedTrack === 'day30'
                      ? 'border-highlight-gold bg-highlight-gold/20 text-highlight-gold font-bold'
                      : 'border-accent-teal/40 text-text-mana/70 hover:text-text-mana'
                  }`}
                >
                  Day 30 Velocity
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTrack('day90')}
                  className={`px-3 py-1 rounded border transition-colors ${
                    selectedTrack === 'day90'
                      ? 'border-highlight-gold bg-highlight-gold/20 text-highlight-gold font-bold'
                      : 'border-accent-teal/40 text-text-mana/70 hover:text-text-mana'
                  }`}
                >
                  Day 90 Retainer
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTrack('day30')}
                  className={`px-3 py-1 rounded border transition-colors ${
                    selectedTrack === 'day365'
                      ? 'border-highlight-gold bg-highlight-gold/20 text-highlight-gold font-bold'
                      : 'border-accent-teal/40 text-text-mana/70 hover:text-text-mana'
                  }`}
                >
                  Day 365 Grand Archive
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {dripSteps.filter((s) => s.track === selectedTrack).map((step) => (
                <div
                  key={step.step}
                  className="rounded-lg border border-accent-teal/40 bg-bg-obsidian p-3.5 font-mono text-xs flex flex-wrap items-center justify-between gap-3 hover:border-accent-teal transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-highlight-gold/50 bg-primary-plum text-highlight-gold font-bold">
                      {step.step}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-mana">{step.title}</span>
                        <span className="text-[0.65rem] text-text-mana/60">Day {step.day}</span>
                      </div>
                      <p className="text-text-mana/80 text-[0.7rem] mt-0.5">
                        Subject: &ldquo;{step.subject}&rdquo;
                      </p>
                      <span className="text-[0.62rem] text-accent-teal block mt-1">
                        Trigger: {step.triggerEvent}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[0.6rem] uppercase text-text-mana/50 block">Avg Open</span>
                      <span className="font-bold text-highlight-gold tabular-nums">{step.openRate}%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onLogTerminal(`Drip step #${step.step} template preview rendered for ${currentClient?.id}.`, 'action')}
                      className="px-2.5 py-1 rounded border border-accent-teal text-[0.65rem] text-text-mana hover:bg-accent-teal/20"
                    >
                      Preview HTML
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: THE TEMPLATE STUDIO */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Controls & Variant Generator */}
          <div className="rounded-xl border border-accent-teal/50 bg-primary-plum/20 p-4 space-y-4">
            <div className="border-b border-accent-teal/30 pb-2">
              <h2 className="font-display text-sm font-bold text-highlight-gold uppercase tracking-wider">
                The Template Studio (Oracle AI &amp; Daisy COMS)
              </h2>
              <p className="font-mono text-xs text-text-mana/70">
                Generate high-converting transactional copy, responsive HTML layouts, and subject variants.
              </p>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase text-text-mana/70 mb-1.5">
                Communication Goal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-xs">
                {(['onboarding', 'milestone', 'retainer', 'blocker', 'briefing'] as const).map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => {
                      setTemplateGoal(goal);
                      setSelectedSubjectVariant(0);
                    }}
                    className={`py-1.5 px-2 rounded border capitalize text-left transition-colors ${
                      templateGoal === goal
                        ? 'border-highlight-gold bg-highlight-gold/20 text-highlight-gold font-bold'
                        : 'border-accent-teal/40 text-text-mana/70 hover:text-text-mana'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Subject Line Variants */}
            <div>
              <label className="block font-mono text-xs uppercase text-text-mana/70 mb-1.5">
                3 Subject Line Split Variants (Click to select for preview)
              </label>
              <div className="space-y-2">
                {templateVariants.subjects.map((subj, index) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSelectedSubjectVariant(index)}
                    className={`w-full p-2.5 rounded-lg border text-left font-mono text-xs transition-colors ${
                      selectedSubjectVariant === index
                        ? 'border-highlight-gold bg-primary-plum text-highlight-gold font-semibold shadow-sm'
                        : 'border-accent-teal/40 bg-bg-obsidian text-text-mana/80 hover:border-accent-teal'
                    }`}
                  >
                    <span className="text-[0.62rem] text-accent-teal block mb-0.5">Variant {index + 1}</span>
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(templateVariants.previewBody);
                  onLogTerminal('Template HTML copy written to clipboard.', 'action');
                }}
                className="flex-1 py-2 rounded-lg border border-accent-teal bg-primary-plum/50 font-display text-xs text-text-mana hover:bg-accent-teal/20"
              >
                <i className="fa-solid fa-copy mr-1.5" />
                Copy Raw Markdown
              </button>
              <button
                type="button"
                onClick={() => onLogTerminal(`Test transmission dispatched to admin mailbox for ${currentClient?.id}.`, 'server')}
                className="flex-1 py-2 rounded-lg border border-highlight-gold bg-highlight-gold font-display text-xs font-bold text-bg-obsidian hover:bg-highlight-gold/90"
              >
                <i className="fa-solid fa-paper-plane mr-1.5" />
                Send Test to Me
              </button>
            </div>
          </div>

          {/* Live Email Preview Box */}
          <div className="rounded-xl border border-accent-teal/50 bg-bg-obsidian p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-accent-teal/30 pb-2 mb-3">
              <span className="font-mono text-xs text-text-mana/60 uppercase">Live Responsive Preview</span>
              <span className="font-mono text-[0.65rem] text-highlight-gold">HTML / INLINE STYLED</span>
            </div>

            <div className="flex-1 rounded-lg border border-accent-teal/30 bg-[#081510] p-4 text-text-mana font-body text-xs space-y-3 leading-relaxed">
              <div className="border-b border-accent-teal/20 pb-2 font-mono text-[0.7rem] text-text-mana/60">
                <div><span className="text-text-mana/40">From:</span> Drake &lt;drake@sessionzero.solutions&gt;</div>
                <div><span className="text-text-mana/40">To:</span> {currentClient?.primaryContact || 'Client'} &lt;{currentClient?.contactEmail || 'client@example.com'}&gt;</div>
                <div className="text-highlight-gold font-bold mt-1">
                  <span className="text-text-mana/40">Subject:</span> {templateVariants.subjects[selectedSubjectVariant]}
                </div>
              </div>

              <div className="whitespace-pre-line text-sm text-text-mana/90">
                {templateVariants.previewBody}
              </div>

              <div className="pt-4 border-t border-accent-teal/20 font-mono text-[0.65rem] text-text-mana/50">
                Session Zero Solutions · Workspace Architecture &amp; Delivery · Airship Bridge Command
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIBER MATRIX */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-accent-teal/50 bg-primary-plum/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-accent-teal/30 pb-2">
              <div>
                <h2 className="font-display text-sm font-bold text-highlight-gold uppercase tracking-wider">
                  Client &amp; Stakeholder Subscriber Matrix
                </h2>
                <p className="font-mono text-xs text-text-mana/70">
                  Synced directly from Google Contacts label &ldquo;SZS-Clients&rdquo; and Master Control DB
                </p>
              </div>

              <input
                type="search"
                placeholder="Filter by contact, company, or tag..."
                value={subscriberFilter}
                onChange={(e) => setSubscriberFilter(e.target.value)}
                className="w-64 rounded border border-accent-teal bg-bg-obsidian px-2.5 py-1.5 font-mono text-xs text-text-mana placeholder:text-text-mana/40 focus:border-highlight-gold focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-accent-teal/40 text-[0.68rem] text-text-mana/60 uppercase">
                    <th className="py-2.5 px-3">Contact Name</th>
                    <th className="py-2.5 px-3">Company / ClientID</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Segment Tag</th>
                    <th className="py-2.5 px-3">Tier</th>
                    <th className="py-2.5 px-3 text-right">Avg Open</th>
                    <th className="py-2.5 px-3 text-right">Deliverability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent-teal/20">
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-primary-plum/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-text-mana">{sub.name}</td>
                      <td className="py-3 px-3">
                        <span className="text-text-mana block">{sub.company}</span>
                        <span className="text-[0.65rem] text-highlight-gold">{sub.id}</span>
                      </td>
                      <td className="py-3 px-3 text-text-mana/80">{sub.email}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-primary-plum border border-accent-teal/40 text-[0.65rem] text-text-mana">
                          {sub.tag}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-highlight-gold font-semibold">{sub.tier}</td>
                      <td className="py-3 px-3 text-right tabular-nums">{sub.openRate}</td>
                      <td className="py-3 px-3 text-right text-text-mana text-[0.68rem]">
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <i className="fa-solid fa-circle-check text-[0.55rem]" />
                          {sub.health}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GRAND ARCHIVE & SUNSET */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-accent-teal/50 bg-primary-plum/20 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-accent-teal/30 pb-2">
              <h2 className="font-display text-sm font-bold text-highlight-gold uppercase tracking-wide">
                Stage 09: Sunset / Retainer Master Archive
              </h2>
              <span className="font-mono text-xs text-text-mana/60">IMMUTABLE ARCHIVE (NO HARD DELETIONS)</span>
            </div>

            {sunsetClients.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-text-mana/60">
                <p>No client units are currently archived in Stage 09: Sunset / Retainer.</p>
                <p className="mt-2 text-accent-teal">Use the right-click card menu on the Tactical Canvas to Soft-Archive clients.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sunsetClients.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-accent-teal/50 bg-bg-obsidian font-mono text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-highlight-gold">{c.companyName || c.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-primary-plum text-text-mana text-[0.6rem]">{c.id}</span>
                    </div>
                    <p className="text-[0.68rem] text-text-mana/70">Contact: {c.primaryContact || 'Unspecified'}</p>
                    <p className="text-[0.68rem] text-text-mana/70">Service: {c.serviceArea || c.archetype}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectUnit(c.id)}
                        className="px-2 py-1 rounded border border-accent-teal text-[0.65rem] text-text-mana hover:bg-accent-teal/20"
                      >
                        Inspect Dossier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Launch Broadcast */}
      {isNewBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-obsidian/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-accent-teal bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-6 text-text-mana shadow-2xl">
            <div className="flex items-center justify-between border-b border-accent-teal/40 pb-3 mb-4">
              <h3 className="font-display text-base font-bold text-highlight-gold">
                Draft New Email Broadcast
              </h3>
              <button
                type="button"
                onClick={() => setIsNewBroadcastOpen(false)}
                className="text-text-mana/60 hover:text-alert-orange"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleLaunchCampaign} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block mb-1 text-text-mana/80 uppercase text-[0.65rem]">Broadcast Title / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q2 Systems Update: New Automation Protocols"
                  value={newBroadcastSubject}
                  onChange={(e) => setNewBroadcastSubject(e.target.value)}
                  className="w-full rounded border border-accent-teal bg-bg-obsidian px-3 py-2 text-text-mana focus:border-highlight-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-text-mana/80 uppercase text-[0.65rem]">Target Audience Segment</label>
                <select
                  value={newBroadcastSegment}
                  onChange={(e) => setNewBroadcastSegment(e.target.value)}
                  className="w-full rounded border border-accent-teal bg-bg-obsidian px-3 py-2 text-text-mana focus:border-highlight-gold focus:outline-none"
                >
                  <option value="All Active Clients">All Active Clients (Stages 02–08)</option>
                  <option value="VIP & Inception Tier">VIP &amp; Inception Tier Only</option>
                  <option value="Retainer & Sunset Alumni">Retainer &amp; Sunset Alumni</option>
                  <option value="Single Active Client">Currently Selected Client Only</option>
                </select>
              </div>

              <div className="p-3 rounded bg-primary-plum/30 border border-accent-teal/30 text-[0.68rem] text-text-mana/80">
                <i className="fa-solid fa-shield-halved text-highlight-gold mr-1.5" />
                Outgoing queue is guarded by the 30-second LockService concurrency guard. Quota remains under 1,900/day.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewBroadcastOpen(false)}
                  className="px-4 py-2 rounded border border-accent-teal text-text-mana hover:bg-accent-teal/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded border border-highlight-gold bg-highlight-gold font-display text-xs font-bold text-bg-obsidian hover:bg-highlight-gold/90"
                >
                  Schedule Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
