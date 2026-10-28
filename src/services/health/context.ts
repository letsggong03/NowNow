import {request} from '../api/client';
import {NativeModules} from 'react-native';
const {queryWindow, retrieve} = require('../../../shared/healthRetrieval');
const {kstToday, kstDayRange} = require('../../../backend/utils/kstDate');
const {mergeHealthContext} = require('../../../shared/mergeHealthContext');
export type HealthContext = {range: {from: string; to: string}; documents: {id: string; kind: string; date: string; source: string; facts: Record<string, unknown>}[]; status: string[]; missing: string[]; notice: string; demo?: boolean};

// Both sources are read-only. Chat must never invoke health synchronization.
export async function retrieveHealthContext(question: string): Promise<HealthContext> {
  const range = queryWindow(question);
  let database: HealthContext;
  let apiError: unknown;
  try {
    database = (await request<{data: HealthContext}>('GET', '/api/chat/context', {query: {question}})).data;
  } catch (error) {
    apiError = error;
    database = {range, documents: [], status: ['팀 DB 조회 실패'], missing: [], notice: '서버 연결을 확인해 주세요.'};
  }
  if (range.to !== kstToday() || !NativeModules.HealthConnectModule) {
    if (apiError) throw apiError;
    return database;
  }
  try {
    const local = await NativeModules.HealthConnectModule.getHealthData();
    const {start, end} = kstDayRange(kstToday());
    const device = retrieve(question, range, {
      heartRates: (local.heartRateSamples || []).map((row: any) => ({measured_at: row.time, bpm: row.bpm})),
      bloodPressures: (local.bloodPressureSamples || []).map((row: any) => ({measured_at: row.time, systolic: row.systolic})),
      steps: Number.isFinite(local.stepsTotal) ? [{start_time: start, end_time: end, count: local.stepsTotal}] : [],
      sleeps: (local.sleepSessions || []).map((row: any) => ({start_time: row.startTime, end_time: row.endTime})),
    }, ['Health Connect 직접 조회 완료']);
    return mergeHealthContext(database, device);
  } catch {
    database.status.push('Health Connect 조회 실패 · 권한과 연결 확인');
    if (apiError) throw apiError;
    return database;
  }
}
