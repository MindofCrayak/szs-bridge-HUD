import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { test } from 'node:test';
import { handleAlfredRequest } from './alfredProxy';

function sendTestRequest(port: number): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const req = request({
      host: '127.0.0.1',
      port,
      method: 'POST',
      path: '/',
      headers: { 'content-type': 'application/json' },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode || 0,
            body: JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', reject);
    req.end(JSON.stringify({ question: 'test request', history: [], context: {} }));
  });
}

test('Alfred proxy maps provider errors without leaking the server key', async () => {
  const testKey = 'test-key-not-valid-and-never-sent';
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  const server = createServer((req, res) => {
    void handleAlfredRequest(req, res);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const cases = [
      { name: 'invalid key', status: 400, message: 'invalid key simulated' },
      { name: 'missing model', status: 404, message: 'model not found simulated' },
      { name: 'quota', status: 429, message: 'quota exceeded simulated' },
      { name: 'offline', status: 0, message: '' },
    ];

    process.env.GEMINI_API_KEY = testKey;
    for (const testCase of cases) {
      globalThis.fetch = async () => {
        if (testCase.status === 0) throw new TypeError('simulated offline connection');
        return new Response(
          JSON.stringify({
            error: {
              code: testCase.status,
              status: testCase.status,
              message: testCase.message,
            },
          }),
          { status: testCase.status, headers: { 'content-type': 'application/json' } },
        );
      };

      const result = await sendTestRequest(address.port);
      assert.equal(result.status, testCase.status || 502, testCase.name);
      assert.equal(typeof result.body.message, 'string', testCase.name);
      assert.equal(String(result.body.message).includes(testKey), false, testCase.name);
    }

    process.env.GEMINI_API_KEY = '';
    globalThis.fetch = async () => {
      throw new Error('Provider must not be called when the key is missing.');
    };
    const missingKey = await sendTestRequest(address.port);
    assert.equal(missingKey.status, 503);
    assert.equal(String(missingKey.body.message).includes(testKey), false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
