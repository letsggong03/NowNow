const db = require('../config/supabase');
const fetchAll = require('../utils/fetchAll');
const {kstDayRange, datesBetween} = require('../utils/kstDate');
const {queryWindow, retrieve} = require('../../shared/healthRetrieval');
async function getContext(userId, question) {
  if (!userId) throw new Error('로그인한 사용자 확인이 필요합니다.');
  // Service role lives only on the server. All reads are explicitly user-scoped.
  const supabase = db.adminReadClient();
  const range = queryWindow(question);
  const {start, end} = kstDayRange(range.from, datesBetween(range.from, range.to).length);
  const data = {heartRates: [], bloodPressures: [], steps: [], sleeps: []};
  const status = [];
  const defs = [
    ['heartRates', 'heart_rate_records', 'measured_at,bpm', 'measured_at'],
    ['bloodPressures', 'blood_pressure_records', 'measured_at,systolic', 'measured_at'],
    ['steps', 'steps_records', 'start_time,end_time,count', 'start_time'],
    ['sleeps', 'sleep_records', 'start_time,end_time', 'end_time']
  ];
  await Promise.all(defs.map(async ([key, table, fields, time]) => {
    try {data[key] = await fetchAll(() => supabase.from(table).select(fields).eq('user_id', userId)
      .gte(time, start).lt(time, end).order(time, {ascending: true}));}
    catch (error) {
      console.error('[health-context]', table, error.code, error.message, error.details);
      status.push(`${table}: 조회 실패 (${error.code || 'NETWORK'})`);
    }
  }));
  const context = retrieve(question, range, data, status);
  // The chat module must use the team's stored scores, never its own computed score.
  context.documents = context.documents.filter(doc => doc.kind !== 'stress');
  context.missing = datesBetween(range.from, range.to);
  try {
    const scores = await fetchAll(() => supabase.from('daily_stress_scores')
      .select('record_date,final_score,missing').eq('user_id', userId)
      .gte('record_date', range.from).lte('record_date', range.to).order('record_date', {ascending: false}));
    const stored = scores.filter(row => row.final_score !== null && Number.isFinite(Number(row.final_score)));
    const dates = new Set(stored.map(row => row.record_date));
    context.documents = context.documents.filter(doc => doc.kind !== 'stress' || !dates.has(doc.date));
    const scoreDocs = stored.map(row => ({id: `stress:${row.record_date}`, kind: 'stress', date: row.record_date,
      source: row.missing?.includes('demo_fixture') ? '시연용 합성 스트레스 기록 · 실제 측정 아님' : '팀 DB daily_stress_scores',
      facts: {score: Number(row.final_score), unit: '점/100', demo: !!row.missing?.includes('demo_fixture')}}));
    context.documents = [...scoreDocs, ...context.documents];
    context.missing = context.missing.filter(date => !dates.has(date));
    context.demo = scoreDocs.some(doc => doc.facts.demo);
    if (/주|월|기간|일주일|7일|30일/.test(question) && stored.length) {
      context.documents.unshift({id: 'stress-period', kind: 'stress', date: range.to,
        source: context.demo ? '팀 DB 기간 통계 · 시연용 합성 기록 포함' : '팀 DB 기간 통계',
        facts: {unit: '점/100', days: stored.length,
          average: Math.round(stored.reduce((sum, row) => sum + Number(row.final_score), 0) / stored.length * 10) / 10,
          records: stored.map(row => ({date: row.record_date, score: Number(row.final_score), demo: !!row.missing?.includes('demo_fixture')}))}});
    }
  } catch (error) {
    console.error('[health-context] daily_stress_scores', error.code, error.message);
    context.status.push(`저장 스트레스 조회 실패 (${error.code || 'NETWORK'})`);
  }
  try {
    const summaries = await fetchAll(() => supabase.from('chat_summaries').select('summary,keywords,created_at')
      .eq('user_id', userId).gte('created_at', start).lt('created_at', end).order('created_at', {ascending: false}));
    if (summaries.length) context.documents.unshift({id: 'conversation-summary', kind: 'diary', date: range.to,
      source: '팀 DB 날짜별 대화 요약', facts: {summaries: summaries.slice(0, 3).map(row => ({
        date: require('../utils/kstDate').kstDateOf(row.created_at), summary: row.summary.slice(0, 250), keywords: row.keywords}))}});
  } catch (error) {console.error('[health-context] chat_summaries', error.code, error.message);}
  const focus = /수면|잠|피곤/.test(question) ? 'sleep' : /걸음|활동|운동/.test(question) ? 'steps' : /혈압/.test(question) ? 'bp' : /심박|맥박/.test(question) ? 'heart' : 'stress';
  context.documents.sort((a, b) => Number(b.kind === focus) - Number(a.kind === focus));
  context.documents = context.documents.slice(0, 6).map(doc => ({...doc, source: doc.source.replace('/Health Connect', '')}));
  return context;
}
module.exports = {getContext};
