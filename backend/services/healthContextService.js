const supabase = require('../config/supabase');
const fetchAll = require('../utils/fetchAll');
const {kstDayRange, datesBetween} = require('../utils/kstDate');
const {queryWindow, questionFocus, retrieve} = require('../../shared/healthRetrieval');
async function getContext(userId, question) {
  if (!userId) throw new Error('로그인한 사용자 확인이 필요합니다.');
  // Every query uses the user verified by the team's API middleware.
  const range = queryWindow(question);
  const {start, end} = kstDayRange(range.from, datesBetween(range.from, range.to).length);
  const data = {heartRates: [], bloodPressures: [], steps: [], sleeps: []};
  const status = [];
  const defs = [
    ['heartRates', 'heart_rate_records', 'measured_at,bpm', 'measured_at'],
    ['bloodPressures', 'blood_pressure_records', 'measured_at,systolic,diastolic', 'measured_at'],
    ['steps', 'steps_records', 'start_time,end_time,count', 'start_time'],
    ['sleeps', 'sleep_records', 'start_time,end_time', 'end_time']
  ];
  await Promise.all(defs.map(async ([key, table, fields, time]) => {
    try {data[key] = await fetchAll(() => supabase.from(table).select(fields).eq('user_id', userId)
      .gte(time, start).lt(time, end).order(time, {ascending: true}));}
    catch {
      status.push(`${table}: 조회 실패`);
    }
  }));
  const context = retrieve(question, range, data, status);
  // The chat module must use the team's stored scores, never its own computed score.
  context.missing = datesBetween(range.from, range.to);
  try {
    const scores = await fetchAll(() => supabase.from('daily_stress_scores')
      .select('record_date,final_score,missing').eq('user_id', userId)
      .gte('record_date', range.from).lte('record_date', range.to).order('record_date', {ascending: false}));
    const stored = scores.filter(row => !row.missing?.includes('demo_fixture') &&
      row.final_score !== null && Number.isFinite(Number(row.final_score)));
    const dates = new Set(stored.map(row => row.record_date));
    const scoreDocs = stored.map(row => ({kind: 'stress', date: row.record_date,
      source: '저장된 생활관리 지표', facts: {score: Number(row.final_score), unit: '점/100'}}));
    context.documents = [...scoreDocs, ...context.documents];
    context.missing = context.missing.filter(date => !dates.has(date));
    if (range.from !== range.to && stored.length) {
      context.documents.unshift({id: 'stress-period', kind: 'stress', date: range.to,
        source: '저장된 생활관리 지표의 기간 통계',
        facts: {unit: '점/100', days: stored.length,
          average: Math.round(stored.reduce((sum, row) => sum + Number(row.final_score), 0) / stored.length * 10) / 10,
          from: range.from, to: range.to}});
    }
  } catch {
    context.status.push('저장 스트레스 조회 실패');
  }
  try {
    const summaries = await fetchAll(() => supabase.from('chat_summaries').select('keywords,created_at')
      .eq('user_id', userId).gte('created_at', start).lt('created_at', end).order('created_at', {ascending: false}));
    if (summaries.length) context.documents.unshift({id: 'conversation-summary', kind: 'diary', date: range.to,
      source: '사용자가 저장한 대화 요약', facts: {records: summaries.slice(0, 3).map(row => ({
        date: require('../utils/kstDate').kstDateOf(row.created_at), keywords: row.keywords}))}});
  } catch {context.status.push('저장된 키워드 조회 실패');}
  const focus = questionFocus(question);
  context.documents.sort((a, b) => Number(b.kind === focus) - Number(a.kind === focus));
  context.documents = context.documents.slice(0, 6).map(doc => ({...doc, source: doc.source.replace('/Health Connect', '')}));
  return context;
}
module.exports = {getContext};
