const db = require('../config/supabase');
const {addDays, kstDayRange, kstToday} = require('../utils/kstDate');

const mean = values => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
const risk = facts => facts.systolic >= 135 || facts.diastolic >= 85;

async function stressChange(userId, today = kstToday()) {
  const {data, error} = await db.from('daily_stress_scores').select('record_date,final_score,missing')
    .eq('user_id', userId).gte('record_date', addDays(today, -14)).lte('record_date', today).limit(15);
  if (error) throw error;
  const scores = (data ?? []).filter(row => row.final_score !== null && !row.missing?.includes('demo_fixture'))
    .map(row => ({date: row.record_date, score: Number(row.final_score)})).filter(row => Number.isFinite(row.score));
  const current = scores.find(row => row.date === today) ?? scores.find(row => row.date === addDays(today, -1));
  if (!current) return null;
  const previous = scores.filter(row => row.date < current.date);
  if (previous.length < 3) return null;
  const baseline = mean(previous.map(row => row.score));
  return current.score - baseline >= 5 ? {day: current.date, score: current.score, baseline} : null;
}

async function personalHealthCheck(user, question, context) {
  if (/어제|지난|\d{4}-\d{2}-\d{2}/.test(question)) return null;
  const today = kstToday();
  const facts = kind => context?.documents.find(row => row.kind === kind && row.date === today)?.facts;
  if (question === '오늘의 건강 기록 알려줘' || question.startsWith('뿡뿡아, 오늘 내 건강 기록은 어때?')) {
    const heart = facts('heart');
    const bp = facts('bp');
    const steps = facts('steps');
    const sleep = facts('sleep');
    const stress = facts('stress');
    const lines = [
      steps && `오늘은 ${steps.count}걸음 걸었어.`,
      sleep && `수면은 ${Math.floor(sleep.minutes / 60)}시간 ${Math.floor(sleep.minutes % 60)}분 기록됐어.`,
      heart && `최근 심박수는 ${heart.latestBpm} bpm이고, 오늘 기록 평균은 ${heart.averageBpm} bpm이야.`,
      bp && `저장된 혈압은 ${bp.systolic}/${bp.diastolic} mmHg야.`,
      stress && `앱의 스트레스 지표는 ${stress.score}점이야.`,
    ].filter(Boolean);
    const step = sleep && sleep.minutes < 420
      ? '오늘 밤엔 평소보다 15분 일찍 쉬어볼까?'
      : '지금 편하게 앉아서 잠깐 어깨의 힘을 풀어볼까?';
    return {reply: lines.length
      ? `오늘의 건강 기록을 같이 봤어. ${lines.join(' ')}\n\n${step}`
      : '오늘 저장된 건강 기록은 아직 없어. 리포트에서 건강 기록을 동기화하고 다시 같이 볼까?'};
  }
  if (/혈압/.test(question) && facts('bp')) {
    const bp = facts('bp');
    const result = risk(bp) ? '가정혈압 참고 기준보다 높게 측정됐어요. 안정된 상태에서 다시 재고, 높게 나온 기록이 반복되면 의료진과 상의해요.'
      : bp.systolic < 90 || bp.diastolic < 60 ? '낮게 측정됐어요. 지금 어지럽거나 쓰러질 것 같은 느낌이 있나요?'
      : '이번 값은 가정혈압의 높은 기준 미만이에요. 비슷한 시간에 기록해 두면 흐름을 보기 좋아요.';
    const time = new Intl.DateTimeFormat('ko-KR', {timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false}).format(new Date(bp.measuredAt));
    const {start} = kstDayRange(addDays(today, -6));
    const {end} = kstDayRange(today);
    const {data} = await db.from('blood_pressure_records').select('measured_at,systolic,diastolic')
      .eq('user_id', user.id).gte('measured_at', start).lt('measured_at', end).limit(300);
    const days = new Map();
    for (const row of data ?? []) {
      const day = new Date(Date.parse(row.measured_at) + 9 * 3600000).toISOString().slice(0, 10);
      days.set(day, Boolean(days.get(day) || risk(row)));
    }
    const trend = days.size >= 3 ? ` 최근 기록이 있는 ${days.size}일 중 ${[...days.values()].filter(Boolean).length}일에 참고 기준을 넘은 측정이 있었어요.` : '';
    return {reply: `${time}에 저장된 혈압은 ${bp.systolic}/${bp.diastolic} mmHg예요. ${result}${trend}`, suggestion: 'blood_pressure'};
  }
  if (/수면|잠/.test(question) && Number.isFinite(facts('sleep')?.minutes)) {
    const age = Number(user.user_metadata?.nownow_age);
    if (!Number.isInteger(age) || age < 18 || age > 120) return null;
    const minutes = facts('sleep').minutes;
    const duration = `${Math.floor(minutes / 60)}시간 ${Math.round(minutes % 60)}분`;
    const recommendation = age >= 65 ? '7~8시간' : age >= 61 ? '7~9시간' : '7시간 이상';
    const tip = minutes < 420 ? '오늘은 조금 일찍 쉬어볼까요?' : '오늘도 편하게 잠들 준비를 해봐요.';
    return {reply: `오늘로 기록된 수면은 ${duration}이에요. 이 연령대 권장 수면은 ${recommendation}이에요. ${tip}`, suggestion: 'sleep'};
  }
  if (/걸음|걸었/.test(question) && Number.isFinite(facts('steps')?.count)) {
    const count = facts('steps').count;
    const goal = Number(user.user_metadata?.nownow_step_goal);
    if (Number.isInteger(goal) && goal >= 100 && goal <= 100000) {
      const remaining = Math.max(0, goal - count);
      return {reply: `오늘 저장된 기록은 ${count}걸음이에요. ${remaining ? `직접 정한 목표까지 ${remaining}걸음 남았어요. 몸이 편할 때 조금씩 걸어봐요.` : '오늘 목표에 도착했어요!'}`, suggestion: 'steps'};
    }
  }
  if (/스트레스|건강\s*기록/.test(question)) {
    const change = await stressChange(user.id, today);
    if (change) {
      const {day, score, baseline} = change;
      return {reply: `${day === today ? '오늘' : '어제'} 앱의 스트레스 지표는 ${score}점으로 그전 기록 평균 ${baseline}점보다 올라갔어요. 너는 지금 어떤 기분이야? 잠깐 쉬어가도 좋아요 🐾`, suggestion: 'stress'};
    }
  }
  return null;
}

module.exports = {personalHealthCheck, stressChange};
