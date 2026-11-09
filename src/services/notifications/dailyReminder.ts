import {NativeModules, PermissionsAndroid, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {getSettings} from '../api/profile';
import {request} from '../api/client';
import {supabase} from '../supabase';

// 하루 마무리 알림: 폰 시간 기준 매일 정한 시각에 폰이 직접 알림을 띄운다(서버 불필요).
// 실제 예약은 Android 네이티브 모듈(DailyReminderModule)이 한다.
const {DailyReminderModule} = NativeModules;

export const DEFAULT_REMINDER_TIME = '23:00';

const REMINDER_MESSAGES = [
  '오늘도 하루를 건너오느라 수고했어. 좋았던 일 하나만 나한테 들려줄래?',
  '오늘 마음이 조금 구겨졌다면, 뿡뿡이가 옆에서 같이 펴줄게 🌷',
  '잘한 일이 안 떠올라도 괜찮아. 여기까지 온 너한테 박수 세 번! 👏',
  '오늘 하루 중에 마음이 포근했던 순간이 있었어? 나한테도 들려줘.',
  '왔네! 오늘 이야기 조금 나누고, 따뜻하게 하루를 마무리하자 🌙',
];

export const WEATHER_CITIES = ['서울', '인천', '안양', '부산', '대전', '대구', '광주', '제주'] as const;
export const PLAY_DAYS = [
  {key: 'weekdays', label: '평일'}, {key: 'weekends', label: '주말'}, {key: 'daily', label: '매일'},
] as const;

export type ReminderSettings = {
  enabled: boolean;
  time: string; // "HH:MM"
  weatherCity?: typeof WEATHER_CITIES[number] | '';
  play?: boolean;
  playDays?: typeof PLAY_DAYS[number]['key'];
  checkIn?: boolean;
};

const isAvailable = () => Platform.OS === 'android' && !!DailyReminderModule;

export async function setReminderNickname(value: unknown) {
  if (!isAvailable()) return;
  const nickname = typeof value === 'string' ? value.trim().slice(0, 20) : '';
  await DailyReminderModule.setNickname?.(nickname);
}

// Android 13부터는 알림을 띄우려면 사용자 허락이 필요하다.
async function ensurePermission() {
  if (Number(Platform.Version) < 33) return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** 알림 예약을 설정에 맞춘다. 반환: 다음 알림 시각(ms), 꺼졌거나 못 걸었으면 null */
export async function applyDailyReminder({
  enabled,
  time,
  weatherCity = '',
  play = false,
  playDays = 'weekdays',
}: ReminderSettings): Promise<number | null> {
  if (!isAvailable()) return null;

  if (!enabled) await DailyReminderModule.cancel();
  const granted = (enabled || weatherCity || play) && await ensurePermission();
  await DailyReminderModule.setExtras?.(granted ? weatherCity : '', granted && play ? playDays : '');
  if (!enabled || !granted) return null;

  const [hour, minute] = time.split(':').map(Number);
  return DailyReminderModule.schedule(hour, minute, REMINDER_MESSAGES);
}

let pendingReminder = Promise.resolve<unknown>(undefined);
function queueReminder<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingReminder.then(operation);
  pendingReminder = result.catch(() => {});
  return result;
}

export function cancelDailyReminder() {
  return queueReminder(async () => {
    if (isAvailable()) {
      await DailyReminderModule.cancel();
      await DailyReminderModule.setExtras?.('', '');
    }
  });
}

// 정각 알람 권한(Android 14부터 기본 꺼짐)이 없으면 정한 시각부터 10분 안에 울린다.
// 설정 화면에서 "정각에 받기"를 원하면 openExactAlarmSettings로 권한 화면을 연다.
export async function canScheduleExactReminder(): Promise<boolean> {
  return isAvailable() ? DailyReminderModule.canScheduleExact() : false;
}

export async function openExactAlarmSettings() {
  if (isAvailable()) await DailyReminderModule.openExactAlarmSettings();
}

const reminderKey = (userId: string) => `nownow.dailyReminder.${userId}`;

export async function getReminderPreference(userId: string): Promise<ReminderSettings> {
  const local = await AsyncStorage.getItem(reminderKey(userId));
  if (local) return JSON.parse(local) as ReminderSettings;

  const remote = await getSettings().catch(() => null);
  return {
    enabled: remote?.notification_enabled ?? true,
    time: remote?.notify_time ?? DEFAULT_REMINDER_TIME,
  };
}

export function syncDailyReminder(userId: string) {
  return queueReminder(async () => applyDailyReminder(await getReminderPreference(userId)));
}

export function saveReminderPreference(userId: string, settings: ReminderSettings) {
  return queueReminder(async () => {
    if (settings.checkIn && isAvailable()) await ensurePermission();
    await AsyncStorage.setItem(reminderKey(userId), JSON.stringify(settings));
    return applyDailyReminder(settings);
  });
}

export function checkForCareNotification(userId: string) {
  return queueReminder(async () => {
    if (!isAvailable() || !DailyReminderModule.showCareCheckIn) return;
    const settings = await getReminderPreference(userId);
    if (!settings.checkIn) return;
    if (Number(Platform.Version) >= 33 && !await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)) return;
    const {data} = await request<{data: {day: string | null}}>('GET', '/api/chat/check-in');
    const key = `${reminderKey(userId)}.lastCareDay`;
    if (!data.day || await AsyncStorage.getItem(key) === data.day) return;
    const {data: auth} = await supabase.auth.getSession();
    if (auth.session?.user.id !== userId) return;
    await DailyReminderModule.showCareCheckIn();
    await AsyncStorage.setItem(key, data.day);
  });
}
