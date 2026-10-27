import React, { useEffect, useState } from "react";
import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";
import { supabase } from "../services/supabase";
import { ensureProfile } from "../services/api/profile";
import { View, ActivityIndicator, StyleSheet } from "react-native";
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
  const user = session?.user;
  useEffect(() => {
    if (user) {
      ensureProfile(user);
    }
  }, [user]);

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
