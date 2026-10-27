import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatAiConfig } from './api/chatAiConfig';
import * as backend from './api/chat';
import type { ChatMessageRecord, ChatRole } from './api/chat';

const DEMO_KEY = '@nownow/chatbot-demo/v1';
let writes: Promise<unknown> = Promise.resolve();

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
    return row;
  });
  writes = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}
