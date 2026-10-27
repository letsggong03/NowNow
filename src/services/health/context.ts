import {NativeModules} from 'react-native';
import {supabase} from '../supabase';
import {request} from '../api/client';
import {backendConfig} from '../api/backendConfig';
import {syncHealth} from './sync';
const {queryWindow, retrieve} = require('../../../shared/healthRetrieval');
const {kstToday, kstDayRange, datesBetween} = require('../../../backend/utils/kstDate');
export type HealthContext = {range: {from: string; to: string}; documents: {id: string; kind: string; date: string; source: string; facts: Record<string, unknown>}[]; status: string[]; missing: string[]; notice: string};

export async function retrieveHealthContext(question: string): Promise<HealthContext> {
  const range = queryWindow(question);
  const status: string[] = [];
  const data: Record<string, any[]> = {heartRates: [], bloodPressures: [], steps: [], sleeps: []};
  const {data: auth} = await supabase.auth.getSession();
  if (backendConfig.url && auth.session && range.to !== kstToday()) {
    try {
      const result = await request<{data: HealthContext}>('GET', '/api/chat/context', {query: {question}});
      // Also read device below: it may contain measurements not synced to DB yet.
      if (result.data.documents.length && range.to !== kstToday()) return result.data;
    } catch { status.push('팀 서버 조회 실패 · 폰/본인 Supabase 기록으로 조회'); }
  }
  if (auth.session) {
    const {start, end} = kstDayRange(range.from, datesBetween(range.from, range.to).length);
    const definitions = [
      ['heartRates', 'heart_rate_records', 'measured_at,bpm', 'measured_at'],
      ['bloodPressures', 'blood_pressure_records', 'measured_at,systolic', 'measured_at'],
      ['steps', 'steps_records', 'start_time,end_time,count', 'start_time'],
      ['sleeps', 'sleep_records', 'start_time,end_time', 'end_time'],
    ];
    await Promise.all(definitions.map(async ([key, table, fields, time]) => {
      try {
        for (let page = 0; page < 10; page++) {
          const result = await supabase.from(table).select(fields).eq('user_id', auth.session!.user.id)
            .gte(time, start).lt(time, end).order(time, {ascending: true}).range(page * 1000, page * 1000 + 999);
          if (result.error) {status.push(`${table}: 권한/조회 오류`); break;}
          data[key].push(...(result.data || []));
          if (!result.data || result.data.length < 1000) break;
          if (page === 9) status.push(`${table}: 일부 기록만 조회됨`);
        }
      } catch {status.push(`${table}: 연결 오류`);}
    }));
  } else status.push('로그인 안 됨 · 계정 DB 조회 제외');
  if (range.to === kstToday() && NativeModules.HealthConnectModule) {
    try {
      const local = await NativeModules.HealthConnectModule.getHealthData();
      status.push(...await syncHealth(local));
      data.heartRates.push(...(local.heartRateSamples || []).map((r: any) => ({measured_at: r.time, bpm: r.bpm})));
      data.bloodPressures.push(...(local.bloodPressureSamples || []).map((r: any) => ({measured_at: r.time, systolic: r.systolic})));
      const {start, end} = kstDayRange(kstToday());
      if (Number.isFinite(local.stepsTotal)) {
        data.steps = data.steps.filter(r => r.start_time < start || r.start_time >= end);
        data.steps.push({start_time: start, end_time: end, count: local.stepsTotal});
      }
      data.sleeps.push(...(local.sleepSessions || []).map((r: any) => ({start_time: r.startTime, end_time: r.endTime})));
      status.push('Health Connect 직접 조회 완료');
    } catch {status.push('Health Connect 권한/연결 오류 · 리포트에서 권한 확인');}
  }
  // Duplicate phone/DB measurements must not change sample counts or scores.
  for (const key of Object.keys(data)) {
    data[key] = Array.from(new Map(data[key].map(row => [row.measured_at ? String(Date.parse(row.measured_at)) : `${Date.parse(row.start_time)}/${Date.parse(row.end_time)}`, row])).values());
  }
  data.heartRates.sort((a, b) => a.measured_at.localeCompare(b.measured_at));
  return retrieve(question, range, data, status);
}
