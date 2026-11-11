import {request} from './client';

export async function getTodayBloodPressure() {
  const {data} = await request<{data: {measured_at: string; systolic: number; diastolic: number}[]}>('GET', '/api/health/blood-pressure');
  return data.map(row => ({time: row.measured_at, systolic: row.systolic, diastolic: row.diastolic}));
}

// 직접 입력한 혈압 저장용. Health Connect 기록은 services/health/healthSync.ts가 증분 동기화로 보낸다.
// (예전에는 여기서 오늘 걸음 수 합계를 하루 한 행으로 보냈는데, 이제 시간별 행으로 바뀌어서
//  같이 쓰면 걸음 수가 두 번 더해진다. 그래서 걸음 수·수면·심박은 받지 않는다.)
export interface ManualHealthRecords {
  bloodPressureSamples?: {time: string; systolic: number; diastolic: number}[];
}

export const saveHealthRecords = async (data: ManualHealthRecords) => {
  if (!data.bloodPressureSamples?.length) return;
  await request('POST', '/api/health/records', {
    body: {
      blood_pressure: data.bloodPressureSamples.map(item => ({
        measured_at: item.time,
        systolic: item.systolic,
        diastolic: item.diastolic,
      })),
    },
  });
};
