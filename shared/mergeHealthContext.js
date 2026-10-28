// Two read-only sources. Keep overlapping totals separate; never sum them.
function mergeHealthContext(database, device) {
  const documents = new Map(database.documents.map(doc => [doc.id === 'stress-period' ? doc.id : `${doc.kind}:${doc.date}`, doc]));
  for (const doc of device.documents) {
    if (doc.kind === 'stress' || doc.date < database.range.from || doc.date > database.range.to) continue;
    const key = `${doc.kind}:${doc.date}`;
    const existing = documents.get(key);
    const local = {...doc, source: '휴대폰 Health Connect 직접 조회'};
    documents.set(key, existing ? {...existing,
      source: '팀 DB 저장 기록 + 휴대폰 Health Connect 직접 조회',
      facts: {database: existing.facts, device: local.facts,
        overlapPolicy: '출처별 수치이며 중복될 수 있으므로 합산하지 않음'},
    } : local);
  }
  return {...database, documents: [...documents.values()].slice(0, 6),
    status: [...database.status, ...device.status]};
}
module.exports = {mergeHealthContext};
