import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'node:http';

type ChatMessage = { role: 'user' | 'model'; text: string };
type AlfredContext = {
  name?: string;
  id?: string;
  phase?: string;
  step?: string;
  roadblock?: string;
  depositStatus?: string;
  installedComponents?: string[];
};

const SYSTEM_INSTRUCTION = `You are Alfred, chief of staff and tactical steward for Session Zero Solutions.
Be concise, polished, candid, pragmatic, and quietly authoritative. Address the principal as Master Drake or Sir.
Use only the supplied context. Never invent IDs, compliance evidence, completed work, or external integrations.
You may propose actions but never execute them. Persisted changes require Master Control confirmation.
Do not disclose emails, phone numbers, document IDs, Drive links, or raw Oracle case-file data.`;
const MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
const BODY_LIMIT = 16_384;
const MAX_HISTORY_MESSAGES = 16;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const ID_PATTERN = /\b[A-Za-z0-9_-]{44}\b/g;
const URL_PATTERN = /\bhttps?:\/\/\S+/gi;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function redactText(value: unknown, limit: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value
    .replace(EMAIL_PATTERN, '[redacted]')
    .replace(ID_PATTERN, '[redacted]')
    .replace(URL_PATTERN, '[redacted]')
    .slice(0, limit);
}

function normalizeContext(value: unknown): AlfredContext {
  if (!isRecord(value)) return {};
  const installedComponents = Array.isArray(value.installedComponents)
    ? value.installedComponents
        .map((item) => redactText(item, 80))
        .filter((item): item is string => Boolean(item))
        .slice(0, 20)
    : undefined;

  return {
    name: redactText(value.name, 160),
    id: redactText(value.id, 40),
    phase: redactText(value.phase, 100),
    step: redactText(value.step, 100),
    roadblock: redactText(value.roadblock, 500),
    depositStatus: redactText(value.depositStatus, 60),
    installedComponents,
  };
}

function normalizeMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length > MAX_HISTORY_MESSAGES) return null;
  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (!isRecord(item) || (item.role !== 'user' && item.role !== 'model')) return null;
    const text = redactText(item.text, 4_000);
    if (text === undefined) return null;
    messages.push({ role: item.role, text });
  }
  return messages;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > BODY_LIMIT) throw new RangeError('Request body is too large.');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

function respond(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function providerStatus(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined;
  const status = error.status ?? error.code;
  return typeof status === 'number' ? status : undefined;
}

export function handleAlfredStatus(_req: IncomingMessage, res: ServerResponse): void {
  respond(res, 200, { configured: Boolean(process.env.GEMINI_API_KEY?.trim()) });
}

export async function handleAlfredRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    respond(res, 405, { message: 'Method not allowed.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    respond(res, 503, {
      message: 'No Gemini key found. Add GEMINI_API_KEY to .env.local in the repository root or apps/command-hud, then restart the server.',
    });
    return;
  }

  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 400;
    respond(res, status, { message: error instanceof RangeError ? error.message : 'Invalid JSON request.' });
    return;
  }

  if (!isRecord(body)) {
    respond(res, 400, { message: 'Invalid Alfred request.' });
    return;
  }

  const question = redactText(body.question, 4_000);
  const history = normalizeMessages(body.history);
  if (!question?.trim() || !history) {
    respond(res, 400, { message: `Alfred requires a question and at most ${MAX_HISTORY_MESSAGES} valid history messages.` });
    return;
  }

  const safeContext = normalizeContext(body.context);
  const contextText = JSON.stringify(safeContext).slice(0, 4_000);
  const controller = new AbortController();
  const abortUpstream = () => {
    if (!res.writableEnded) controller.abort();
  };
  res.once('close', abortUpstream);

  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: MODEL,
      contents: [
        ...history.map(({ role, text }) => ({ role, parts: [{ text }] })),
        { role: 'user', parts: [{ text: `Selected client context:\n${contextText}\n\nQuestion:\n${question}` }] },
      ],
      config: { systemInstruction: SYSTEM_INSTRUCTION, abortSignal: controller.signal },
    });
    const text = response.text?.trim();
    if (!text) {
      respond(res, 502, { message: 'Alfred returned an empty response. Please try again.' });
      return;
    }
    respond(res, 200, { text });
  } catch (error) {
    if (controller.signal.aborted) return;
    const status = providerStatus(error);
    if (status === 400 || status === 403) {
      respond(res, status, { message: `Request rejected (${status}). Check the server-side Gemini key and API access.` });
    } else if (status === 404) {
      respond(res, 404, { message: 'Model not found (404). Check the server-side GEMINI_MODEL setting.' });
    } else if (status === 429) {
      respond(res, 429, { message: 'Quota or rate limit reached (429). Wait and retry, or check the provider plan.' });
    } else {
      respond(res, 502, { message: 'Alfred could not reach the model service. Check the connection and retry.' });
    }
  } finally {
    res.removeListener('close', abortUpstream);
  }
}
