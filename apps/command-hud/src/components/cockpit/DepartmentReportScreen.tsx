import React from 'react';

export const DepartmentReportScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4 font-mono text-xs text-[#DDFBD0] custom-scrollbar">
      {/* Dolores Herbig: Sprint Velocity & Burn-Down Runway */}
      <section className="rounded-xl border border-[#086375] bg-[#020500]/80 p-3.5 shadow-md">
        <div className="flex items-center justify-between border-b border-[#086375]/50 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#5F0F40]" />
            <h3 className="font-display font-bold text-xs uppercase text-[#E0CA3C]">
              Dolores Core // Sprint Burn-Down Runway
            </h3>
          </div>
          <span className="text-[0.6rem] text-[#FE5F00] font-bold">45-DAY CADENCE</span>
        </div>
        <div className="space-y-2 text-[0.68rem]">
          <div className="flex justify-between items-center p-2 rounded bg-[#086375]/10 border border-[#086375]/30">
            <span>TKG-01: Rulebook Fulfillment Pipeline</span>
            <span className="text-[#E0CA3C] font-bold">Stage 05 (Day 18/45)</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-[#086375]/10 border border-[#086375]/30">
            <span>MAC-01: Systems Architecture Discovery</span>
            <span className="text-[#DDFBD0] font-bold">Stage 04 (Day 06/45)</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-[#086375]/10 border border-[#086375]/30">
            <span>IRS-01: Mobilization Deposit Settlement</span>
            <span className="text-[#FE5F00] font-bold">Stage 02 (Awaiting Wire)</span>
          </div>
        </div>
      </section>

      {/* Oracle OSINT: Real-Time Footprint Wirefeed & Vulnerability Log */}
      <section className="rounded-xl border border-[#086375] bg-[#020500]/80 p-3.5 shadow-md">
        <div className="flex items-center justify-between border-b border-[#086375]/50 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#086375]" />
            <h3 className="font-display font-bold text-xs uppercase text-[#086375]">
              Oracle OSINT // Competitive Vulnerability Wire
            </h3>
          </div>
          <span className="text-[0.6rem] text-[#086375] font-bold">LIVE RADAR</span>
        </div>
        <div className="space-y-1.5 text-[0.65rem] text-[#DDFBD0]/80">
          <div className="p-2 rounded bg-[#086375]/10 border border-[#086375]/30">
            <span className="text-[#FE5F00] font-bold">[VULNERABILITY]</span> 2 competing TTRPG fulfillment hubs reported API downtime. Opportunity flagged.
          </div>
          <div className="p-2 rounded bg-[#086375]/10 border border-[#086375]/30">
            <span className="text-[#E0CA3C] font-bold">[IP CRAWL]</span> Case files verified across 4 target domains. Zero credential leaks.
          </div>
        </div>
      </section>

      {/* Vala Mal Doran: Milestone Billing Reconciliation Ledger */}
      <section className="rounded-xl border border-[#086375] bg-[#020500]/80 p-3.5 shadow-md">
        <div className="flex items-center justify-between border-b border-[#086375]/50 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E0CA3C]" />
            <h3 className="font-display font-bold text-xs uppercase text-[#E0CA3C]">
              Vala Ledger // Cash Velocity & Milestones
            </h3>
          </div>
          <span className="text-[0.6rem] text-[#E0CA3C] font-bold">1/3RD FORMULA</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[0.68rem]">
          <div className="p-2 rounded bg-[#E0CA3C]/10 border border-[#E0CA3C]/40 text-center">
            <div className="text-[0.58rem] text-[#DDFBD0]/60">PIPELINE TOTAL</div>
            <div className="text-sm font-bold text-[#E0CA3C] mt-0.5">$146,200</div>
          </div>
          <div className="p-2 rounded bg-[#FE5F00]/10 border border-[#FE5F00]/40 text-center">
            <div className="text-[0.58rem] text-[#DDFBD0]/60">INCEPTION GATED</div>
            <div className="text-sm font-bold text-[#FE5F00] mt-0.5">$24,000</div>
          </div>
        </div>
      </section>
    </div>
  );
};
