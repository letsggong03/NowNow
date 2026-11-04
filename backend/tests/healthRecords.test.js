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
      }
    }
  );

  assert.deepEqual(parseHealthRecords({}), { records: {} });
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
