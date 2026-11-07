import React, {useEffect, useState} from 'react';
import {Alert, BackHandler, KeyboardAvoidingView, Linking, NativeModules, Platform, Pressable, ScrollView, StyleSheet, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {
  accountMenus,
  appMenus,
  logoutMenu,
  notificationMenu,
  themeMenu,
  wellnessMenus,
} from './constants/profileData';
import ProfileHeader from './components/ProfileHeader';
import SettingsSection from './components/SettingsSection';
import PersonalizationModal from './components/PersonalizationModal';
import AccountSettings from './components/AccountSettings';
import StressThresholdSettings from './components/StressThresholdSettings';
import {Activity, Bell, Bluetooth, ChevronLeft, CloudSun, Heart, ShieldCheck, Smile} from 'lucide-react-native';
import {useThemePreference} from './hooks/useThemePreference';
import {supabase} from '../../services/supabase';
import {SCREEN_BOTTOM_INSET, SCREEN_HORIZONTAL_PADDING} from '../../theme/layout';
import {useAppTheme} from '../../theme/ThemeProvider';
import {DEFAULT_REMINDER_TIME, getReminderPreference, PLAY_DAYS, saveReminderPreference, WEATHER_CITIES, type ReminderSettings} from '../../services/notifications/dailyReminder';

export default function MyPage() {
  const {themeLabel, themeDescription, toggleThemeMode} = useThemePreference();
  const {theme} = useAppTheme();
  const [userId, setUserId] = useState<string>();
  const [reminder, setReminder] = useState<ReminderSettings>({enabled: true, time: DEFAULT_REMINDER_TIME});
  const [reminderBusy, setReminderBusy] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [chooseWeatherCity, setChooseWeatherCity] = useState(false);
  const [choosePlayDays, setChoosePlayDays] = useState(false);
  const [page, setPage] = useState<'main' | 'notifications' | 'account' | 'stress' | 'privacy'>('main');
  const [profileRevision, setProfileRevision] = useState(0);
  const pageTitles = {notifications: '알림 설정', account: '계정 설정', stress: '스트레스 기준 관리', privacy: '개인정보 보호'};

  const openHealthPermissions = async () => {
    try {
      const healthConnect = NativeModules.HealthConnectModule;
      if (!healthConnect?.openHealthConnectSettings) throw new Error();
      await healthConnect.openHealthConnectSettings();
    } catch {
      Alert.alert('헬스 커넥트를 열지 못했어요.', '휴대폰 설정에서 헬스 커넥트를 검색해 주세요.');
    }
  };

  useEffect(() => {
    if (page === 'main') return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      setChooseWeatherCity(false);
      setChoosePlayDays(false);
      setPage('main');
      return true;
    });
    return () => back.remove();
  }, [page]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({data}) => {
      const id = data.session?.user.id;
      if (!id) return;
      const settings = await getReminderPreference(id);
      if (active) {
        setReminder(settings);
        setUserId(id);
      }
    }).catch(() => {
      if (active) Alert.alert('알림 설정을 불러오지 못했어요.');
    });
    return () => {active = false;};
  }, []);

  const updateReminder = async (changes: Partial<ReminderSettings>) => {
    if (!userId || reminderBusy) return;
    setReminderBusy(true);
    const next = {...reminder, ...changes};
    try {
      const scheduled = await saveReminderPreference(userId, next);
      setReminder(next);
      if (changes.enabled && scheduled === null) {
        Alert.alert('알림을 예약하지 못했어요', '휴대폰 설정에서 나우나우의 알림 권한을 확인해 주세요.');
      }
    } catch {
      Alert.alert('알림 설정을 적용하지 못했어요.');
      const saved = await getReminderPreference(userId).catch(() => null);
      if (saved) setReminder(saved);
    } finally {
      setReminderBusy(false);
    }
  };

  // 세션이 사라지면 RootNavigator가 로그인 화면으로 전환한다.
  const handleLogout = () => {
    supabase.auth.signOut();
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, {backgroundColor: theme.background}]}
      edges={['top']}>
      <KeyboardAvoidingView style={styles.container} enabled={page === 'account' || page === 'stress'}
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView
        alwaysBounceVertical
        keyboardShouldPersistTaps="handled"
        scrollEnabled
        style={[styles.container, {backgroundColor: theme.background}]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {page !== 'main' && <Pressable style={styles.back} accessibilityRole="button" accessibilityLabel="내 설정으로 돌아가기"
          onPress={() => {setChooseWeatherCity(false); setChoosePlayDays(false); setPage('main');}}>
          <ChevronLeft size={24} color={theme.text} />
          <Text style={[styles.title, {color: theme.text}]}>{pageTitles[page]}</Text>
        </Pressable>}
        {page === 'account' && <AccountSettings onProfileSaved={() => setProfileRevision(value => value + 1)} />}
        {page === 'stress' && <StressThresholdSettings />}
        {page === 'privacy' && <SettingsSection items={[
          {label: '건강 데이터 접근 권한', description: '헬스 커넥트에서 건강 기록을 읽는 앱 관리', Icon: Activity,
            onPress: () => void openHealthPermissions()},
          {label: '나우나우 권한', description: '휴대폰 설정에서 알림과 앱 권한 관리', Icon: ShieldCheck,
            onPress: () => void Linking.openSettings().catch(() => Alert.alert('나우나우 앱 정보를 열지 못했어요.'))},
        ]} />}
        {page === 'main' && <>
        <Text style={[styles.title, {color: theme.text}]}>내 설정</Text>
        <ProfileHeader key={profileRevision} />
        <SettingsSection title="계정" items={[...accountMenus.map((item, index) =>
          ({...item, onPress: () => setPage(index === 0 ? 'account' : 'privacy')})), {
          label: '뿡뿡이가 기억하는 것',
          description: 'MBTI와 좋아하는 활동·음악·음식',
          Icon: Heart,
          onPress: () => setPersonalizationOpen(true),
        }]} />
        <SettingsSection
          title="앱 설정"
          items={[
            {...notificationMenu, description: '하루 마무리 · 날씨 · 놀자 · 안부', onPress: () => setPage('notifications')},
            {
              label: themeLabel,
              description: themeDescription,
              Icon: themeMenu.Icon,
              onPress: toggleThemeMode,
            },
            ...appMenus,
          ]}
        />
        <SettingsSection title="웰니스" items={[
          ...wellnessMenus.map(item => ({...item, onPress: () => setPage('stress')})),
          {
            label: '혈압계 연결',
            description: '블루투스 연결 준비 중',
            Icon: Bluetooth,
            onPress: () => Alert.alert(
              '혈압계 연결',
              '블루투스 연결은 준비 중이에요. 지금은 리포트에서 혈압을 직접 입력할 수 있어요.',
            ),
          },
        ]} />
        <SettingsSection items={[{...logoutMenu, destructive: true, onPress: handleLogout}]} />
        </>}
        {page === 'notifications' && <>
        <SettingsSection items={[{
          label: '하루 마무리 알림',
          description: reminder.enabled ? `매일 ${reminder.time}` : '꺼짐',
          Icon: Bell,
          toggle: {value: reminder.enabled, disabled: !userId || reminderBusy, onValueChange: enabled => updateReminder({enabled})},
        }]} />
        <SettingsSection title="뿡뿡이 알림" items={[
          {
            label: '날씨 한마디',
            description: reminder.weatherCity ? `${reminder.weatherCity} · 매일 오전 8시` : '지역을 고르면 아침 예보와 인사를 보내요',
            Icon: CloudSun,
            onPress: () => setChooseWeatherCity(value => !value),
            toggle: {value: Boolean(reminder.weatherCity), disabled: !userId || reminderBusy,
              onValueChange: enabled => {
                setChooseWeatherCity(enabled);
                if (!enabled) void updateReminder({weatherCity: ''});
              }},
          },
          {
            label: '뿡뿡이의 놀자 알림',
            description: '오전 9시 · 정오 12시 · 오후 5시',
            Icon: Smile,
            onPress: () => setChoosePlayDays(value => !value),
            toggle: {value: Boolean(reminder.play), disabled: !userId || reminderBusy,
              onValueChange: play => {setChoosePlayDays(play); void updateReminder({play});}},
          },
          {
            label: '뿡뿡이의 안부',
            description: '기록 변화를 확인하면 앱을 열 때 하루 한 번 안부를 보내요',
            Icon: Heart,
            toggle: {value: Boolean(reminder.checkIn), disabled: !userId || reminderBusy,
              onValueChange: checkIn => updateReminder({checkIn})},
          },
        ]} />
        {choosePlayDays && <SettingsSection title="놀자 알림 받는 날" items={PLAY_DAYS.map(({key, label}) => ({
          label,
          description: (reminder.playDays ?? 'weekdays') === key ? '선택됨' : undefined,
          Icon: Smile,
          onPress: () => {setChoosePlayDays(false); void updateReminder({playDays: key});},
        }))} />}
        {chooseWeatherCity && <SettingsSection title="날씨 알림 지역 선택" items={WEATHER_CITIES.map(city => ({
          label: city,
          Icon: CloudSun,
          onPress: () => {
            if (!userId || reminderBusy) return;
            setChooseWeatherCity(false);
            void updateReminder({weatherCity: city});
          },
        }))} />}
        </>}
      </ScrollView>
      </KeyboardAvoidingView>
      {personalizationOpen && <PersonalizationModal onClose={() => setPersonalizationOpen(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: SCREEN_BOTTOM_INSET,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingTop: 18,
    rowGap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  back: {flexDirection: 'row', alignItems: 'center', gap: 8},
});
