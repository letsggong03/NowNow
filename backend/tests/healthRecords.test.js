const test = require("node:test");
const assert = require("node:assert/strict");

const { MAX_ROWS, parseHealthRecords } = require("../utils/healthRecords");

test("건강 기록 요청: 보낸 종류만, DB 컬럼만 남긴다", () => {
  assert.deepEqual(
    parseHealthRecords({
      heart_rate: [{ measured_at: "2026-11-04T01:00:00Z", bpm: 72, extra: "버림" }],
      steps: [
        {
          start_time: "2026-11-03T15:00:00Z",
          end_time: "2026-11-04T15:00:00Z",
          count: 4321
        }
      ],
      sleep: []
    }),
    {
      records: {
        heart_rate: [{ measured_at: "2026-11-04T01:00:00Z", bpm: 72 }],
        steps: [
          {
            start_time: "2026-11-03T15:00:00Z",
            end_time: "2026-11-04T15:00:00Z",
            count: 4321
          }
        ]
      },
      stepsReplace: null,
      deleted: [],
      skipped: {}
    }
  );

  assert.deepEqual(parseHealthRecords({}), { records: {}, stepsReplace: null, deleted: [], skipped: {} });
});

test("건강 기록 요청: 잘못된 값은 거절한다", () => {
  const rejects = body => assert.ok(parseHealthRecords(body).error, JSON.stringify(body));

  rejects(null);
  rejects([]);
  rejects({ heart_rate: "72" });
  rejects({ heart_rate: [{ measured_at: "어제", bpm: 72 }] });
  rejects({ heart_rate: [{ measured_at: "2026-11-04T01:00:00Z", bpm: "72" }] });
  rejects({ heart_rate: [{ measured_at: "2026-11-04T01:00:00Z", bpm: 999 }] });
  rejects({ blood_pressure: [{ measured_at: "2026-11-04T01:00:00Z", systolic: 120 }] });
  rejects({ oxygen: [{ measured_at: "2026-11-04T01:00:00Z", percentage: 101 }] });
  rejects({ steps: [{ start_time: "2026-11-04T00:00:00Z", end_time: "2026-11-05T00:00:00Z", count: 1.5 }] });
  // 끝이 시작보다 빠르면 안 된다
  rejects({ sleep: [{ start_time: "2026-11-04T07:00:00Z", end_time: "2026-11-03T23:00:00Z" }] });
  rejects({ sleep: [null] });

  const tooMany = Array.from({ length: MAX_ROWS + 1 }, () => ({
    measured_at: "2026-11-04T01:00:00Z",
    percentage: 98
  }));
  rejects({ oxygen: tooMany });
});

test("증분 동기화: 레코드 id·출처를 남기고, 삭제 목록과 걸음 수 교체 구간을 받는다", () => {
  const parsed = parseHealthRecords({
    heart_rate: [{ measured_at: "2026-11-04T01:00:00Z", bpm: 72, source_record_id: "hc-1", data_origin: "com.sec.android.app.shealth" }],
    sleep: [{ start_time: "2026-11-03T15:00:00Z", end_time: "2026-11-03T22:00:00Z", source_record_id: "hc-2" }],
    steps: [{ start_time: "2026-11-03T15:00:00Z", end_time: "2026-11-03T16:00:00Z", count: 120 }],
    steps_replace: { start_time: "2026-11-03T15:00:00Z", end_time: "2026-11-04T03:00:00Z" },
    deleted: ["hc-9", "hc-9", "hc-10"]
  });

  assert.deepEqual(parsed.records.heart_rate, [
    { measured_at: "2026-11-04T01:00:00Z", bpm: 72, source_record_id: "hc-1", data_origin: "com.sec.android.app.shealth" }
  ]);
  assert.deepEqual(parsed.records.sleep, [
    { start_time: "2026-11-03T15:00:00Z", end_time: "2026-11-03T22:00:00Z", source_record_id: "hc-2" }
  ]);
  assert.deepEqual(parsed.stepsReplace, { start_time: "2026-11-03T15:00:00Z", end_time: "2026-11-04T03:00:00Z" });
  assert.deepEqual(parsed.deleted, ["hc-9", "hc-10"]);
});

test("증분 동기화: skip_invalid면 잘못된 행만 건너뛴다", () => {
  const parsed = parseHealthRecords({
    skip_invalid: true,
    heart_rate: [
      { measured_at: "2026-11-04T01:00:00Z", bpm: 72 },
      { measured_at: "2026-11-04T01:01:00Z", bpm: 999 }
    ]
  });
  assert.deepEqual(parsed.records.heart_rate, [{ measured_at: "2026-11-04T01:00:00Z", bpm: 72 }]);
  assert.deepEqual(parsed.skipped, { heart_rate: 1 });
});

test("증분 동기화: 잘못된 교체 구간·삭제 목록은 거절한다", () => {
  const rejects = body => assert.ok(parseHealthRecords(body).error, JSON.stringify(body));

  // 62일 넘는 교체 구간
  rejects({ steps_replace: { start_time: "2026-01-01T00:00:00Z", end_time: "2026-11-01T00:00:00Z" } });
  // 구간 밖 걸음 수 행 (두 번 더해진다)
  rejects({
    steps: [{ start_time: "2026-11-05T00:00:00Z", end_time: "2026-11-05T01:00:00Z", count: 10 }],
    steps_replace: { start_time: "2026-11-03T15:00:00Z", end_time: "2026-11-04T15:00:00Z" }
  });
  rejects({ deleted: "hc-1" });
  rejects({ deleted: [""] });
  rejects({ heart_rate: [{ measured_at: "2026-11-04T01:00:00Z", bpm: 72, source_record_id: "x".repeat(201) }] });
});
