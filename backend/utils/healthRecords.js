// POST /api/health/records 요청 검사. 보낸 종류만 저장한다.
// 반환: { records } 또는 { error }

// 한 번에 받는 기록 수 상한(종류별). Health Connect에서 며칠 치를 읽어도 넉넉한 값.
const MAX_ROWS = 10000;

const isTime = value => typeof value === "string" && Number.isFinite(Date.parse(value));

const inRange = (value, min, max) =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

const isPeriod = row =>
  isTime(row.start_time) && isTime(row.end_time) && Date.parse(row.end_time) > Date.parse(row.start_time);

// 종류별 검사 규칙과 DB에 넣을 컬럼
const KINDS = {
  heart_rate: {
    valid: row => isTime(row.measured_at) && inRange(row.bpm, 20, 300),
    pick: row => ({ measured_at: row.measured_at, bpm: row.bpm })
  },
  blood_pressure: {
    valid: row =>
      isTime(row.measured_at) && inRange(row.systolic, 40, 300) && inRange(row.diastolic, 20, 200),
    pick: row => ({ measured_at: row.measured_at, systolic: row.systolic, diastolic: row.diastolic })
  },
  oxygen: {
    valid: row => isTime(row.measured_at) && inRange(row.percentage, 0, 100),
    pick: row => ({ measured_at: row.measured_at, percentage: row.percentage })
  },
  steps: {
    valid: row => isPeriod(row) && Number.isInteger(row.count) && inRange(row.count, 0, 200000),
    pick: row => ({ start_time: row.start_time, end_time: row.end_time, count: row.count })
  },
  sleep: {
    valid: row => isPeriod(row),
    pick: row => ({ start_time: row.start_time, end_time: row.end_time })
  }
};

function parseHealthRecords(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "요청 본문이 필요합니다." };
  }

  const records = {};

  for (const [kind, rule] of Object.entries(KINDS)) {
    const rows = body[kind];
    if (rows === undefined) continue;

    if (!Array.isArray(rows) || rows.length > MAX_ROWS) {
      return { error: `${kind}는 배열(최대 ${MAX_ROWS}개)이어야 합니다.` };
    }

    const badIndex = rows.findIndex(row => !row || typeof row !== "object" || !rule.valid(row));
    if (badIndex !== -1) {
      return { error: `${kind}[${badIndex}] 값이 올바르지 않습니다.` };
    }

    if (rows.length > 0) {
      records[kind] = rows.map(rule.pick);
    }
  }

  return { records };
}

module.exports = {
  MAX_ROWS,
  parseHealthRecords
};
