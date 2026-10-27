import { chatAiConfig as cloudConfig } from './chatAiConfig';
const errors: Record<string, string> = {
  API_KEY_REQUIRED: 'AI 서버의 API 키를 설정해 주세요.',
  SERVER_NOT_READY: 'AI 서버 설정이 아직 완료되지 않았어요.',
  UNAUTHORIZED: '앱 연결 인증을 확인해 주세요.',
  API_KEY_INVALID: 'AI API 키를 확인해 주세요.',
  API_LIMIT: 'AI API 사용 한도 또는 결제 설정을 확인해 주세요.',
  BUSY: '이전 답변을 처리 중이에요. 잠시 후 다시 시도해 주세요.',
};
export type ChatTurn = { role: 'user' | 'assistant'; content: string };
export async function requestReply(
  message: string,
  history: ChatTurn[] = [],
): Promise<string> {
  if (!cloudConfig.url || !cloudConfig.token)
    throw new Error(
      'AI 연결 설정이 필요합니다. CHATBOT_INTEGRATION.md를 확인해 주세요.',
    );
  if (!message.trim() || message.length > 2000)
    throw new Error('메시지는 1~2000자로 입력해 주세요.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50000);
  try {
    const response = await fetch(cloudConfig.url + '/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + cloudConfig.token,
      },
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        errors[data.error] ||
          'AI 답변을 받지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
    }
    if (typeof data.reply !== 'string' || !data.reply.trim()) {
      throw new Error('AI가 빈 답변을 보냈어요. 다시 시도해 주세요.');
    }
    return data.reply;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error('답변 시간이 초과됐어요. 잠시 후 다시 시도해 주세요.');
    if (error instanceof SyntaxError)
      throw new Error('서버 응답을 읽지 못했어요. 잠시 후 다시 시도해 주세요.');
    if (error instanceof TypeError)
      throw new Error('와이파이 또는 모바일 데이터 연결을 확인해 주세요.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
