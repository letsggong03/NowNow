// POST /api/health/records 요청 검사. 보낸 종류만 저장한다.
// 반환: { records, stepsReplace, deleted, skipped } 또는 { error }
//
// 앱의 증분 동기화(Health Connect Changes API)는 아래 값도 같이 보낸다.
// - 행마다 source_record_id(Health Connect 레코드 id), data_origin(기록한 앱 패키지)
// - steps_replace: 이 구간의 걸음 수 행을 지우고 보낸 시간별 행으로 바꾼다
// - deleted: Health Connect에서 지워진 레코드 id 목록
// - skip_invalid: true면 잘못된 행 하나 때문에 전체를 거절하지 않고 그 행만 건너뛴다

// 한 번에 받는 기록 수 상한(종류별). Health Connect에서 며칠 치를 읽어도 넉넉한 값.
const MAX_ROWS = 10000;
const MAX_ID = 200;
const MAX_REPLACE_DAYS = 62;

const isTime = value => typeof value === "string" && Number.isFinite(Date.parse(value));

const inRange = (value, min, max) =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

const isPeriod = row =>
  isTime(row.start_time) && isTime(row.end_time) && Date.parse(row.end_time) > Date.parse(row.start_time);

const isOptionalId = value =>
  value === undefined || value === null || (typeof value === "string" && value.length > 0 && value.length <= MAX_ID);

const hasValidSource = row => isOptionalId(row.source_record_id) && isOptionalId(row.data_origin);

// 출처 값은 보냈을 때만 컬럼에 넣는다(예전 앱·직접 입력 혈압은 없음).
const pickSource = row => ({
  ...(row.source_record_id ? { source_record_id: row.source_record_id } : {}),
  ...(row.data_origin ? { data_origin: row.data_origin } : {})
});

// 종류별 검사 규칙과 DB에 넣을 컬럼
const KINDS = {
  heart_rate: {
    valid: row => isTime(row.measured_at) && inRange(row.bpm, 20, 300) && hasValidSource(row),
    pick: row => ({ measured_at: row.measured_at, bpm: row.bpm, ...pickSource(row) })
  },
  blood_pressure: {
    valid: row =>
      isTime(row.measured_at) && inRange(row.systolic, 40, 300) && inRange(row.diastolic, 20, 200) &&
      hasValidSource(row),
    pick: row => ({
      measured_at: row.measured_at,
      systolic: row.systolic,
      diastolic: row.diastolic,
      ...pickSource(row)
    })
  },
  oxygen: {
    valid: row => isTime(row.measured_at) && inRange(row.percentage, 0, 100) && hasValidSource(row),
    pick: row => ({ measured_at: row.measured_at, percentage: row.percentage, ...pickSource(row) })
  },
  steps: {
    valid: row => isPeriod(row) && Number.isInteger(row.count) && inRange(row.count, 0, 200000),
    pick: row => ({ start_time: row.start_time, end_time: row.end_time, count: row.count })
  },
  sleep: {
    valid: row => isPeriod(row) && hasValidSource(row),
    pick: row => ({ start_time: row.start_time, end_time: row.end_time, ...pickSource(row) })
  }
};

function parseStepsReplace(value) {
  if (value === undefined) return { stepsReplace: null };
  const days = value && isPeriod(value)
    ? (Date.parse(value.end_time) - Date.parse(value.start_time)) / 86_400_000
    : Infinity;
  if (days > MAX_REPLACE_DAYS) {
    return { error: `steps_replace는 ${MAX_REPLACE_DAYS}일 이하의 올바른 구간이어야 합니다.` };
  }
  return { stepsReplace: { start_time: value.start_time, end_time: value.end_time } };
}

function parseDeleted(value) {
  if (value === undefined) return { deleted: [] };
  if (!Array.isArray(value) || value.length > MAX_ROWS || !value.every(id => isOptionalId(id) && id)) {
    return { error: `deleted는 레코드 id 문자열 배열(최대 ${MAX_ROWS}개)이어야 합니다.` };
  }
  return { deleted: [...new Set(value)] };
}

function parseHealthRecords(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "요청 본문이 필요합니다." };
  }

  const skipInvalid = body.skip_invalid === true;
  const records = {};
  const skipped = {};

  for (const [kind, rule] of Object.entries(KINDS)) {
    const rows = body[kind];
    if (rows === undefined) continue;

    if (!Array.isArray(rows) || rows.length > MAX_ROWS) {
      return { error: `${kind}는 배열(최대 ${MAX_ROWS}개)이어야 합니다.` };
    }

    const isValid = row => row && typeof row === "object" && rule.valid(row);
    const badIndex = rows.findIndex(row => !isValid(row));
    if (badIndex !== -1 && !skipInvalid) {
      return { error: `${kind}[${badIndex}] 값이 올바르지 않습니다.` };
    }

    const valid = rows.filter(isValid);
    if (valid.length < rows.length) skipped[kind] = rows.length - valid.length;
    if (valid.length > 0) records[kind] = valid.map(rule.pick);
  }

  const replace = parseStepsReplace(body.steps_replace);
  if (replace.error) return { error: replace.error };

  // 걸음 수 행은 반드시 바꾸는 구간 안에 있어야 한다(밖에 있으면 같은 시간이 두 번 더해진다).
  if (replace.stepsReplace && records.steps?.some(row =>
    Date.parse(row.start_time) < Date.parse(replace.stepsReplace.start_time) ||
    Date.parse(row.start_time) >= Date.parse(replace.stepsReplace.end_time))) {
    return { error: "steps 행은 steps_replace 구간 안에 있어야 합니다." };
  }

  const deleted = parseDeleted(body.deleted);
  if (deleted.error) return { error: deleted.error };

  return { records, stepsReplace: replace.stepsReplace, deleted: deleted.deleted, skipped };
}

module.exports = {
  MAX_ROWS,
  parseHealthRecords
};
