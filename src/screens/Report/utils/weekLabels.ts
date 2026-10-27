import {addDays, format, startOfWeek, subWeeks} from 'date-fns';

const WEEK_ORDINALS = ['첫째', '둘째', '셋째', '넷째', '다섯째'];

// 한 주는 목요일이 속한 달의 주로 본다. 예) 2026년 10월 셋째 주
const formatWeekLabel = (weekStart: Date) => {
  const thursday = addDays(weekStart, 3);
  const ordinal = WEEK_ORDINALS[Math.ceil(thursday.getDate() / 7) - 1];

  return `${format(thursday, 'yyyy년 M월')} ${ordinal} 주`;
};

// 이번 주를 제외한 최근 완료된 주들을 최신순으로 반환한다.
export const getRecentWeeks = (count: number, baseDate = new Date()) => {
  const thisWeekStart = startOfWeek(baseDate, {weekStartsOn: 1});

  return Array.from({length: count}, (_, index) => {
    const weekStart = subWeeks(thisWeekStart, index + 1);

    return {
      key: format(weekStart, 'yyyy-MM-dd'),
      start: weekStart,
      label: formatWeekLabel(weekStart),
    };
  });
};
