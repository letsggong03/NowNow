const {test} = require('node:test');
const assert = require('node:assert/strict');
const configPath = require.resolve('../config/supabase');
const calls = [];
let adminReads = 0;
const reader = {from(table) {
  const call = {table, filters: []}; calls.push(call);
  const rows = table === 'daily_stress_scores' ? [{record_date:'2026-10-28', final_score:62, missing:[]}] : [];
  const query = {
    select() {return this;}, eq(key, value) {call.filters.push([key, value]);return this;},
    gte() {return this;}, lte() {return this;}, lt() {return this;}, order() {return this;},
    range() {return Promise.resolve({data:rows,error:null});},
    insert() {throw new Error('Health writes are forbidden');},
    upsert() {throw new Error('Health writes are forbidden');},
    update() {throw new Error('Health writes are forbidden');},
  };
  return query;
}};
require.cache[configPath] = {id:configPath,filename:configPath,loaded:true,exports:{
  adminReadClient() {adminReads++;return reader;},
}};
const {getContext} = require('../services/healthContextService');
test('health context uses server admin reads scoped to the authenticated user and stored scores only', async () => {
  const result = await getContext('verified-user', '2026-10-28 스트레스');
  assert.equal(adminReads, 1);
  assert.equal(result.documents.find(doc => doc.kind === 'stress').facts.score, 62);
  assert.equal(calls.length, 6);
  for (const call of calls) assert.ok(call.filters.some(([key,value])=>key==='user_id' && value==='verified-user'));
  assert.deepEqual(result.missing, []);
});
test('admin health reads require an authenticated user identity', async () => {
  const before = calls.length;
  await assert.rejects(getContext('', '오늘 건강'), /사용자/);
  assert.equal(calls.length, before);
});
