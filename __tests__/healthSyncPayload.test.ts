import {buildSyncRequests, MAX_ROWS_PER_REQUEST, type NativeSyncResult} from '../src/services/health/healthSyncPayload';

const empty: NativeSyncResult = {
  mode: 'changes', nextToken: 't2', heartRate: [], bloodPressure: [], oxygen: [], sleep: [], deleted: [],
};

test('레코드 id·출처를 서버 컬럼으로 바꾸고, 워치 혈압은 기본으로 보내지 않는다', () => {
  const bodies = buildSyncRequests({
    ...empty,
    heartRate: [{time: '2026-11-04T01:00:00Z', bpm: 71.6, recordId: 'hr-1', origin: 'com.sec.android.app.shealth'}],
    bloodPressure: [{time: '2026-11-04T01:00:00Z', systolic: 120, diastolic: 80, recordId: 'bp-1', origin: 'x'}],
    deleted: ['gone', 'gone'],
  });
  expect(bodies).toEqual([
    {heart_rate: [{measured_at: '2026-11-04T01:00:00Z', bpm: 72, source_record_id: 'hr-1', data_origin: 'com.sec.android.app.shealth'}], skip_invalid: true},
    {deleted: ['gone'], skip_invalid: true},
  ]);
});

test('걸음 수는 교체 구간과 한 요청에 담는다', () => {
  const bodies = buildSyncRequests({
    ...empty,
    steps: [{startTime: '2026-11-03T15:00:00Z', endTime: '2026-11-03T16:00:00Z', count: 12.4}],
    stepsStart: '2026-11-03T15:00:00Z',
    stepsEnd: '2026-11-04T02:00:00Z',
  });
  expect(bodies).toEqual([{
    steps: [{start_time: '2026-11-03T15:00:00Z', end_time: '2026-11-03T16:00:00Z', count: 12}],
    steps_replace: {start_time: '2026-11-03T15:00:00Z', end_time: '2026-11-04T02:00:00Z'},
    skip_invalid: true,
  }]);
});

test('많으면 나누되 같은 레코드의 샘플은 한 요청에 둔다', () => {
  // 레코드 하나에 샘플 1,000개씩 4개 → 3,000 + 1,000 으로 나뉘어야 한다
  const heartRate = Array.from({length: 4000}, (_, i) => ({
    time: new Date(Date.UTC(2026, 10, 4) + i * 1000).toISOString(),
    bpm: 70, recordId: `hr-${Math.floor(i / 1000)}`, origin: 'o',
  }));
  const bodies = buildSyncRequests({...empty, heartRate});
  const chunks = bodies.map(body => body.heart_rate as {source_record_id: string}[]);
  expect(chunks.map(rows => rows.length)).toEqual([3000, 1000]);
  chunks.forEach(rows => expect(rows.length).toBeLessThanOrEqual(MAX_ROWS_PER_REQUEST));
  const owner = new Map<string, number>();
  chunks.forEach((rows, index) => rows.forEach(row => {
    expect(owner.get(row.source_record_id) ?? index).toBe(index);
    owner.set(row.source_record_id, index);
  }));
});
