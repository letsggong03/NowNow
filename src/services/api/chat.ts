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

export type ChatSuggestion = 'stress' | 'blood_pressure' | 'sleep' | 'steps';

// 서버가 질문과 답변을 둘 다 저장하고, 오늘 대화로 맥락을 만든다. 앱은 따로 저장하지 않는다.
type ReplyResponse = {data: {
  reply: string;
  suggestion?: ChatSuggestion;
  userMessageId: number;
  assistantMessageId: number | null;
}};

export const requestChatReply = async (message: string) => {
  const res = await request<ReplyResponse>('POST', '/api/chat/reply', {
    body: {message, useHealthContext: true},
  });
  return res.data;
};

// 대화 끝 "해결책 줘" 버튼. 지시문은 서버가 만들고, 사용자 메시지로 저장하지 않는다. 답변은 서버가 저장한다.
export const requestSolution = async (keywords: string[]) => {
  const res = await request<{data: Omit<ReplyResponse['data'], 'userMessageId'>}>('POST', '/api/chat/reply', {
    body: {intent: 'solution', keywords, useHealthContext: true},
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
