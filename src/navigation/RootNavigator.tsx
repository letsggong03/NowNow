import React, { useEffect, useState } from 'react';
import ChatbotDemo from '../screens/Chat/ChatbotDemo';
import { chatAiConfig } from '../services/api/chatAiConfig';
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
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

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
  return chatAiConfig.demoMode === true ? (
    <ChatbotDemo />
  ) : (
    <AuthenticatedRoot />
  );
}
