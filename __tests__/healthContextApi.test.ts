import {retrieveHealthContext} from '../src/services/health/context';
import {request} from '../src/services/api/client';
import {NativeModules} from 'react-native';
const {kstToday} = require('../backend/utils/kstDate');
jest.mock('react-native', () => ({NativeModules: {}}));
jest.mock('../src/services/api/client', () => ({request: jest.fn()}));
afterEach(() => {jest.clearAllMocks(); delete NativeModules.HealthConnectModule;});
test('chat reads health context through authenticated API only', async () => {
  const data = {documents: [{kind: 'stress', facts: {score: 45}}], range: {from: '2026-10-28', to: '2026-10-28'}};
  (request as jest.Mock).mockResolvedValue({data});
  expect(await retrieveHealthContext('이번 주 스트레스')).toBe(data);
  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith('GET', '/api/chat/context', {query: {question: '이번 주 스트레스'}});
});

test('reads DB and device without writing or double-counting overlapping records', async () => {
  const today = kstToday();
  const database = {range:{from:today,to:today},documents:[{id:'steps-db',kind:'steps',date:today,source:'DB',facts:{count:4000,unit:'걸음'}}],status:[],missing:[],notice:''};
  (request as jest.Mock).mockResolvedValue({data:database});
  NativeModules.HealthConnectModule = {getHealthData: jest.fn(async () => ({stepsTotal:4500}))};
  const result = await retrieveHealthContext('오늘 걸음');
  const steps = result.documents.find(doc => doc.kind === 'steps')!;
  expect(steps.facts.database).toEqual({count:4000,unit:'걸음'});
  expect(steps.facts.device).toEqual({count:4500,unit:'걸음'});
  expect(result.documents.filter(doc => doc.kind === 'steps')).toHaveLength(1);
  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith('GET', '/api/chat/context', {query:{question:'오늘 걸음'}});
  expect(result.documents.some(doc => doc.kind === 'stress')).toBe(false);
});
test('API failure remains a failure, with no device-data fallback', async () => {
  (request as jest.Mock).mockRejectedValue(new Error('서버 연결 실패'));
  await expect(retrieveHealthContext('오늘 건강')).rejects.toThrow('서버 연결 실패');
  expect(request).toHaveBeenCalledTimes(1);
});
