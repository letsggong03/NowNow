import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatAiConfig } from './api/chatAiConfig';
import * as backend from './api/chat';
import type { ChatMessageRecord, ChatRole } from './api/chat';

const DEMO_KEY = '@nownow/chatbot-demo/v1';
let writes: Promise<unknown> = Promise.resolve();
let serverStatus = '대화는 이 폰에 저장';
export const getServerSyncStatus = () => serverStatus;

export async function clearDemoMessages(): Promise<void> {
  if (chatAiConfig.demoMode !== true) {
    throw new Error('서버 대화 삭제는 지원하지 않습니다.');
  }
  const task = writes.then(async () => {
    await AsyncStorage.setItem(DEMO_KEY, '[]');
    await AsyncStorage.setItem(DEMO_KEY + '/summary', 'null');
  });
  writes = task.then(() => undefined, () => undefined);
  await task;
}

async function readLocal(): Promise<ChatMessageRecord[]> {
  const raw = await AsyncStorage.getItem(DEMO_KEY);
  if (raw === null) return [];
  const rows: unknown = JSON.parse(raw);
  if (
    !Array.isArray(rows) ||
    rows.some(
      row =>
        !row ||
        !Number.isSafeInteger(row.chat_id) ||
        row.user_id !== 'local-demo' ||
        !['USER', 'AI'].includes(row.chat_role) ||
        typeof row.message !== 'string' ||
        typeof row.created_at !== 'string' ||
        !Number.isFinite(Date.parse(row.created_at)),
    )
  ) {
    throw new Error('시연 대화 저장 형식을 확인할 수 없습니다.');
  }
  return rows;
}

export async function getChatMessages(): Promise<ChatMessageRecord[]> {
  if (chatAiConfig.demoMode !== true) return backend.getChatMessages();
  await writes;
  return readLocal();
}

export async function saveChatMessage(
  role: ChatRole,
  message: string,
): Promise<ChatMessageRecord> {
  if (chatAiConfig.demoMode !== true)
    return backend.saveChatMessage(role, message);
  const task = writes.then(async () => {
    const saved = await readLocal();
    const row: ChatMessageRecord = {
      chat_id: Math.max(Date.now(), ...saved.map(item => item.chat_id + 1)),
      user_id: 'local-demo',
      chat_role: role,
      message,
      created_at: new Date().toISOString(),
    };
    await AsyncStorage.setItem(DEMO_KEY, JSON.stringify([...saved, row]));
    if ((chatAiConfig as {syncToServer?: boolean}).syncToServer) {
      try {
        const server = await backend.saveChatMessage(role, message);
        row.server_chat_id = server.chat_id;
        await AsyncStorage.setItem(DEMO_KEY, JSON.stringify([...saved, row]));
        serverStatus = '본인 계정 서버 저장 완료 · 폰에도 보관';
      } catch {serverStatus = '폰 저장 완료 · 서버 저장 실패(연결/로그인 확인)';}
    }
    return row;
  });
  writes = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}

export async function persistSummary(summary: string, keywords: string[]): Promise<string> {
  await (await import('./reportRecords')).recordReportSummary(summary, keywords);
  if (chatAiConfig.demoMode !== true) {
    const records = await backend.getChatMessages();
    const last = records[records.length - 1];
    if (!last) throw new Error('요약을 연결할 대화가 없습니다.');
    await backend.saveChatSummary(last.chat_id, summary, keywords);
    return '요약·키워드 서버 저장 완료';
  }
  await writes;
  const records = await readLocal();
  await AsyncStorage.setItem(DEMO_KEY + '/summary', JSON.stringify({summary, keywords, at: new Date().toISOString()}));
  if (!(chatAiConfig as {syncToServer?: boolean}).syncToServer) return '요약·키워드는 폰에 저장';
  const last = [...records].reverse().find(row => row.server_chat_id);
  if (!last?.server_chat_id) return '요약 폰 저장 · 서버 대화 저장이 필요합니다';
  try {
    await backend.saveChatSummary(last.server_chat_id, summary, keywords);
    return '요약·키워드 서버 저장 완료 · 리포트 원인 통계에 연결';
  } catch {return '요약 폰 저장 완료 · 서버 저장 실패';}
}
