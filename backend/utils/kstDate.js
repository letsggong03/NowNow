// 한국 시간(UTC+9) 기준 날짜 계산. 서버 시간대와 상관없이 같은 결과를 낸다.
// 날짜는 모두 "YYYY-MM-DD" 문자열로 주고받는다.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const KST_OFFSET_MS = 9 * HOUR_MS;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toKstIso = ms =>
  new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 19) + "+09:00";

// 타임스탬프(ms 또는 ISO 문자열)가 한국 시간으로 며칠인지
const kstDateOf = value =>
  toKstIso(typeof value === "number" ? value : Date.parse(value)).slice(0, 10);

const startMsOf = date => Date.parse(`${date}T00:00:00+09:00`);

// 형식뿐 아니라 2월 30일 같은 없는 날짜도 걸러낸다.
function isDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const ms = startMsOf(value);
  return !Number.isNaN(ms) && kstDateOf(ms) === value;
}

// date 0시부터 days일 뒤 0시까지 (ISO 문자열). 잘못된 날짜면 null.
function kstDayRange(date, days = 1) {
  if (!isDate(date)) return null;
  const startMs = startMsOf(date);
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + days * DAY_MS).toISOString()
  };
}

const addDays = (date, days) => kstDateOf(startMsOf(date) + days * DAY_MS);

const kstToday = () => kstDateOf(Date.now());

// 그 주의 월요일
function weekStartOf(date) {
  const dayOfWeek = new Date(startMsOf(date) + KST_OFFSET_MS).getUTCDay();
  return addDays(date, -((dayOfWeek + 6) % 7));
}

// from ~ to (둘 다 포함)
function datesBetween(from, to) {
  const dates = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

module.exports = {
  HOUR_MS,
  toKstIso,
  kstDateOf,
  isDate,
  kstDayRange,
  addDays,
  kstToday,
  weekStartOf,
  datesBetween
};
