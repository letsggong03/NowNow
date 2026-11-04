import {NativeModules, PermissionsAndroid, Platform} from 'react-native';

import {getSettings} from '../api/profile';

// 하루 마무리 알림: 폰 시간 기준 매일 정한 시각에 폰이 직접 알림을 띄운다(서버 불필요).
// 실제 예약은 Android 네이티브 모듈(DailyReminderModule)이 한다.
const {DailyReminderModule} = NativeModules;

export const DEFAULT_REMINDER_TIME = '23:00';

const REMINDER_MESSAGES = [
  '오늘 하루는 어땠나요? 뿡뿡이에게 들려주세요.',
  '하루를 마무리할 시간이에요. 오늘 마음은 어땠는지 기록해 봐요.',
  '수고 많았어요! 자기 전에 오늘 이야기 잠깐 나눌까요?',
  '오늘의 기분을 남겨 두면 내일의 나에게 힘이 돼요.',
  '뿡뿡이가 기다리고 있어요. 오늘 있었던 일을 편하게 말해 주세요.',
];

export type ReminderSettings = {
  enabled: boolean;
  time: string; // "HH:MM"
};

const isAvailable = () => Platform.OS === 'android' && !!DailyReminderModule;

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
}: ReminderSettings): Promise<number | null> {
  if (!isAvailable()) return null;

  if (!enabled) {
    await DailyReminderModule.cancel();
    return null;
  }

  if (!(await ensurePermission())) return null;

  const [hour, minute] = time.split(':').map(Number);
  return DailyReminderModule.schedule(hour, minute, REMINDER_MESSAGES);
}

export async function cancelDailyReminder() {
  if (isAvailable()) await DailyReminderModule.cancel();
}

// 정각 알람 권한(Android 14부터 기본 꺼짐)이 없으면 정한 시각부터 10분 안에 울린다.
// 설정 화면에서 "정각에 받기"를 원하면 openExactAlarmSettings로 권한 화면을 연다.
export async function canScheduleExactReminder(): Promise<boolean> {
  return isAvailable() ? DailyReminderModule.canScheduleExact() : false;
}

export async function openExactAlarmSettings() {
  if (isAvailable()) await DailyReminderModule.openExactAlarmSettings();
}

// 서버에서 알림 설정을 읽어 예약한다. 정하지 않았거나 못 읽었으면 켜짐·23:00.
export async function syncDailyReminder() {
  const settings = await getSettings().catch(error => {
    console.log('[dailyReminder] 설정 조회 실패:', error);
    return null;
  });

  return applyDailyReminder({
    enabled: settings?.notification_enabled ?? true,
    time: settings?.notify_time ?? DEFAULT_REMINDER_TIME,
  });
}
