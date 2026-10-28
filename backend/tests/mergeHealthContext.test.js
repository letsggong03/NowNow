const {test} = require('node:test');
const assert = require('node:assert/strict');
const {mergeHealthContext} = require('../../shared/mergeHealthContext');
test('both dates and period aggregates survive; device scores and outside dates are excluded', () => {
  const database = {range:{from:'2026-10-22',to:'2026-10-28'},status:[],documents:[
    {id:'stress-period',kind:'stress',date:'2026-10-28',facts:{average:50}},
    {id:'stress:2026-10-28',kind:'stress',date:'2026-10-28',facts:{score:60}},
    {id:'heart:old',kind:'heart',date:'2026-10-22',facts:{latestBpm:72}},
  ]};
  const device = {status:[],documents:[
    {kind:'heart',date:'2026-10-28',facts:{latestBpm:80}},
    {kind:'stress',date:'2026-10-28',facts:{score:99}},
    {kind:'heart',date:'2026-10-21',facts:{latestBpm:77}},
  ]};
  const result = mergeHealthContext(database,device);
  assert.equal(result.documents.length,4);
  assert.equal(result.documents.find(doc=>doc.id==='stress-period').facts.average,50);
  assert.ok(!result.documents.some(doc=>doc.facts.score===99));
});
