const test = require('node:test');
const assert = require('node:assert/strict');

test('indexes only the signed-in user’s summaries and sends their IDs to vector search', async t => {
  const userId = 'signed-in-user';
  const summary = {summary_id: 42, summary: '팀 발표 준비가 부담스러웠다.'};
  const filters = [];
  const indexed = [];
  const calls = [];
  const dbPath = require.resolve('../config/supabase');
  require.cache[dbPath] = {exports: {
    from(table) {
      const q = {
        select: () => q,
        eq: (key, value) => {filters.push([table, key, value]); return q;},
        gte: () => q,
        order: () => q,
        limit: async () => ({data: [summary]}),
        in: async () => ({data: indexed}),
        upsert: async rows => {indexed.push(...rows); return {};},
      };
      return q;
    },
    async rpc(name, args) {
      assert.equal(name, 'match_nownow_chat_memories');
      assert.equal(args.owner_id, userId);
      assert.deepEqual(args.candidate_ids, [summary.summary_id]);
      assert.equal(args.query_vector.length, 1536);
      return {data: [{content: summary.summary, created_at: '2026-11-05T00:00:00Z'}]};
    },
  }};
  const previousKey = process.env.OPENAI_API_KEY;
  const previousServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.OPENAI_API_KEY = 'test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';
  t.after(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    if (previousServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceKey;
  });
  t.mock.method(global, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/embeddings');
    const {input} = JSON.parse(options.body);
    calls.push(input);
    return {ok: true, json: async () => ({data: input.map((_, index) => ({index, embedding: Array(1536).fill(0.1)}))})};
  });

  const {findChatMemories} = require('../services/chatMemorySearch');
  const question = '전에 발표 때문에 어떤 얘기를 했지?';
  assert.equal((await findChatMemories(userId, question))[0].summary, summary.summary);
  await findChatMemories(userId, question);
  assert.equal(indexed.length, 1);
  assert.equal(indexed[0].user_id, userId);
  assert.deepEqual(calls, [[question, summary.summary], [question]]);
  assert.ok(filters.every(([, key, value]) => key === 'user_id' && value === userId));
});
