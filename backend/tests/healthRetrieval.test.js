const {test} = require('node:test');
const assert = require('node:assert/strict');
const {queryWindow, retrieve, groundedPrompt} = require('../../shared/healthRetrieval');
const empty = () => ({heartRates: [], bloodPressures: [], steps: [], sleeps: []});
test('KST date selection and invalid/future dates', () => {
  assert.deepEqual(queryWindow('어제 스트레스', '2026-10-28'), {from:'2026-10-27',to:'2026-10-27'});
  assert.deepEqual(queryWindow('최근 일주일', '2026-10-28'), {from:'2026-10-22',to:'2026-10-28'});
  assert.throws(() => queryWindow('2026-02-30 상태', '2026-10-28'));
  assert.throws(() => queryWindow('2026-10-29 상태', '2026-10-28'));
});
test('empty data never becomes a zero stress score; errors remain distinct', () => {
  const c = retrieve('오늘 스트레스', {from:'2026-10-28',to:'2026-10-28'}, empty(), ['조회 오류']);
  assert.equal(c.documents.length, 0);
  assert.deepEqual(c.missing, ['2026-10-28']);
  assert.equal(c.status[0], '조회 오류');
});
test('retrieves measured facts with sources and reuses team stress algorithm', () => {
  const data = empty();
  data.heartRates = [90,95,100].map((bpm,i) => ({bpm,measured_at:`2026-10-28T01:0${i}:00Z`}));
  data.steps = [{start_time:'2026-10-27T15:00:00Z', count:0}];
  const c = retrieve('오늘 스트레스', {from:'2026-10-28',to:'2026-10-28'}, data);
  assert.equal(c.documents[0].kind, 'stress');
  assert.equal(c.documents.find(d=>d.kind==='heart').facts.samples, 3);
  assert.equal(c.documents.find(d=>d.kind==='steps').facts.count, 0);
  assert.ok(c.documents[0].facts.missing.includes('sleep'));
  assert.ok(c.documents.every(d=>d.source));
  const prompt=groundedPrompt('오늘 관리 방법 알려줘', c);
  assert.ok(prompt.length<=2000);
  assert.ok(prompt.includes('진단'));
  assert.ok(prompt.includes('조회 자료'));
});
test('one measurement cannot create a stress index', () => {
  const data = empty();data.heartRates=[{bpm:100,measured_at:'2026-10-28T01:00:00Z'}];
  const c=retrieve('스트레스', {from:'2026-10-28',to:'2026-10-28'},data);
  assert.ok(c.documents.some(d=>d.kind==='heart'));
  assert.ok(!c.documents.some(d=>d.kind==='stress'));
});
