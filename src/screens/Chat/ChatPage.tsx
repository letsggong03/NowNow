import React, {useEffect, useRef} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {format} from 'date-fns';
import {ko} from 'date-fns/locale';
import {SafeAreaView} from 'react-native-safe-area-context';

import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';
import MessageBubble from './components/MessageBubble';
import {useChatDiary} from './hooks/useChatDiary';
import {useAppTheme} from '../../theme/ThemeProvider';

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

  return format(parsedDate, 'yyyy년 M월 d일 E요일', {locale: ko});
};

export default function ChatPage({date, onBack}: ChatPageProps) {
  const {theme} = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const {messages, input, setInput, handleSend, handleButtonClick} =
    useChatDiary();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  }, [messages]);

  return (
    <SafeAreaView
      style={[styles.safeArea, {backgroundColor: theme.background}]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={[styles.container, {backgroundColor: theme.background}]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.chatPanel, {backgroundColor: theme.background}]}>
          <ChatHeader title={formatChatDate(date)} onBack={onBack} />

          <ScrollView
            ref={scrollViewRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({animated: true})
            }>
            {messages.map((message, index) => (
              <MessageBubble
                key={`${message.role}-${index}`}
                message={message}
                onButtonPress={handleButtonClick}
              />
            ))}
          </ScrollView>

          <ChatInput value={input} onChangeText={setInput} onSend={handleSend} />
        </View>
      </KeyboardAvoidingView>
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
