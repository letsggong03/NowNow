import type {
  HrvPoint,
  MetricConfig,
  MetricType,
  ReportTab,
  StressCause,
  StressPeriod,
} from '../types';

export const reportTabs: {key: ReportTab; label: string}[] = [
  {key: 'daily', label: '실시간 리포트'},
  {key: 'weekly', label: '주간 리포트'},
];

export const stressPeriodOptions: {key: StressPeriod; label: string}[] = [
  {key: 'week', label: '주간'},
  {key: 'month', label: '월간'},
];

export const metricConfig: Record<MetricType, MetricConfig> = {
  heartRate: {
    label: '심박수',
    unit: 'bpm',
    chartTitle: '최근 24시간 심박수 변화',
    chartBaseMax: 120,
  },
  bloodPressure: {
    label: '혈압',
    unit: 'mmHg',
    chartTitle: '최근 24시간 혈압 변화',
    chartBaseMax: 150,
  },
};

export const WEEKLY_REPORT_COUNT = 4;

export const insightFallbacks = {
  peakNote: '업무 관련 스트레스',
  lowestNote: '수면 중 안정적인 흐름',
};

export const todayHRVData: HrvPoint[] = [
  {time: '00:00', hrv: 65, stress: 45},
  {time: '03:00', hrv: 75, stress: 35},
  {time: '06:00', hrv: 70, stress: 40},
  {time: '09:00', hrv: 55, stress: 65},
  {time: '12:00', hrv: 50, stress: 70},
  {time: '14:00', hrv: 45, stress: 85, note: '프로젝트 회의'},
  {time: '15:00', hrv: 48, stress: 82},
  {time: '18:00', hrv: 60, stress: 55},
  {time: '21:00', hrv: 70, stress: 40},
  {time: '23:00', hrv: 75, stress: 35},
];

type StressCount = Omit<StressCause, 'percentage'>;

export const weeklyStressData: StressCount[] = [
  {cause: '업무 스트레스', count: 4},
  {cause: '부장/팀장', count: 3},
  {cause: '야근', count: 2},
  {cause: '기타', count: 1},
];

export const monthlyStressData: StressCount[] = [
  {cause: '업무 스트레스', count: 15},
  {cause: '부장/팀장', count: 10},
  {cause: '야근', count: 5},
  {cause: '대인관계', count: 2},
  {cause: '기타', count: 1},
];

export const STRESS_SCORE_MAX = 100;

// 일일 스트레스 지수 구간. min 이상이면 해당 단계로 본다.
export const stressLevels: {
  min: number;
  label: string;
  colorKey: 'stressWorst' | 'stressBad' | 'stressNormal';
}[] = [
  {min: 70, label: '최악', colorKey: 'stressWorst'},
  {min: 40, label: '나쁨', colorKey: 'stressBad'},
  {min: 0, label: '보통', colorKey: 'stressNormal'},
];

export const getStressLevel = (score: number) =>
  stressLevels.find(level => score >= level.min) ?? stressLevels[stressLevels.length - 1];
