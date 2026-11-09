import {request} from './client';

export type AiRecommendation =
  | {status: 'no_records'}
  | {status: 'ready'; message: string; routine: {title: string; steps: string[]} | null; action?: 'walk_map' | 'movies' | 'music' | 'delivery' | null; musicQuery?: string};

export async function createAiRecommendation() {
  const {data} = await request<{data: AiRecommendation}>('POST', '/api/reports/ai-recommendation');
  return data;
}

export interface HealthReport {
  health_report_id: number;
  user_id: string;
  heart_rate: number;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  measured_at: string;
}

export interface CreateReportParams {
  heart_rate: number;
  measured_at: string;
  systolic_bp?: number;
  diastolic_bp?: number;
}

export const createReport = async (params: CreateReportParams) => {
  const res = await request<{message: string; data: HealthReport}>(
    'POST',
    '/api/reports',
    {body: params},
  );
  return res.data;
};

// measured_at 최신순
export const getReports = async () => {
  const res = await request<{message: string; data: HealthReport[]}>(
    'GET',
    '/api/reports',
  );
  return res.data;
};

export const getReport = async (health_report_id: number) => {
  const res = await request<{message: string; data: HealthReport}>(
    'GET',
    `/api/reports/${health_report_id}`,
  );
  return res.data;
};

export const deleteReport = async (health_report_id: number) => {
  await request('DELETE', `/api/reports/${health_report_id}`);
};
