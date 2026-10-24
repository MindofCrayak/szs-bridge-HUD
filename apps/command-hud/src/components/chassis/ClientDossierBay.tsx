import React from 'react';
import { ClientRecord } from '../../types';

interface ClientDossierBayProps {
  client: ClientRecord | null;
}

export const ClientDossierBay: React.FC<ClientDossierBayProps> = ({ client }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden text-xs font-mono">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between border-b border-[#086375]/40 pb-1.5 shrink-0">
        <h2 className="font-display text-sm font-bold text-[#DDFBD0]">Client Dossier</h2>
        <span className="text-[0.6rem] text-[#E0CA3C] font-bold">LINKS ONLY</span>
      </div>

      {client ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
          <div className="pb-1 border-b border-[#086375]/30 truncate">
            <span className="text-[#E0CA3C] font-bold">{client.Company_Name}</span>
            <span className="text-[#DDFBD0]/50 ml-1">· {client.ClientID}</span>
          </div>

          {/* Sanctum Drive */}
          <div className="flex items-center justify-between p-1.5 rounded bg-[#020500]/60 border border-[#086375]/40">
            <span className="text-[#DDFBD0]/75 flex items-center gap-1.5 truncate">
              <i className="fa-brands fa-google-drive text-[#E0CA3C]" />
              Root Drive
            </span>
            {client.DriveFolderUrl ? (
              <a
                href={client.DriveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#E0CA3C] hover:underline font-bold text-[0.65rem]"
              >
                OPEN ↗
              </a>
            ) : (
              <span className="text-red-400 text-[0.6rem]">MISSING</span>
            )}
          </div>

          {/* Meeting Notes Doc */}
          <div className="flex items-center justify-between p-1.5 rounded bg-[#020500]/60 border border-[#086375]/40">
            <span className="text-[#DDFBD0]/75 flex items-center gap-1.5 truncate">
              <i className="fa-solid fa-file-lines text-[#FE5F00]" />
              Meeting Notes
            </span>
            {client.NotesDocUrl ? (
              <a
                href={client.NotesDocUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#FE5F00] hover:underline font-bold text-[0.65rem]"
              >
                OPEN ↗
              </a>
            ) : (
              <span className="text-red-400 text-[0.6rem]">MISSING</span>
            )}
          </div>

          {/* MSA Doc */}
          <div className="flex items-center justify-between p-1.5 rounded bg-[#020500]/60 border border-[#086375]/40">
            <span className="text-[#DDFBD0]/75 flex items-center gap-1.5 truncate">
              <i className="fa-solid fa-file-contract text-[#086375]" />
              View MSA
            </span>
            {client.MSA_DocID ? (
              <a
                href={`https://docs.google.com/document/d/${client.MSA_DocID}/edit`}
                target="_blank"
                rel="noreferrer"
                className="text-[#086375] hover:text-[#E0CA3C] hover:underline font-bold text-[0.65rem]"
              >
                VIEW ↗
              </a>
            ) : (
              <span className="text-red-400 text-[0.6rem]">MISSING</span>
            )}
          </div>

          {/* SOW Doc */}
          <div className="flex items-center justify-between p-1.5 rounded bg-[#020500]/60 border border-[#086375]/40">
            <span className="text-[#DDFBD0]/75 flex items-center gap-1.5 truncate">
              <i className="fa-solid fa-signature text-[#086375]" />
              View SOW
            </span>
            {client.SOW_DocID ? (
              <a
                href={`https://docs.google.com/document/d/${client.SOW_DocID}/edit`}
                target="_blank"
                rel="noreferrer"
                className="text-[#086375] hover:text-[#E0CA3C] hover:underline font-bold text-[0.65rem]"
              >
                VIEW ↗
              </a>
            ) : (
              <span className="text-red-400 text-[0.6rem]">MISSING</span>
            )}
          </div>

          {/* Chat Space */}
          <div className="flex items-center justify-between p-1.5 rounded bg-[#020500]/60 border border-[#086375]/40">
            <span className="text-[#DDFBD0]/75 flex items-center gap-1.5 truncate">
              <i className="fa-solid fa-comments text-[#E0CA3C]" />
              Chat Space
            </span>
            {client.ChatSpaceUrl ? (
              <a
                href={client.ChatSpaceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#E0CA3C] hover:underline font-bold text-[0.65rem]"
              >
                JOIN ↗
              </a>
            ) : (
              <span className="text-red-400 text-[0.6rem]">MISSING</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-3 text-[#DDFBD0]/50">
          <p className="text-[0.65rem]">Select an account to load Sanctum document shortcuts</p>
        </div>
      )}
    </div>
  );
};
