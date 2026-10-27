import {supabase} from '../supabase';
const {kstToday, kstDayRange} = require('../../../backend/utils/kstDate');
export async function syncHealth(data: any): Promise<string[]> {
  const {data: auth} = await supabase.auth.getSession();
  if (!auth.session) return ['로그인 안 됨 · 건강 기록은 폰에서만 조회'];
  const user_id = auth.session.user.id;
  const errors: string[] = [];
  const batches: [string, any[], string][] = [
    ['heart_rate_records', (data.heartRateSamples || []).map((r: any) => ({user_id, measured_at: r.time, bpm: r.bpm})), 'user_id,measured_at'],
    ['blood_pressure_records', (data.bloodPressureSamples || []).map((r: any) => ({user_id, measured_at: r.time, systolic: r.systolic, diastolic: r.diastolic})), 'user_id,measured_at'],
    ['oxygen_records', (data.oxygenSamples || []).map((r: any) => ({user_id, measured_at: r.time, percentage: r.percentage})), 'user_id,measured_at'],
    ['sleep_records', (data.sleepSessions || []).map((r: any) => ({user_id, start_time: r.startTime, end_time: r.endTime})), 'user_id,start_time,end_time'],
  ];
  if (Number.isFinite(data.stepsTotal)) {
    const {start, end} = kstDayRange(kstToday());
    batches.push(['steps_records', [{user_id, start_time: start, end_time: end, count: data.stepsTotal}], 'user_id,start_time,end_time']);
  }
  await Promise.all(batches.map(async ([table, rows, onConflict]) => {
    try {
      for (let i = 0; i < rows.length; i += 500) {
        const {error} = await supabase.from(table).upsert(rows.slice(i, i + 500), {onConflict});
        if (error) {errors.push(`${table}: 저장 권한/스키마 확인 필요`); break;}
      }
    } catch {errors.push(`${table}: 저장 연결 오류`);}
  }));
  return errors;
}
