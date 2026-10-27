import React from 'react';
import {ScrollView, StyleSheet, Text} from 'react-native';
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
import {useThemePreference} from './hooks/useThemePreference';
import {supabase} from '../../services/supabase';
import {SCREEN_BOTTOM_INSET, SCREEN_HORIZONTAL_PADDING} from '../../theme/layout';
import {useAppTheme} from '../../theme/ThemeProvider';

export default function MyPage() {
  const {themeLabel, themeDescription, toggleThemeMode} = useThemePreference();
  const {theme} = useAppTheme();

  // 세션이 사라지면 RootNavigator가 로그인 화면으로 전환한다.
  const handleLogout = () => {
    supabase.auth.signOut();
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, {backgroundColor: theme.background}]}
      edges={['top']}>
      <ScrollView
        alwaysBounceVertical
        keyboardShouldPersistTaps="handled"
        scrollEnabled
        style={[styles.container, {backgroundColor: theme.background}]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {color: theme.text}]}>내 설정</Text>
        <ProfileHeader />
        <SettingsSection title="계정" items={accountMenus} />
        <SettingsSection
          title="앱 설정"
          items={[
            notificationMenu,
            {
              label: themeLabel,
              description: themeDescription,
              Icon: themeMenu.Icon,
              onPress: toggleThemeMode,
            },
            ...appMenus,
          ]}
        />
        <SettingsSection title="웰니스" items={wellnessMenus} />
        <SettingsSection
          items={[{...logoutMenu, destructive: true, onPress: handleLogout}]}
        />
      </ScrollView>
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
});
