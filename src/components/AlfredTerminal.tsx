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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);
  const complianceStatus = activeUnit
    ? [
        `Root Folder: ${activeUnit.RootFolderID?.trim() ? 'Found' : 'Missing'}`,
        `MSA: ${activeUnit.MSA_DocID?.trim() ? 'Found' : 'Missing'}`,
        `Project Folder: ${activeUnit.ProjectFolderID?.trim() ? 'Found' : 'Missing'}`,
        `SOW: ${activeUnit.SOW_DocID?.trim() ? 'Found' : 'Missing'}`,
        `Meeting Notes: ${activeUnit.MeetingNotes_DriveFolderID?.trim() ? 'Found' : 'Missing'}`,
      ].join(', ')
    : 'No client selected.';
  const clientContext = activeUnit
    ? [
        `Client ID: ${activeUnit.id}`,
        `Name: ${activeUnit.name}`,
        `Archetype: ${activeUnit.archetype || 'Not recorded'}`,
        `Pipeline stage: ${activeUnit.pipelineStage || 'Not recorded'}`,
        `Active roadblock: ${activeUnit.activePebble || 'None recorded'}`,
        `Contract value: $${activeUnit.contractValue.toLocaleString()}`,
        `Deposit paid: ${activeUnit.depositPaid ? 'Yes' : 'No'}`,
        `Current milestone: ${activeUnit.currentMilestone || 'Not recorded'}`,
        `Milestones completed: ${activeUnit.completedMilestones}`,
        `Milestones total: ${activeUnit.totalMilestones}`,
        `Chat Space URL: ${activeUnit.chatSpaceUrl || 'Not recorded'}`,
        `Client notes URL: ${activeUnit.notesDocUrl || 'Not recorded'}`,
      ].join('\n')
    : 'No active client is selected.';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [activeUnit?.id]);

  const sendMessage = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isTypingRef.current) return;
    const conversation = [...messages, { role: 'user' as const, text }];
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
          systemInstruction: `You are Alfred, chief of staff and tactical steward for Session Zero Solutions, a digital operations consultancy led by Drake Austin. Address him as Master Drake, Captain, or Sir when natural.
Be crisp, pragmatic, polished, candid, and concise, with occasional understated wit. Avoid corporate jargon and filler. Frame technical operations as maintaining a well-run command bridge or client dossier. Use Session Zero terminology such as Digital Pebbles, Digital Heraldry, and the Google Iceberg when useful; do not force metaphors.
Help manage client digital infrastructure, organize client dossiers, review milestones, identify operational blockers, and draft practical next steps. Use only supplied facts. Never invent client data, document IDs, compliance evidence, or completed work; clearly state when something is missing or unavailable.
Active client context:
${clientContext}
Compliance Status for this client: ${complianceStatus}
Keep responses tactical and helpful.`,
        },
      });
      const responseText = response.text?.trim();
      if (!responseText) {
        throw new Error('Alfred returned an empty response. Please try again.');
      }

      setMessages((previous) => [...previous, { role: 'model', text: responseText }]);
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Alfred could not complete the request. Please try again.';
      setError(message);
    } finally {
      isTypingRef.current = false;
      setIsTyping(false);
    }
  }, [activeUnit, messages]);

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
