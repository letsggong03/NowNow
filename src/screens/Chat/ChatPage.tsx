import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';
import MessageBubble from './components/MessageBubble';
import { useChatDiary } from './hooks/useChatDiary';
import { useAppTheme } from '../../theme/ThemeProvider';
import { chatAiConfig } from '../../services/api/chatAiConfig';

interface ChatPageProps {
  date?: string;
  onBack: () => void;
}

const formatChatDate = (date?: string) => {
  if (!date) {
    return '';
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return format(parsedDate, 'yyyy년 M월 d일 E요일', { locale: ko });
};

export default function ChatPage({ date, onBack }: ChatPageProps) {
  const { theme } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    messages,
    input,
    setInput,
    handleSend,
    handleButtonClick,
    loading,
    sending,
    error,
    requestError,
    saveError,
    restore,
    retrySave,
    resetting,
    resetConversation,
  } = useChatDiary();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.chatPanel, { backgroundColor: theme.background }]}>
          <ChatHeader title={formatChatDate(date)} onBack={onBack} />
          {chatAiConfig.demoMode === true && (
            <Pressable accessibilityRole="button" disabled={loading || sending || resetting}
              onPress={() => Alert.alert('대화 초기화',
                '이 폰의 시연 대화와 AI 대화 문맥을 모두 지웁니다. 되돌릴 수 없습니다.',
                [{text: '취소', style: 'cancel'},
                  {text: '초기화', style: 'destructive', onPress: resetConversation}])}>
              <Text style={[styles.statusAction, {color: theme.accent, textAlign: 'right'}]}>
                {resetting ? '초기화 중…' : '대화 초기화'}
              </Text>
            </Pressable>
          )}

          <ScrollView
            ref={scrollViewRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map((message, index) => (
              <MessageBubble
                key={`${message.role}-${index}`}
                message={message}
                onButtonPress={handleButtonClick}
              />
            ))}
          </ScrollView>

          {(loading || sending) && (
            <ActivityIndicator
              accessibilityLabel={
                loading ? '대화 불러오는 중' : '뿡뿡이 답변 중'
              }
              color={theme.accent}
            />
          )}
          {!!requestError && (
            <Text
              accessibilityRole="alert"
              style={[styles.statusText, { color: theme.text }]}
            >
              {requestError}
            </Text>
          )}
          {!!error && (
            <Pressable onPress={restore}>
              <Text style={[styles.statusAction, { color: theme.text }]}>
                {error} · 다시 불러오기
              </Text>
            </Pressable>
          )}
          {!!saveError && (
            <Pressable onPress={retrySave}>
              <Text style={[styles.statusAction, { color: theme.text }]}>
                {saveError} · 다시 저장
              </Text>
            </Pressable>
          )}
          <ChatInput
            disabled={loading || sending || resetting || !!error || !!saveError}
            value={input}
            onChangeText={setInput}
            onSend={handleSend}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statusText: { paddingHorizontal: 16 },
  statusAction: { padding: 16 },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  chatPanel: {
    flex: 1,
    paddingBottom: 0,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    rowGap: 12,
  },
});
