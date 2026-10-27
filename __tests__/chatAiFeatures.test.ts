import {
  summarizeDay,
  suggestSolutions,
} from '../src/services/api/chatAiFeatures';
import { requestReply } from '../src/services/api/chatAi';
jest.mock('../src/services/api/chatAi', () => ({ requestReply: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
test('summary returns real model content and normalized allowed keywords', async () => {
  (requestReply as jest.Mock).mockResolvedValue(
    JSON.stringify({
      summary: '야근으로 지친 하루예요.',
      keywords: ['야근', '야근'],
    }),
  );
  expect(await summarizeDay(['오늘 야근했어'])).toEqual({
    summary: '야근으로 지친 하루예요.',
    keywords: ['야근'],
  });
  expect(
    (requestReply as jest.Mock).mock.calls[0][0].length,
  ).toBeLessThanOrEqual(2000);
});
test('solutions validate suggestions and action allowlist', async () => {
  (requestReply as jest.Mock).mockResolvedValue(
    JSON.stringify({
      solutions: ['잠시 쉬어보세요.', '천천히 호흡해보세요.'],
      reliefActions: ['home', 'meditation'],
    }),
  );
  expect((await suggestSolutions(['힘들어'])).reliefActions).toEqual([
    'home',
    'meditation',
  ]);
  (requestReply as jest.Mock).mockResolvedValue(
    JSON.stringify({ solutions: ['제안'], reliefActions: ['unknown'] }),
  );
  await expect(suggestSolutions(['힘들어'])).rejects.toThrow('올바르지');
});
test('empty story and malformed model output do not create fake analysis', async () => {
  await expect(summarizeDay([])).rejects.toThrow('먼저');
  expect(requestReply).not.toHaveBeenCalled();
  (requestReply as jest.Mock).mockResolvedValue('null');
  await expect(summarizeDay(['오늘 이야기'])).rejects.toThrow('형식');
});
