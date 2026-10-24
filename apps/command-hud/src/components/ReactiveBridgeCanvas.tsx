import React from 'react';

interface ReactiveBridgeCanvasProps {
  /** Which sub-routine department is currently active/selected */
  activeDepartment?: string;
  /** Number of active (non-dismissed) alerts */
  alertsCount?: number;
}

const getAtmosphericGlow = (activeDepartment?: string, alertsCount = 0): string => {
  if (alertsCount > 0) {
    return 'radial-gradient(circle at 50% 0%, rgba(254, 95, 0, 0.12) 0%, transparent 70%)';
  }
  switch (activeDepartment) {
    case 'Oracle':
      return 'radial-gradient(circle at 70% 30%, rgba(8, 99, 117, 0.2) 0%, transparent 60%)';
    case 'Vala':
      return 'radial-gradient(circle at 50% 80%, rgba(224, 202, 60, 0.12) 0%, transparent 65%)';
    case 'Dolores':
      return 'radial-gradient(circle at 30% 50%, rgba(95, 15, 64, 0.2) 0%, transparent 60%)';
    case 'Pamela':
      return 'radial-gradient(circle at 20% 20%, rgba(221, 251, 208, 0.1) 0%, transparent 55%)';
    case 'Alfred':
      return 'radial-gradient(circle at 50% 50%, rgba(254, 95, 0, 0.06) 0%, transparent 50%)';
    default:
      return 'none';
  }
};

export const ReactiveBridgeCanvas: React.FC<ReactiveBridgeCanvasProps> = ({
  activeDepartment,
  alertsCount = 0,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic Atmospheric Tint */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{ background: getAtmosphericGlow(activeDepartment, alertsCount) }}
      />

      {/* Tactical Grid Lines (40px spacing, very subtle) */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #086375 1px, transparent 1px),
            linear-gradient(to bottom, #086375 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radar Sweep Ring (only when Oracle is active) */}
      {activeDepartment === 'Oracle' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-[800px] h-[800px] rounded-full border border-[#086375]/20 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
      )}

      {/* Alert Perimeter Strobe (only when alerts > 0) */}
      {alertsCount > 0 && (
        <div
          className="absolute inset-0 animate-pulse opacity-30"
          style={{
            animationDuration: '2s',
            boxShadow: 'inset 0 0 80px rgba(254, 95, 0, 0.15), inset 0 0 200px rgba(254, 95, 0, 0.05)',
          }}
        />
      )}

      {/* Coordinate Telemetry Watermark */}
      <div className="absolute bottom-3 right-4 font-mono text-[10px] text-[#086375]/30 select-none">
        SZS-HORIZON // 47°33&apos;56&quot;N 122°37&apos;44&quot;W // ELEVATION: 4,500 FT // TELEMETRY: NOMINAL
      </div>
    </div>
  );
};
