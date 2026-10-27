let mockDisk: string | null = null;
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => mockDisk),
    setItem: jest.fn(async (_key: string, value: string) => {
      mockDisk = value;
    }),
  },
}));
jest.mock('../src/services/api/chatAiConfig', () => ({
  chatAiConfig: { demoMode: true },
}));
jest.mock('../src/services/api/chat', () => ({
  getChatMessages: jest.fn(),
  saveChatMessage: jest.fn(),
}));

beforeEach(() => {
  jest.resetModules();
  mockDisk = null;
});

test('demo saves concurrent messages on device, survives module restart and never calls backend', async () => {
  const store = require('../src/services/chatStorage');
  await Promise.all([
    store.saveChatMessage('USER', '내 별명은 구름'),
    store.saveChatMessage('AI', '반가워요'),
  ]);
  jest.resetModules();
  const restored =
    await require('../src/services/chatStorage').getChatMessages();
  expect(restored.map((row: { message: string }) => row.message)).toEqual([
    '내 별명은 구름',
    '반가워요',
  ]);
  const backend = require('../src/services/api/chat');
  expect(backend.getChatMessages).not.toHaveBeenCalled();
  expect(backend.saveChatMessage).not.toHaveBeenCalled();
});

test('demo disk failure is reported and following retry can save without losing previous messages', async () => {
  const store = require('../src/services/chatStorage');
  const disk = require('@react-native-async-storage/async-storage').default;
  await store.saveChatMessage('USER', '기존 대화');
  disk.setItem.mockRejectedValueOnce(new Error('disk full'));
  await expect(store.saveChatMessage('AI', '답변')).rejects.toThrow(
    'disk full',
  );
  await store.saveChatMessage('AI', '답변');
  expect(await store.getChatMessages()).toHaveLength(2);
});

test('demo corrupted records fail visibly instead of silently clearing data', async () => {
  mockDisk = '{broken';
  await expect(
    require('../src/services/chatStorage').getChatMessages(),
  ).rejects.toThrow();
  expect(mockDisk).toBe('{broken');
});
