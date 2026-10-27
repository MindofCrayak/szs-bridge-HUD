import React from 'react';

interface PortProps {
  id: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  isConnecting?: boolean;
  onPortClick?: (portId: string, position: string) => void;
}

export const ConnectionPort: React.FC<PortProps> = ({ id, position, onPortClick }) => {
  const posClasses = {
    top: '-top-1.5 left-1/2 -translate-x-1/2',
    bottom: '-bottom-1.5 left-1/2 -translate-x-1/2',
    left: '-left-1.5 top-1/2 -translate-y-1/2',
    right: '-right-1.5 top-1/2 -translate-y-1/2',
  };

  return (
    <div
      data-port-id={id}
      data-port-pos={position}
      onClick={(e) => {
        e.stopPropagation();
        onPortClick?.(id, position);
      }}
      className={`absolute w-3 h-3 rounded-full bg-[#020500] border-2 border-[#086375] hover:border-[#E0CA3C] hover:scale-125 transition-all cursor-crosshair z-30 ${posClasses[position]}`}
      title={`Connect Port (${position})`}
    >
      <div className="w-1 h-1 rounded-full bg-[#086375] hover:bg-[#E0CA3C] m-auto mt-0.5" />
    </div>
  );
};
