const supabase = require('../config/supabase');
const fetchAll = require('../utils/fetchAll');
const {kstDayRange, datesBetween} = require('../utils/kstDate');
const {queryWindow, retrieve} = require('../../shared/healthRetrieval');
async function getContext(userId, question) {
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
    catch {status.push(`${table}: 권한/조회 오류`);}
  }));
  return retrieve(question, range, data, status);
}
module.exports = {getContext};
