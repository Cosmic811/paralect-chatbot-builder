import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '..');
const req = createRequire(path.join(root, 'package.json'));
const ts = req('typescript');
function load(relative, mocks = {}) {
  const filename = path.join(root, relative);
  const local = createRequire(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiled = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (name) => (name in mocks ? mocks[name] : local(name)),
    compiled,
    compiled.exports,
  );
  return compiled.exports;
}
const vector = (n = 0.1) => new Array(1024).fill(n);
test('embeddings reorder batches and skip provider for empty input', async () => {
  let calls = 0;
  const { createEmbeddings } = load('src/lib/mistral/embeddings.ts', {
    './client': {
      getMistralClient: () => ({
        embeddings: {
          create: async ({ inputs }) => {
            calls++;
            return {
              data: inputs.map((n, index) => ({ index, embedding: vector(Number(n)) })).reverse(),
            };
          },
        },
      }),
    },
  });
  assert.deepEqual(
    (await createEmbeddings(Array.from({ length: 35 }, (_, i) => String(i)))).map((v) => v[0]),
    Array.from({ length: 35 }, (_, i) => i),
  );
  assert.equal(calls, 2);
  assert.deepEqual(await createEmbeddings([]), []);
  assert.equal(calls, 2);
});
for (const [name, data] of [
  ['missing', []],
  ['wrong dimensions', [{ index: 0, embedding: [1] }]],
  ['nonfinite', [{ index: 0, embedding: vector(NaN) }]],
  ['wrong index', [{ index: 2, embedding: vector() }]],
])
  test('rejects ' + name + ' embedding', async () => {
    const { createEmbeddings } = load('src/lib/mistral/embeddings.ts', {
      './client': { getMistralClient: () => ({ embeddings: { create: async () => ({ data }) } }) },
    });
    await assert.rejects(createEmbeddings(['test']));
  });
