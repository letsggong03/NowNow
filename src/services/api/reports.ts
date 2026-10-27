import {getCurrentUserId, request} from './client';

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
  const user_id = await getCurrentUserId();
  const res = await request<{message: string; data: HealthReport}>(
    'POST',
    '/api/reports',
    {body: {user_id, ...params}},
  );
  return res.data;
};

// measured_at 최신순
export const getReports = async () => {
  const user_id = await getCurrentUserId();
  const res = await request<{message: string; data: HealthReport[]}>(
    'GET',
    '/api/reports',
    {query: {user_id}},
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
  const user_id = await getCurrentUserId();
  await request('DELETE', `/api/reports/${health_report_id}`, {
    body: {user_id},
  });
};
