import React, { useEffect, useState } from "react";
import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";
import { supabase } from "../services/supabase";
import { ensureProfile } from "../services/api/profile";
import {
  cancelDailyReminder,
  checkForCareNotification,
  setReminderNickname,
  syncDailyReminder,
} from "../services/notifications/dailyReminder";
import { AppState, View, ActivityIndicator, StyleSheet } from "react-native";
import { useAppTheme } from "../theme/ThemeProvider";

export default function RootNavigator() {
  const { theme } = useAppTheme();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 가입 직후·첫 로그인·세션 복원 어느 경우든 프로필 행이 있게 한다.
  const userId = session?.user?.id;
  const nickname = session?.user?.user_metadata?.nownow_chat_name;
  useEffect(() => {
    if (!loading) void setReminderNickname(nickname).catch(() => {});
  }, [loading, userId, nickname]);
  useEffect(() => {
    if (loading) return;
    if (userId) {
      void ensureProfile();
      syncDailyReminder(userId).catch(error =>
          console.log('[dailyReminder] 예약 실패:', error?.message),
        );
    } else {
      cancelDailyReminder().catch(() => {});
    }
  }, [loading, userId]);

  useEffect(() => {
    if (loading || !userId) return;
    const check = () => {void checkForCareNotification(userId).catch(() => {});};
    check();
    const subscription = AppState.addEventListener('change', state => {if (state === 'active') check();});
    return () => subscription.remove();
  }, [loading, userId]);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return session ? <TabNavigator /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
