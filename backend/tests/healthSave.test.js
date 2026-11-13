const test = require("node:test");
const assert = require("node:assert/strict");

// 쿼리를 기록만 하는 가짜 supabase
const ops = [];
require.cache[require.resolve("../config/supabase")] = {
  exports: {
    from(table) {
      const op = { table, filters: [] };
      const query = {
        delete() { op.type = "delete"; ops.push(op); return query; },
        upsert(rows, options) { op.type = "upsert"; op.rows = rows; op.options = options; ops.push(op); return query; },
        eq(key, value) { op.filters.push(["eq", key, value]); return query; },
        in(key, values) { op.filters.push(["in", key, values]); return query; },
        gte(key, value) { op.filters.push(["gte", key, value]); return query; },
        lt(key, value) { op.filters.push(["lt", key, value]); return query; },
        then(resolve) { resolve({ error: null }); }
      };
      return query;
    }
  }
};

const { saveRecords } = require("../services/healthService");

test("동기화 저장: 지워진 레코드는 모든 원본 테이블에서, 다시 온 레코드는 예전 행을 지우고 넣는다", async () => {
  ops.length = 0;
  const { saved, failed } = await saveRecords(
    "user-1",
    {
      heart_rate: [
        { measured_at: "2026-11-04T01:00:00Z", bpm: 70, source_record_id: "hr-1" },
        { measured_at: "2026-11-04T01:01:00Z", bpm: 71, source_record_id: "hr-1" }
      ],
      steps: [{ start_time: "2026-11-03T15:00:00Z", end_time: "2026-11-03T16:00:00Z", count: 10 }]
    },
    {
      deleted: ["gone-1"],
      stepsReplace: { start_time: "2026-11-03T15:00:00Z", end_time: "2026-11-04T03:00:00Z" }
    }
  );

  assert.deepEqual(failed, {});
  assert.deepEqual(saved, { deleted: 1, heart_rate: 2, steps: 1 });

  const deletes = ops.filter(op => op.type === "delete");
  // 삭제 목록: 레코드 id를 저장하는 4개 테이블 모두
  const deletedTables = deletes
    .filter(op => op.filters.some(([kind, , value]) => kind === "in" && value.includes("gone-1")))
    .map(op => op.table).sort();
  assert.deepEqual(deletedTables, ["blood_pressure_records", "heart_rate_records", "oxygen_records", "sleep_records"]);
  // 같은 레코드 id의 예전 행 교체
  assert.ok(deletes.some(op => op.table === "heart_rate_records" &&
    op.filters.some(([kind, , value]) => kind === "in" && value.length === 1 && value[0] === "hr-1")));
  // 걸음 수 구간 교체
  assert.ok(deletes.some(op => op.table === "steps_records" &&
    op.filters.some(([kind, key]) => kind === "gte" && key === "start_time")));
  // 모든 쿼리가 로그인 사용자로 묶인다
  assert.ok(ops.every(op => op.type === "upsert"
    ? op.rows.every(row => row.user_id === "user-1")
    : op.filters.some(([kind, key, value]) => kind === "eq" && key === "user_id" && value === "user-1")));
});

test("동기화 저장: 레코드 id가 많으면 나눠서 지운다", async () => {
  ops.length = 0;
  const deleted = Array.from({ length: 450 }, (_, i) => `id-${i}`);
  await saveRecords("user-1", {}, { deleted });
  const heartDeletes = ops.filter(op => op.table === "heart_rate_records");
  assert.deepEqual(heartDeletes.map(op => op.filters.find(([kind]) => kind === "in")[2].length), [200, 200, 50]);
});
