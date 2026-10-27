import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from './supabase';
const {kstToday, addDays} = require('../../backend/utils/kstDate');
const {countCauses} = require('../../backend/services/insightCalculator');
type Summary = {date: string; summary: string; keywords: string[]};
let writes: Promise<unknown> = Promise.resolve();
async function key() {
  const {data} = await supabase.auth.getSession();
  if (!data.session) throw new Error('로그인이 필요해요.');
  return '@nownow/report-summaries/' + data.session.user.id;
}
export async function recordReportSummary(summary: string, keywords: string[]) {
  const storageKey = await key();
  const date = kstToday();
  const task = writes.then(async () => {
    const rows: Summary[] = JSON.parse(await AsyncStorage.getItem(storageKey) || '[]');
    await AsyncStorage.setItem(storageKey, JSON.stringify([...rows.filter(row => row.date !== date), {date, summary, keywords}]));
  });
  writes = task.catch(() => {});
  await task;
}
export async function localReportCauses(period: 'week'|'month') {
  await writes;
  const rows: Summary[] = JSON.parse(await AsyncStorage.getItem(await key()) || '[]');
  const to = kstToday(), from = addDays(to, period === 'week' ? -6 : -29);
  const selected = rows.filter(row => row.date >= from && row.date <= to && Array.isArray(row.keywords));
  return {causes: countCauses(selected), summaries: selected.length};
}
