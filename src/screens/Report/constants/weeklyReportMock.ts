import {addDays, format} from 'date-fns';

import type {DailyStress, WeeklyReport} from '../types';

// TODO: 백엔드 GET /reports/weekly/:weekStart 가 준비되면 이 목업을 API 호출로 교체한다.

const MOCK_CAUSES = ['업무 스트레스', '부장/팀장', '야근', '대인관계', '수면 부족'];

// 주마다 다른 값이 나오되, 같은 주는 항상 같은 값이 나오도록 시드 기반 난수를 쓴다.
const createSeededRandom = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

export const createMockWeeklyReport = (weekStart: Date): WeeklyReport => {
  const random = createSeededRandom(Math.floor(weekStart.getTime() / 86400000));

  const days: DailyStress[] = Array.from({length: 7}, (_, index) => {
    const score = Math.round(30 + random() * 60);
    const causeCount = score >= 70 ? 2 : score >= 50 ? 1 : 0;
    const causes = Array.from(
      new Set(
        Array.from(
          {length: causeCount},
          () => MOCK_CAUSES[Math.floor(random() * MOCK_CAUSES.length)],
        ),
      ),
    );

    return {
      date: format(addDays(weekStart, index), 'yyyy-MM-dd'),
      score,
      causes,
    };
  });

  const causeCounts = new Map<string, number>();
  days.forEach(day =>
    day.causes.forEach(cause =>
      causeCounts.set(cause, (causeCounts.get(cause) ?? 0) + 1),
    ),
  );

  return {
    weekStart: days[0].date,
    weekEnd: days[days.length - 1].date,
    days,
    causes: [...causeCounts.entries()]
      .map(([cause, count]) => ({cause, count}))
      .sort((a, b) => b.count - a.count),
  };
};
