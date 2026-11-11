// HealthConnectModule.syncHealthData() 결과를 POST /api/health/records 요청 본문으로 바꾼다.
// 네이티브 모듈·네트워크와 떨어진 순수 함수라서 테스트하기 쉽다.

export interface NativeSyncResult {
  mode: 'full' | 'changes' | 'expired';
  nextToken: string;
  heartRate: {time: string; bpm: number; recordId: string; origin: string}[];
  bloodPressure: {time: string; systolic: number; diastolic: number; recordId: string; origin: string}[];
  oxygen: {time: string; percentage: number; recordId: string; origin: string}[];
  sleep: {startTime: string; endTime: string; recordId: string; origin: string}[];
  deleted: string[];
  steps?: {startTime: string; endTime: string; count: number}[];
  stepsStart?: string;
  stepsEnd?: string;
}

type Row = Record<string, unknown> & {source_record_id?: string};
type Kind = 'heart_rate' | 'blood_pressure' | 'oxygen' | 'sleep';

// 서버 한도(종류별 10,000행)보다 작게 나눈다.
export const MAX_ROWS_PER_REQUEST = 3000;

// 같은 레코드의 행은 반드시 같은 요청에 들어가야 한다.
// 서버가 레코드 id로 예전 행을 지우고 새로 넣기 때문에, 나뉘면 앞 요청의 행이 지워진다.
function chunkByRecord(kind: Kind, rows: Row[]) {
  const groups = new Map<string, Row[]>();
  rows.forEach((row, index) => {
    const key = row.source_record_id ?? `#${index}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  const bodies: Record<string, unknown>[] = [];
  let current: Row[] = [];
  for (const group of groups.values()) {
    if (current.length > 0 && current.length + group.length > MAX_ROWS_PER_REQUEST) {
      bodies.push({[kind]: current});
      current = [];
    }
    current.push(...group);
  }
  if (current.length > 0) bodies.push({[kind]: current});
  return bodies;
}

export function buildSyncRequests(
  result: NativeSyncResult,
  {includeBloodPressure = false}: {includeBloodPressure?: boolean} = {},
) {
  const source = (row: {recordId: string; origin: string}) => ({
    source_record_id: row.recordId,
    data_origin: row.origin,
  });

  const bodies: Record<string, unknown>[] = [
    ...chunkByRecord('heart_rate', result.heartRate.map(row => ({
      measured_at: row.time, bpm: Math.round(row.bpm), ...source(row),
    }))),
    ...(includeBloodPressure ? chunkByRecord('blood_pressure', result.bloodPressure.map(row => ({
      measured_at: row.time, systolic: row.systolic, diastolic: row.diastolic, ...source(row),
    }))) : []),
    ...chunkByRecord('oxygen', result.oxygen.map(row => ({
      measured_at: row.time, percentage: row.percentage, ...source(row),
    }))),
    ...chunkByRecord('sleep', result.sleep.map(row => ({
      start_time: row.startTime, end_time: row.endTime, ...source(row),
    }))),
  ];

  // 걸음 수는 구간을 통째로 바꾸므로 한 요청에 담는다(시간별이라 62일이어도 1,500행 남짓).
  if (result.steps && result.stepsStart && result.stepsEnd) {
    bodies.push({
      steps: result.steps.map(row => ({
        start_time: row.startTime, end_time: row.endTime, count: Math.round(row.count),
      })),
      steps_replace: {start_time: result.stepsStart, end_time: result.stepsEnd},
    });
  }

  const deleted = [...new Set(result.deleted)];
  for (let i = 0; i < deleted.length; i += MAX_ROWS_PER_REQUEST) {
    bodies.push({deleted: deleted.slice(i, i + MAX_ROWS_PER_REQUEST)});
  }

  // 워치에서 잘못 잰 값 하나 때문에 동기화가 계속 멈추지 않게 그 행만 건너뛰게 한다.
  return bodies.map((body): Record<string, unknown> => ({...body, skip_invalid: true}));
}
