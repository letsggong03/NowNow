import {request} from './client';

export type ChatRole = 'USER' | 'ASSISTANT';

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

// 사용자는 서버가 로그인 토큰으로 정한다. user_id는 보내지 않는다.
export const saveChatMessage = async (chat_role: ChatRole, message: string) => {
  const res = await request<{message: string; data: ChatMessageRecord}>(
    'POST',
    '/api/chat/messages',
    {body: {chat_role, message}},
  );
  return res.data;
};

// created_at 오름차순
export const getChatMessages = async () => {
  const res = await request<{message: string; data: ChatMessageRecord[]}>(
    'GET',
    '/api/chat/messages',
  );
  return res.data;
};

export const deleteChatMessage = async (chat_id: number) => {
  await request('DELETE', `/api/chat/messages/${chat_id}`);
};

export const saveChatSummary = async (chat_id: number, summary: string, keywords: string[] = []) => {
  const res = await request<{message: string; data: ChatSummaryRecord}>(
    'POST',
    '/api/chat/summary',
    {body: {chat_id, summary, keywords}},
  );
  return res.data;
};

export type ChatTurn = {role: 'user' | 'assistant'; content: string};

export const requestChatReply = async (message: string, history: ChatTurn[]) => {
  const res = await request<{data: {reply: string; suggestion?: 'stress' | 'blood_pressure' | 'sleep' | 'steps'}}>('POST', '/api/chat/reply', {
    body: {message, history, useHealthContext: true},
  });
  return res.data;
};

// created_at 최신순
export const getChatSummaries = async () => {
  const res = await request<{message: string; data: ChatSummaryRecord[]}>(
    'GET',
    '/api/chat/summary',
  );
  return res.data;
};
