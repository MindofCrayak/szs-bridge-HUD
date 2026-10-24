import React, { useState } from 'react';

export const HologramDropChutePod: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setDroppedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="relative">
      {/* 30px Radial Corner Hologram Pod */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-40 h-16 flex items-center justify-center p-2 border transition-all cursor-pointer select-none ${
          isDragOver
            ? 'border-[#086375] bg-[#086375]/30 shadow-[0_0_20px_#086375] animate-pulse'
            : 'border-[#086375]/70 bg-[#020500]/90 hover:border-[#E0CA3C]'
        }`}
        style={{
          borderBottomRightRadius: '30px', // Distinctive 30px radial corner inset
        }}
      >
        {isDragOver ? (
          <div className="font-mono text-center text-xs font-bold text-[#DDFBD0] tracking-wider animate-bounce">
            FEED THE ARCHIVE
          </div>
        ) : (
          <div className="flex items-center gap-2 font-mono">
            <div className="h-7 w-7 rounded-full bg-[#5F0F40] border border-[#E0CA3C] flex items-center justify-center text-[0.65rem] text-[#E0CA3C] font-bold shadow-[0_0_8px_rgba(224,202,60,0.4)]">
              HZ
            </div>
            <div className="text-left">
              <div className="text-[0.62rem] font-bold text-[#E0CA3C]">DROP CHUTE</div>
              <div className="text-[0.52rem] text-[#DDFBD0]/60">DRAG ASSET HERE</div>
            </div>
          </div>
        )}
      </div>

      {/* Drop Intercept Routing Modal */}
      {droppedFile && (
        <div className="absolute bottom-20 right-0 w-80 rounded-xl border border-[#086375] bg-[#020500]/95 backdrop-blur-md p-4 shadow-[0_12px_32px_rgba(0,0,0,0.9)] z-50 font-mono text-xs text-[#DDFBD0] animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#086375]/40 pb-2 mb-3">
            <span className="font-bold text-[#E0CA3C] text-[0.7rem] uppercase">
              Sanctum Ingest Intercept
            </span>
            <button 
              onClick={() => setDroppedFile(null)}
              className="text-[#FE5F00] hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="text-[0.68rem] text-[#DDFBD0]/80 mb-2">
            File caught: <span className="text-[#E0CA3C] font-bold">{droppedFile.name}</span> ({(droppedFile.size / 1024).toFixed(1)} KB)
          </p>

          <label className="text-[0.6rem] text-[#086375] block uppercase mb-1">
            Target Destination:
          </label>
          <select className="w-full bg-[#020500] border border-[#086375] rounded px-2 py-1 text-xs text-[#DDFBD0] mb-3 focus:outline-none focus:border-[#E0CA3C]">
            <option>Target: Tuesday Knight Games (TKG-01)</option>
            <option>Target: Melsonian Arts Council (MAC-01)</option>
            <option>Target: Ironclad Roofing & Solar (IRS-01)</option>
            <option>Internal: SZS Architecture & Sprint Archive</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => {
                alert(`File "${droppedFile.name}" routed to Sanctum Drive via Google Drive API.`);
                setDroppedFile(null);
              }}
              className="flex-1 py-1.5 rounded bg-[#086375] text-[#DDFBD0] font-bold text-xs hover:bg-[#FE5F00] transition-colors cursor-pointer"
            >
              DISPATCH TO SANCTUM
            </button>
            <button
              onClick={() => setDroppedFile(null)}
              className="px-3 py-1.5 rounded border border-[#086375] text-xs text-[#DDFBD0]/60 hover:text-[#DDFBD0]"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
