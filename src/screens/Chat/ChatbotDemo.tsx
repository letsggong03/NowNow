import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatPage from './ChatPage';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function ChatbotDemo() {
  const { theme } = useAppTheme();
  const [chat, setChat] = useState(true);
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']}>
        <Text style={[styles.notice, { color: theme.text }]}>
          챗봇 시연 · 대화는 이 폰에 저장 · 팀 DB 미연결
        </Text>
      </SafeAreaView>
      {chat ? (
        <ChatPage onBack={() => setChat(false)} />
      ) : (
        <View style={styles.menu}>
          <Text style={{ color: theme.text }}>
            인터넷으로 뿡뿡이 AI와 대화합니다. 회원가입은 필요하지 않습니다.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setChat(true)}>
            <Text style={[styles.notice, { color: theme.text }]}>
              대화 이어가기
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  notice: { fontSize: 13, textAlign: 'center', padding: 10 },
  menu: { flex: 1, justifyContent: 'center', padding: 24, gap: 20 },
});
