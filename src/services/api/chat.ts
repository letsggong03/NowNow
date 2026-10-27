import {getCurrentUserId, request} from './client';

// 명세상 'USER' 또는 AI 역할. AI 쪽 값은 백엔드와 확정 필요.
export type ChatRole = 'USER' | 'AI';

export interface ChatMessageRecord {
  chat_id: number;
  user_id: string;
  chat_role: ChatRole;
  message: string;
  created_at: string;
}

export interface ChatSummaryRecord {
  chat_id: number;
  user_id: string;
  summary: string;
  created_at: string;
}

export const saveChatMessage = async (chat_role: ChatRole, message: string) => {
  const user_id = await getCurrentUserId();
  const res = await request<{message: string; data: ChatMessageRecord}>(
    'POST',
    '/api/chat/messages',
    {body: {user_id, chat_role, message}},
  );
  return res.data;
};

// created_at 오름차순
export const getChatMessages = async () => {
  const user_id = await getCurrentUserId();
  const res = await request<{message: string; data: ChatMessageRecord[]}>(
    'GET',
    '/api/chat/messages',
    {query: {user_id}},
  );
  return res.data;
};

export const deleteChatMessage = async (chat_id: number) => {
  const user_id = await getCurrentUserId();
  await request('DELETE', `/api/chat/messages/${chat_id}`, {
    body: {user_id},
  });
};

export const saveChatSummary = async (chat_id: number, summary: string) => {
  const user_id = await getCurrentUserId();
  const res = await request<{message: string; data: ChatSummaryRecord}>(
    'POST',
    '/api/chat/summary',
    {body: {chat_id, user_id, summary}},
  );
  return res.data;
};

// created_at 최신순
export const getChatSummaries = async () => {
  const user_id = await getCurrentUserId();
  const res = await request<{message: string; data: ChatSummaryRecord[]}>(
    'GET',
    '/api/chat/summary',
    {query: {user_id}},
  );
  return res.data;
};
