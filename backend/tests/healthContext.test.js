const test = require('node:test');
const assert = require('node:assert/strict');
const {kstToday} = require('../utils/kstDate');
const {groundedPrompt} = require('../../shared/healthRetrieval');

test('health context reads only the authenticated user and excludes tagged demonstration scores', async () => {
  const today = kstToday();
  const requests = [];
  const dbPath = require.resolve('../config/supabase');
  require.cache[dbPath] = {exports: {from(table) {
    const request = {table};
    requests.push(request);
    const query = {
      select: () => query,
      eq(key, value) { request[key] = value; return query; },
      gte: () => query,
      lt: () => query,
      lte: () => query,
      order: () => query,
      async range() {
        if (table === 'blood_pressure_records') {
          return {data: [{measured_at: `${today}T08:00:00+09:00`, systolic: 117, diastolic: 76}]};
        }
        if (table === 'daily_stress_scores') {
          return {data: [{record_date: today, final_score: 99, missing: ['demo_fixture']}]};
        }
        return {data: []};
      },
    };
    return query;
  }}};
  const {getContext} = require('../services/healthContextService');
  const context = await getContext('signed-in-user', '오늘 혈압 알려줘');
  assert.equal(requests.length, 6);
  assert.ok(requests.every(request => request.user_id === 'signed-in-user'));
  assert.ok(context.documents.every(doc => doc.kind !== 'stress'));
  const prompt = groundedPrompt('오늘 혈압 알려줘', context);
  assert.match(prompt, /"systolic":117,"diastolic":76/);
  assert.doesNotMatch(prompt, /signed-in-user/);
  assert.ok(prompt.length <= 2000);
});
