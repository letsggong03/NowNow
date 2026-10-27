import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabNavigator from '../../navigation/TabNavigator';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function ChatbotDemo() {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']}>
        <Text style={[styles.notice, { color: theme.text }]}>
          시연 모드 · 로그인 생략 · 대화는 이 폰에 저장
        </Text>
      </SafeAreaView>
      <TabNavigator />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  notice: { fontSize: 13, textAlign: 'center', padding: 10 },
});
