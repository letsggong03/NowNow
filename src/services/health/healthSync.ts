// Health Connect → 서버 증분 동기화.
//
// 예전에는 리포트 화면을 열 때 "오늘 0시~지금"만 읽어서 저장했다. 앱을 안 켠 날은
// Health Connect에 기록이 있어도 서버에 영영 안 들어갔다.
// 이제는 Changes API 토큰으로 마지막 동기화 뒤에 바뀐 것만 읽고, 서버 저장이 모두
// 성공했을 때만 토큰을 앞으로 옮긴다. 며칠 만에 앱을 켜도, 중간에 네트워크가 끊겨도
// 다음 동기화에서 그대로 이어서 보낸다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeModules, Platform} from 'react-native';

import {request} from '../api/client';
import {supabase} from '../supabase';
import {buildSyncRequests, type NativeSyncResult} from './healthSyncPayload';

const DAY = 86_400_000;
// Health Connect는 권한을 받기 전 30일까지만 읽게 해 준다(그 전은 기록 기간 권한이 따로 필요).
const FIRST_SYNC_DAYS = 30;
// 토큰이 만료돼 다시 읽을 때 마지막 동기화보다 하루 앞에서 시작해 늦게 들어온 기록을 잡는다.
const OVERLAP_MS = DAY;
// 앱 복귀 때마다 돌지 않도록 최소 간격
const MIN_INTERVAL_MS = 5 * 60_000;

interface SyncState {
  token: string | null;
  lastSyncAt: string | null;
}

export type SyncOutcome =
  | {status: 'unavailable' | 'signed_out' | 'skipped'}
  | {status: 'synced'; mode: NativeSyncResult['mode']; requests: number}
  | {status: 'failed'; error: string};

const stateKey = (userId: string) => `nownow.healthSync.${userId}`;

async function loadState(userId: string): Promise<SyncState> {
  try {
    const raw = await AsyncStorage.getItem(stateKey(userId));
    const parsed = raw ? JSON.parse(raw) : null;
    return {token: parsed?.token ?? null, lastSyncAt: parsed?.lastSyncAt ?? null};
  } catch {
    return {token: null, lastSyncAt: null};
  }
}

const saveState = (userId: string, state: SyncState) =>
  AsyncStorage.setItem(stateKey(userId), JSON.stringify(state));

export const resetHealthSync = (userId: string) => AsyncStorage.removeItem(stateKey(userId));

function sinceFor(state: SyncState, now: number) {
  const earliest = now - FIRST_SYNC_DAYS * DAY;
  const last = state.lastSyncAt ? Date.parse(state.lastSyncAt) : NaN;
  return new Date(Number.isFinite(last) ? Math.max(earliest, last - OVERLAP_MS) : earliest).toISOString();
}

let running: Promise<SyncOutcome> | null = null;

async function run(force: boolean): Promise<SyncOutcome> {
  const native = NativeModules.HealthConnectModule;
  if (Platform.OS !== 'android' || typeof native?.syncHealthData !== 'function') {
    return {status: 'unavailable'};
  }
  const {data} = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return {status: 'signed_out'};

  const state = await loadState(userId);
  const now = Date.now();
  if (!force && state.lastSyncAt && now - Date.parse(state.lastSyncAt) < MIN_INTERVAL_MS) {
    return {status: 'skipped'};
  }

  try {
    const result: NativeSyncResult = await native.syncHealthData(state.token, sinceFor(state, now));
    // 워치 혈압 연동을 검증할 때까지 혈압은 직접 입력으로만 저장한다.
    const bodies = buildSyncRequests(result, {includeBloodPressure: false});
    for (const body of bodies) {
      await request('POST', '/api/health/records', {body});
    }
    await saveState(userId, {token: result.nextToken, lastSyncAt: new Date(now).toISOString()});
    return {status: 'synced', mode: result.mode, requests: bodies.length};
  } catch (error) {
    // 토큰을 그대로 두므로 다음 동기화가 같은 변경분부터 다시 보낸다.
    const message = error instanceof Error ? error.message : String(error);
    console.log('[healthSync] 동기화 실패:', message);
    return {status: 'failed', error: message};
  }
}

// 동시에 여러 번 불려도 한 번만 돈다. force면 최소 간격을 무시한다(새로고침 버튼).
export function syncHealthData({force = false}: {force?: boolean} = {}) {
  running ??= run(force).finally(() => {
    running = null;
  });
  return running;
}
