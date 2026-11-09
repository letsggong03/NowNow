const test = require('node:test');
const assert = require('node:assert/strict');

test('report recommendation uses saved evidence and skips AI when records are empty', async () => {
  let documents = [];
  let choices = [];
  let reply = '가볍게 몸을 움직여 보세요.';
  let prompts = [];
  const mock = (path, exports) => {require.cache[require.resolve(path)] = {exports};};
  mock('../services/healthContextService', {getContext: async id => {
    assert.equal(id, 'report-user');
    return {documents};
  }});
  mock('../services/insightService', {getStressCauses: async id => {
    assert.equal(id, 'report-user');
    return {causes: []};
  }});
  mock('../services/characterService', {getInteractions: async id => {
    assert.equal(id, 'report-user');
    return choices;
  }});
  mock('../services/chatRelayService', {requestReply: async prompt => {
    prompts.push(prompt);
    return reply;
  }});
  const {getAiRecommendation} = require('../services/reportAiRecommendation');
  assert.deepEqual(await getAiRecommendation('report-user'), {status: 'no_records'});
  assert.equal(prompts.length, 0);

  documents = [{kind: 'steps', date: '2026-11-05', facts: {count: 812}}];
  const result = await getAiRecommendation('report-user');
  assert.equal(result.status, 'ready');
  assert.match(prompts[0], /"count":812/);
  assert.ok(prompts[0].length <= 2000);
  assert.doesNotMatch(prompts[0], /report-user/);

  choices = [{action: 'play', choice: '공원 산책'}];
  reply = '오늘 고른 공원 산책, 10분만 해볼까요?\n전문가의 진단을 대체하지 않아요.';
  const walking = await getAiRecommendation('report-user');
  assert.equal(walking.action, 'walk_map');
  assert.match(prompts[1], /공원 산책/);
  assert.doesNotMatch(walking.message, /전문가/);

  reply = '아이유의 밤편지 들어볼래?\n음악 검색: 아이유 - 밤편지';
  const music = await getAiRecommendation('report-user');
  assert.equal(music.action, 'music');
  assert.equal(music.musicQuery, '아이유 - 밤편지');
  assert.equal(music.message, '아이유의 밤편지 들어볼래?');
});
