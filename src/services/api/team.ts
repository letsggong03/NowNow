import {request, getCurrentUserId} from './client';
// Team Notion API contract. No credentials or synthetic records.
export const teamApi = {
  dailyStress: async (date: string) => request<any>('GET','/api/stress/daily',{query:{date,user_id:await getCurrentUserId()}}),
  realtimeStress: async (date: string) => request<any>('GET','/api/stress/realtime',{query:{date,user_id:await getCurrentUserId()}}),
  stressCauses: (period:'week'|'month') => request<any>('GET','/api/reports/stress-causes',{query:{period}}),
  recommendation: (date?:string) => request<any>('GET','/api/reports/recommendation',{query:{date}}),
  weeks: (limit=4) => request<any>('GET','/api/reports/weekly',{query:{limit}}),
  week: (weekStart:string) => request<any>('GET',`/api/reports/weekly/${weekStart}`),
  mood: (date:string) => request<any>('GET',`/api/moods/${date}`),
  saveMood: (date:string,mood:string) => request<any>('PUT',`/api/moods/${date}`,{body:{mood}}),
  interactions: (date?:string) => request<any>('GET','/api/character/interactions',{query:{date}}),
  interact: (action:string,choice?:string) => request<any>('POST','/api/character/interactions',{body:{action,choice}}),
  settings: () => request<any>('GET','/api/me/settings'),
  updateSettings: (body:{nickname?:string;status_message?:string|null;notification_enabled?:boolean;notify_time?:string|null;stress_threshold?:number;character_type?:string}) => request<any>('PUT','/api/me/settings',{body}),
  registerPush: (token:string,platform:'android'|'ios') => request<any>('POST','/api/me/push-tokens',{body:{token,platform}}),
  removePush: (token:string) => request<any>('DELETE',`/api/me/push-tokens/${encodeURIComponent(token)}`),
  deleteAccount: () => request<any>('DELETE','/api/me'),
};
