import React, { useEffect, useState } from 'react';
import ChatbotDemo from '../screens/Chat/ChatbotDemo';
import { chatAiConfig } from '../services/api/chatAiConfig';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { supabase } from '../services/supabase';
import { View, ActivityIndicator, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [guest, setGuest] = useState(false);
  const {theme} = useAppTheme();
  if (chatAiConfig.demoMode !== true) return <AuthenticatedRoot />;
  if (guest) return <ChatbotDemo onLogin={() => setGuest(false)} />;
  return <View style={{flex: 1, backgroundColor: theme.background}}>
    <SafeAreaView edges={['top']}>
      <Text style={{color: theme.text, textAlign: 'center', padding: 8}}>
        시연 빌드 · 로그인해도 대화는 이 폰에 공통 저장 · 팀 서버 저장 미연결
      </Text>
      <Pressable accessibilityRole="button" onPress={() => setGuest(true)}>
        <Text style={{color: theme.accent, textAlign: 'center', padding: 10}}>로그인 없이 시연하기</Text>
      </Pressable>
    </SafeAreaView>
    <AuthenticatedRoot />
  </View>;
}
