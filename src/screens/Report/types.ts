export type MetricType = 'heartRate' | 'bloodPressure';
export type ReportPeriod = 'day' | 'week' | 'month';
export type ReportTab = 'daily' | 'weekly';
export type StressPeriod = 'week' | 'month';

export interface HrvPoint {
  time: string;
  hrv: number;
  stress: number;
  note?: string;
}

export interface StressCause {
  cause: string;
  count: number;
  percentage: number;
}

export interface MetricConfig {
  label: string;
  unit: string;
  chartTitle: string;
  // 차트 막대 높이 계산에 쓰는 최소 기준값 (데이터가 더 크면 데이터 최댓값을 사용)
  chartBaseMax: number;
}

export interface DailyStress {
  date: string; // YYYY-MM-DD
  score: number; // 0~100 일일 스트레스 지수
  causes: string[];
}

// GET /reports/weekly/:weekStart 응답 형태 (docs/backend-api-requirements.md 1-4)
export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  days: DailyStress[];
  causes: {cause: string; count: number}[];
}
