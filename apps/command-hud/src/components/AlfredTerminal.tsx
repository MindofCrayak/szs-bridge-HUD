import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ClientUnit } from '../types';

interface AlfredTerminalProps {
  activeUnit: ClientUnit | null;
}

export interface AlfredTerminalHandle {
  sendMessage: (text: string) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const AlfredTerminal = forwardRef<AlfredTerminalHandle, AlfredTerminalProps>(({ activeUnit }, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const pendingExternalCommandsRef = useRef<string[]>([]);
  const activeUnitIdRef = useRef(activeUnit?.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);
  activeUnitIdRef.current = activeUnit?.id;
  const u = activeUnit as any;
  const complianceStatus = u
    ? [
        `Root Folder: ${u.RootFolderID?.trim() ? 'Found' : 'Missing'}`,
        `MSA: ${u.MSA_DocID?.trim() ? 'Found' : 'Missing'}`,
        `Project Folder: ${u.ProjectFolderID?.trim() ? 'Found' : 'Missing'}`,
        `SOW: ${u.SOW_DocID?.trim() ? 'Found' : 'Missing'}`,
        `Meeting Notes: ${u.MeetingNotes_DriveFolderID?.trim() ? 'Found' : 'Missing'}`,
      ].join(', ')
    : 'No client selected.';
  const clientContext = u
    ? [
        `Client ID: ${u.id || u.ClientID || 'N/A'}`,
        `Name: ${u.name || u.Company_Name || 'N/A'}`,
        `Archetype: ${u.archetype || 'Not recorded'}`,
        `Pipeline stage: ${u.pipelineStage || u.AccountPhase || 'Not recorded'}`,
        `Active roadblock: ${u.activePebble || u.roadblock || 'None recorded'}`,
        `Contract value: $${(u.contractValue ?? u.ContractValue ?? 0).toLocaleString()}`,
        `Deposit paid: ${(u.depositPaid ?? u.DepositPaid) ? 'Yes' : 'No'}`,
        `Current milestone: ${u.currentMilestone || 'Not recorded'}`,
        `Milestones completed: ${u.completedMilestones ?? 'N/A'}`,
        `Milestones total: ${u.totalMilestones ?? 'N/A'}`,
        `Google Group Email: ${u.googleGroupEmail || 'Not recorded'}`,
        `Google Tasklist ID: ${u.taskListId || 'Not recorded'}`,
        `Chat Space URL: ${u.chatSpaceUrl || u.ChatSpaceUrl || 'Not recorded'}`,
        `Client notes URL: ${u.notesDocUrl || u.NotesDocUrl || 'Not recorded'}`,
        `Oracle case file URL: ${u.caseFileJsonUrl || 'Not recorded'}`,
        `Root Folder ID: ${u.RootFolderID?.trim() || 'Missing'}`,
        `MSA Document ID: ${u.MSA_DocID?.trim() || 'Missing'}`,
        `Project Folder ID: ${u.ProjectFolderID?.trim() || 'Missing'}`,
        `SOW Document ID: ${u.SOW_DocID?.trim() || 'Missing'}`,
        `Meeting Notes Folder ID: ${u.MeetingNotes_DriveFolderID?.trim() || 'Missing'}`,
      ].join('\n')
    : 'No active client is selected.';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  useEffect(() => {
    messagesRef.current = [];
    pendingExternalCommandsRef.current = [];
    setMessages([]);
    setError(null);
  }, [activeUnit?.id]);

  const sendMessage = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;
    if (isTypingRef.current) {
      pendingExternalCommandsRef.current.push(text);
      return;
    }
    const conversation = [...messagesRef.current, { role: 'user' as const, text }];
    const requestClientId = activeUnit?.id;
    messagesRef.current = conversation;
    setMessages(conversation);
    setError(null);
    isTypingRef.current = true;
    setIsTyping(true);

    try {
      if (!ai) {
        throw new Error('Add a valid VITE_GEMINI_API_KEY to the root .env file and restart the development server.');
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: conversation.map((message) => ({
          role: message.role,
          parts: [{ text: message.text }],
        })),
        config: {
          systemInstruction: `You are Alfred, chief of staff and tactical steward for Session Zero Solutions, a DBA under DrakeCo LLC, led by Drake Austin. Address the principal only as Master Drake or Sir.
Be crisp, pragmatic, polished, candid, and concise, with understated humor and quiet technical authority. Avoid corporate jargon and filler. Treat infrastructure as a well-managed estate or command bridge; use Session Zero terms such as Digital Pebbles when useful without forcing metaphors.
Coordinate operational telemetry, compliance, API routing, and system hygiene. Keep the personas distinct: Pamela Isley handles intake/graduation and Drive provisioning; Oracle handles marketing intelligence; Dolores Herbig handles tasks/workspaces; Vala Mal Doran handles milestone billing; Daisy Adare handles offboarding.
Macro pad mapping: Q = pre-fill Gmail, W = open Chat Space, E = schedule Meet, A = new project onboarding, S = draft milestone invoice, D = Google Tasks checklist, Z = Oracle (quarantined and unavailable in this HUD package), X = meeting notes, C = Alfred compliance check.
The database stages are 00 Discovery, 01 Pitch Staged, 02 Contract & Inception, 03 Deep Intelligence, 04 Session Zero Kickoff, 05 Builds, 06 Mid-Flight Review, 07 Final Staging, 08 Liftoff, and 09 Sunset / Retainer. The HUD groups these into Intake (00–01), Session Zero (02–04), Active Sprints (05–07), and Liftoff (08–09).
Identity conventions: ClientID is a three-letter company acronym with a numeric suffix for collisions; ProjectID is {ClientID}-{Number}; InvoiceID is INV-{ClientID}-{Number}; Google Groups use client-{clientid}@sessionzero.solutions. Use supplied IDs only; never mint or imply an ID exists unless an authorized workflow has done so.
Vala's stated rate rubric is $85/hr Normal, $115/hr Premium, $65/hr Reduced, and $2,500 Blueprint, with milestone invoices typically divided into thirds. No client rate tier is supplied unless present below; never infer a tier or calculate an invoice as approved without it.
Use only supplied facts. Never invent client data, document IDs, compliance evidence, completed work, or external actions. Clearly state when something is missing or a connector is unavailable. Do not claim Oracle has scraped data or updated a Drive sourcebook unless the integration confirms it.
Active client context:
${clientContext}
Compliance Status for this client: ${complianceStatus}
Keep responses tactical, brief, and helpful.`,
        },
      });
      const responseText = response.text?.trim();
      if (!responseText) {
        throw new Error('Alfred returned an empty response. Please try again.');
      }

      if (activeUnitIdRef.current === requestClientId) {
        setMessages((previous) => {
          const nextMessages: ChatMessage[] = [...previous, { role: 'model', text: responseText }];
          messagesRef.current = nextMessages;
          return nextMessages;
        });
      }
    } catch (requestError) {
      if (activeUnitIdRef.current === requestClientId) {
        const message = requestError instanceof Error
          ? requestError.message
          : 'Alfred could not complete the request. Please try again.';
        setError(message);
      }
    } finally {
      isTypingRef.current = false;
      setIsTyping(false);
    }
  }, [activeUnit]);

  useEffect(() => {
    if (!isTyping && pendingExternalCommandsRef.current.length > 0) {
      const nextCommand = pendingExternalCommandsRef.current.shift();
      if (nextCommand) void sendMessage(nextCommand);
    }
  }, [isTyping, sendMessage]);

  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => { void sendMessage(text); },
  }), [sendMessage]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isTypingRef.current) return;
    setInput('');
    void sendMessage(text);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-[#086375]/70 bg-[#020500] p-3 font-mono text-xs"
        aria-live="polite"
        aria-label="Alfred conversation"
      >
        {messages.length === 0 && (
          <p className="text-text-mana/55">Alfred is ready. Ask about the selected client, milestones, or roadblocks.</p>
        )}
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'text-[#ddfbd0]' : 'text-[#E0CA3C]'}>
            <span className="font-bold">{message.role === 'user' ? 'You' : 'Alfred'}:</span>{' '}
            <span className="whitespace-pre-wrap">{message.text}</span>
          </div>
        ))}
        {isTyping && <p className="animate-pulse text-[#E0CA3C]">Alfred is thinking...</p>}
        {error && <p role="alert" className="text-alert-orange">{error}</p>}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="sticky bottom-0 mt-2 flex gap-2 border-t border-[#086375]/60 bg-[#020500] pt-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Command Alfred..."
          aria-label="Command Alfred"
          disabled={isTyping}
          className="min-w-0 flex-1 rounded-md border border-[#086375] bg-[#020500] px-3 py-2 text-sm text-[#ddfbd0] outline-none placeholder:text-text-mana/45 focus:border-[#E0CA3C] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isTyping || !input.trim()}
          className="rounded-md bg-alert-orange px-3 font-accent text-bg-obsidian hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
});

AlfredTerminal.displayName = 'AlfredTerminal';
