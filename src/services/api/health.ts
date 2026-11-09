import {request} from './client';

export async function getTodayBloodPressure() {
  const {data} = await request<{data: {measured_at: string; systolic: number; diastolic: number}[]}>('GET', '/api/health/blood-pressure');
  return data.map(row => ({time: row.measured_at, systolic: row.systolic, diastolic: row.diastolic}));
}

// HealthConnectModule.getHealthData()가 돌려주는 값 중 저장할 부분
export interface HealthConnectData {
  heartRateSamples?: {time: string; bpm: number}[];
  bloodPressureSamples?: {time: string; systolic: number; diastolic: number}[];
  oxygenSamples?: {time: string; percentage: number}[];
  stepsTotal?: number;
  sleepSessions?: {startTime: string; endTime: string}[];
}

// Health Connect 원본 기록을 서버에 저장한다. 같은 시각 기록은 서버가 덮어쓴다.
export const saveHealthRecords = async (data: HealthConnectData) => {
  const body: Record<string, unknown[]> = {};

  if (data.heartRateSamples?.length) {
    body.heart_rate = data.heartRateSamples.map(item => ({
      measured_at: item.time,
      bpm: item.bpm,
    }));
  }

  if (data.bloodPressureSamples?.length) {
    body.blood_pressure = data.bloodPressureSamples.map(item => ({
      measured_at: item.time,
      systolic: item.systolic,
      diastolic: item.diastolic,
    }));
  }

  if (data.oxygenSamples?.length) {
    body.oxygen = data.oxygenSamples.map(item => ({
      measured_at: item.time,
      percentage: item.percentage,
    }));
  }

  // Health Connect는 걸음 수를 오늘 합계로만 준다(기기 간 중복 제거된 값).
  // 하루 한 행(폰 시간 기준 오늘 0시~내일 0시)으로 두고 다시 열 때마다 합계를 덮어쓴다.
  if (typeof data.stepsTotal === 'number') {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    body.steps = [
      {
        start_time: dayStart.toISOString(),
        end_time: dayEnd.toISOString(),
        count: Math.round(data.stepsTotal),
      },
    ];
  }

  if (data.sleepSessions?.length) {
    body.sleep = data.sleepSessions.map(item => ({
      start_time: item.startTime,
      end_time: item.endTime,
    }));
  }

  if (Object.keys(body).length === 0) return;

  await request('POST', '/api/health/records', {body});
};
