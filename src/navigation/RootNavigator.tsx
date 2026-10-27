import React, { useEffect, useState } from 'react';
import { ensureProfile } from '../services/api/profile';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { supabase } from '../services/supabase';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

function AuthenticatedRoot() {
  const { theme } = useAppTheme();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data?.session ?? null);
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      },
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function RootNavigator() {
  return <AuthenticatedRoot />;
}