test('widget tokens are scoped, authenticated and tamper resistant', () => {
  process.env.SUPABASE_SECRET_KEY = 'test-secret-only';
  const { issueSession, readSession } = load('src/lib/chat/session.ts');
  const token = issueSession('bot', 'conversation');
  assert.equal(readSession(token, 'bot'), 'conversation');
  assert.equal(readSession(token, 'other'), null);
  assert.equal(readSession(token + 'x', 'bot'), null);
  assert.equal(readSession('invalid', 'bot'), null);
  const [payload, sig] = token.split('.');
  const modified = Buffer.from(
    JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url')), conversationId: 'other' }),
  ).toString('base64url');
  assert.equal(readSession(modified + '.' + sig, 'bot'), null);
});
test('request limiter rejects bursts without blocking another visitor', () => {
  const { allowRequest } = load('src/lib/chat/rate-limit.ts');
  assert.equal(allowRequest('a', 2), true);
  assert.equal(allowRequest('a', 2), true);
  assert.equal(allowRequest('a', 2), false);
  assert.equal(allowRequest('b', 2), true);
});
test('provider errors expose a safe rate-limit message', () => {
  const { providerError } = load('src/lib/mistral/provider-error.ts');
  assert.equal(providerError({ statusCode: 429, body: 'secret' }, 'fallback').status, 429);
  assert.equal(providerError(new Error('secret'), 'fallback').message, 'fallback');
});
const responseMock = {
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
};
function billing(options = {}) {
  let updated = null;
  const api = load('src/app/api/billing/route.ts', {
    ...responseMock,
    '@/lib/auth/owner': { currentOwner: async () => ({ userId: options.unauth ? null : 'owner' }) },
    '@/lib/billing/account': {
      getAccount: async () => ({
        id: options.plan || 'free',
        metadata: { keep: 'value' },
        invoices: [],
      }),
      getUsage: async () => ({ bots: options.bots || 1, documents: options.documents || 1 }),
    },
    '@/lib/supabase/admin': {
      createAdminClient: () => ({
        auth: {
          admin: {
            updateUserById: async (id, value) => {
              updated = { id, value };
              return { error: null };
            },
          },
        },
      }),
    },
  });
  return {
    api,
    get updated() {
      return updated;
    },
  };
}
function request(body) {
  return new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
test('billing rejects unauthenticated requests and unconfirmed checkout', async () => {
  assert.equal(
    (
      await billing({ unauth: true }).api.POST(
        request({ action: 'upgrade', demoAcknowledged: true }),
      )
    ).status,
    401,
  );
  assert.equal((await billing().api.POST(request({ action: 'upgrade' }))).status, 400);
});
test('demo upgrade preserves metadata and writes one simulated invoice', async () => {
  const h = billing();
  assert.equal(
    (await h.api.POST(request({ action: 'upgrade', demoAcknowledged: true }))).status,
    200,
  );
  assert.equal(h.updated.value.app_metadata.plan, 'pro');
  assert.equal(h.updated.value.app_metadata.keep, 'value');
  assert.equal(h.updated.value.app_metadata.demo_invoices[0].amount, 29);
});
test('repeat checkout does not create a duplicate invoice', async () => {
  const h = billing({ plan: 'pro' });
  assert.equal(
    (await h.api.POST(request({ action: 'upgrade', demoAcknowledged: true }))).status,
    200,
  );
  assert.equal(h.updated, null);
});
test('downgrade refuses excess resources without deleting anything', async () => {
  const h = billing({ plan: 'pro', bots: 2 });
  assert.equal(
    (await h.api.POST(request({ action: 'cancel', demoAcknowledged: true }))).status,
    409,
  );
  assert.equal(h.updated, null);
});
function service(options = {}) {
  const calls = [];
  function query(table) {
    const q = { table, action: 'select', filters: [] };
    const chain = {};
    for (const method of [
      'select',
      'insert',
      'delete',
      'eq',
      'is',
      'in',
      'order',
      'limit',
      'single',
      'maybeSingle',
    ])
      chain[method] = (...args) => {
        if (['insert', 'delete'].includes(method)) {
          q.action = method;
          q.payload = args[0];
        }
        if (['eq', 'is', 'in'].includes(method)) q.filters.push([method, ...args]);
        return chain;
      };
    chain.then = (resolve, reject) => {
      calls.push(q);
      let data = null,
        error = null;
      if (table === 'conversations') data = options.foreign ? null : { id: 'conversation' };
      if (table === 'documents') data = options.notReady ? [] : [{ id: 'doc', name: 'guide.txt' }];
      if (table === 'messages' && q.action === 'select')
        data = [
          { role: 'user', content: 'How much is Pro?' },
          { role: 'assistant', content: '$29.' },
        ];
      if (table === 'messages' && q.action === 'insert' && options.failSave)
        error = { message: 'failed' };
      return Promise.resolve({ data, error }).then(resolve, reject);
    };
    return chain;
  }
  const admin = {
    from: query,
    rpc: async () => ({
      data: options.empty
        ? []
        : [
            {
              document_id: 'doc',
              content: 'Pro costs $29 per user.',
              chunk_index: 0,
              similarity: 0.9,
            },
          ],
      error: null,
    }),
  };
  let embeddingQuery;
  let history;
  const api = load('src/lib/chat/service.ts', {
    './account-lock': load('src/lib/chat/account-lock.ts'),
    '@/lib/supabase/admin': { createAdminClient: () => admin },
    '@/lib/billing/account': {
      getAccount: async () => ({ plan: { messages: 100 } }),
      getUsage: async () => ({ messages: options.quota ? 100 : 0 }),
    },
    '@/lib/mistral/embeddings': {
      createEmbeddings: async (input) => {
        embeddingQuery = input;
        return [vector()];
      },
    },
    '@/lib/mistral/chat': {
      answerFromContext: async (q, c, p, h) => {
        history = h;
        return 'Pro costs $29 per user.';
      },
    },
  });
  return {
    ...api,
    calls,
    get embeddingQuery() {
      return embeddingQuery;
    },
    get history() {
      return history;
    },
  };
}
const bot = { id: 'bot', user_id: 'owner', system_prompt: 'Helpful.' };
test('chat produces grounded answer, sources and ordered message pair', async () => {
  const h = service();
  const result = await h.respond(bot, 'How much?', null);
  assert.match(result.answer, /29/);
  assert.equal(result.sources[0].name, 'guide.txt');
  const rows = h.calls.find((q) => q.table === 'messages' && q.action === 'insert').payload;
  assert.equal(rows.length, 2);
  assert.ok(rows[0].created_at < rows[1].created_at);
});
for (const flag of ['empty', 'notReady'])
  test('fallback for ' + flag + ' knowledge', async () => {
    const h = service({ [flag]: true });
    const result = await h.respond(bot, 'Question', null);
    assert.equal(result.answer, "I don't know based on the uploaded knowledge.");
  });
test('follow-up uses history but keeps document grounding', async () => {
  const h = service();
  await h.respond(bot, 'Is that per user?', 'conversation');
  assert.match(h.embeddingQuery[0], /How much is Pro/);
  assert.equal(h.history.length, 2);
});
test('visitor conversations are checked for null owner', async () => {
  const h = service();
  await h.respond(bot, 'Question', 'conversation', true);
  assert.ok(
    h.calls
      .find((q) => q.table === 'conversations')
      .filters.some((f) => f[0] === 'is' && f[1] === 'user_id' && f[2] === null),
  );
});
test('foreign conversation is rejected before embeddings', async () => {
  const h = service({ foreign: true });
  await assert.rejects(h.respond(bot, 'Question', 'foreign'), (e) => e.status === 404);
  assert.equal(h.embeddingQuery, undefined);
});
test('message quota blocks provider calls', async () => {
  const h = service({ quota: true });
  await assert.rejects(h.respond(bot, 'Question', null), (e) => e.status === 429);
  assert.equal(h.embeddingQuery, undefined);
});
test('message save failure removes newly created empty conversation', async () => {
  const h = service({ failSave: true });
  await assert.rejects(h.respond(bot, 'Question', null), (e) => e.status === 500);
  assert.ok(h.calls.some((q) => q.table === 'conversations' && q.action === 'delete'));
});
