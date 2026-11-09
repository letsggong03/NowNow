const test = require('node:test');
const assert = require('node:assert/strict');
const {healthSafetyReply} = require('../../shared/careSafety');

test('urgent symptoms take priority over a request for music or exercise', () => {
  assert.match(healthSafetyReply('가슴이 아파. 잔잔한 음악 추천해줘'), /119/);
});

test('a severe current blood-pressure reading gets a recheck and escalation, not activity suggestions', () => {
  const date = '2026-11-06';
  const context = {documents: [{kind: 'bp', date, facts: {systolic: 181, diastolic: 85}}]};
  assert.match(healthSafetyReply('오늘 혈압 어때?', context, date), /다시 재보세요/);
  assert.equal(healthSafetyReply('어제 혈압 어땠어?', context, date), null);
});
