import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { useChatDiary } from '../src/screens/Chat/hooks/useChatDiary';
import { getChatMessages, saveChatMessage } from '../src/services/api/chat';
import { requestReply } from '../src/services/api/chatAi';
jest.mock('../src/services/api/chat', () => ({
  getChatMessages: jest.fn(),
  saveChatMessage: jest.fn(),
}));
jest.mock('../src/services/api/chatAi', () => ({ requestReply: jest.fn() }));
let state: ReturnType<typeof useChatDiary>;
let app: Renderer.ReactTestRenderer;
function Harness() {
  state = useChatDiary();
  return null;
}
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};
beforeEach(() => {
  jest.clearAllMocks();
  (getChatMessages as jest.Mock).mockResolvedValue([]);
  (saveChatMessage as jest.Mock).mockResolvedValue({});
  (requestReply as jest.Mock).mockResolvedValue('실제 AI 응답');
});
afterEach(async () => {
  if (app) await act(async () => app.unmount());
});
async function mount() {
  await act(async () => {
    app = Renderer.create(<Harness />);
  });
}
test('restores DB history, limits AI context and blocks duplicate sends', async () => {
  (getChatMessages as jest.Mock).mockResolvedValue(
    Array.from({ length: 12 }, (_, i) => ({
      chat_role: i % 2 ? 'AI' : 'USER',
      message: `m${i}`,
      created_at: '2026-10-27T00:00:00Z',
    })),
  );
  await mount();
  expect(state!.messages).toHaveLength(12);
  await act(async () => state!.setInput('오늘 힘들어요'));
  let resolve!: (text: string) => void;
  (requestReply as jest.Mock).mockImplementation(
    () =>
      new Promise<string>(r => {
        resolve = r;
      }),
  );
  let sending!: Promise<void>;
  act(() => {
    sending = state!.handleSend();
    void state!.handleSend();
  });
  expect(requestReply).toHaveBeenCalledTimes(1);
  expect((requestReply as jest.Mock).mock.calls[0][1]).toHaveLength(10);
  expect((requestReply as jest.Mock).mock.calls[0][1][0].content).toBe('m2');
  await act(async () => {
    resolve('답변');
    await sending;
  });
  await flush();
  expect(saveChatMessage).toHaveBeenCalledWith('AI', '답변');
});
test('AI failure restores draft, while disk retry never repeats AI call', async () => {
  await mount();
  await act(async () => state!.setInput('테스트'));
  (requestReply as jest.Mock).mockRejectedValueOnce(new Error('연결 오류'));
  await act(async () => {
    await state!.handleSend();
  });
  expect(state!.input).toBe('테스트');
  expect(state!.requestError).toBe('연결 오류');
  (saveChatMessage as jest.Mock).mockRejectedValueOnce(
    new Error('DB unavailable'),
  );
  await act(async () => {
    await state!.handleSend();
  });
  await flush();
  expect(state!.saveError).toBeTruthy();
  expect(requestReply).toHaveBeenCalledTimes(2);
  await act(async () => {
    await state!.retrySave();
  });
  expect(state!.saveError).toBe('');
  expect(requestReply).toHaveBeenCalledTimes(2);
});
test('load failure blocks sending until restore succeeds', async () => {
  (getChatMessages as jest.Mock).mockRejectedValueOnce(new Error('offline'));
  await mount();
  await act(async () => state!.setInput('안녕'));
  await act(async () => {
    await state!.handleSend();
  });
  expect(requestReply).not.toHaveBeenCalled();
  await act(async () => {
    await state!.restore();
  });
  expect(state!.error).toBe('');
});
