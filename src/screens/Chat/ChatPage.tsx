import React, {useEffect, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import type {MoodType} from '../Home/types';

interface ChatPageProps {
  date?: string;
  invite?: 'play' | 'weather' | null;
  mood?: MoodType | null;
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

export default function ChatPage({date, invite, mood, onBack}: ChatPageProps) {
  const {theme} = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const {messages, input, setInput, handleSend, handleButtonClick, error, busy, editingKeywords, closeKeywords, addKeywords, openHealthRecord, offerSummary} =
    useChatDiary(mood);
  const [keywordText, setKeywordText] = useState('');
  const cancelKeywords = () => {
    setKeywordText('');
    closeKeywords();
  };
  const submitKeywords = async () => {
    if (!/[^\s,，#]/.test(keywordText)) return;
    if (await addKeywords(keywordText)) setKeywordText('');
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  }, [messages]);

  return (
    <SafeAreaView
      style={[styles.safeArea, {backgroundColor: theme.background}]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={[styles.container, {backgroundColor: theme.background}]}
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
        <View style={[styles.chatPanel, {backgroundColor: theme.background}]}>
          <ChatHeader title={formatChatDate(date)} onBack={onBack} />
          <View style={styles.quickActions}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={openHealthRecord}>
              <Text style={{color: theme.accent}}>오늘의 건강기록♡</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={offerSummary}>
              <Text style={{color: theme.accent}}>하루 정리하기</Text>
            </Pressable>
          </View>

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
            {invite && <MessageBubble message={{
              role: 'bot', createdAt: '',
              content: invite === 'play'
                ? '왔네! 나 오늘 너한테 보여줄 새 표정 연습했어. 볼래?'
                : '오늘도 조심히 다녀와! 지금 계절에 어울리는 간식도 같이 골라볼까?',
              buttons: invite === 'play'
                ? [{label: '표정 보여줘', action: 'pet_cat'}]
                : [{label: '제철 메뉴 보기', action: 'food_seasonal'}],
            }} onButtonPress={handleButtonClick} />}
          </ScrollView>

          {!!error && <Text accessibilityRole="alert" style={{color: theme.text}}>{error}</Text>}
          {busy && <Text style={{color: theme.textMuted}}>뿡뿡이가 답변을 준비하고 있어요.</Text>}
          <ChatInput value={input} onChangeText={setInput} onSend={() => void handleSend()} />
        </View>
      </KeyboardAvoidingView>
      {editingKeywords && <Modal transparent animationType="fade" onRequestClose={cancelKeywords}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.keywordCard, {backgroundColor: theme.surface}]}>
            <Text style={[styles.keywordTitle, {color: theme.text}]}>키워드 추가</Text>
            <Text style={{color: theme.textMuted}}>여러 개는 쉼표로 나눠 적어줘.</Text>
            {!!error && <Text accessibilityLiveRegion="polite" style={{color: theme.text}}>{error}</Text>}
            <TextInput accessibilityLabel="추가할 키워드" value={keywordText} onChangeText={setKeywordText}
              onSubmitEditing={submitKeywords} returnKeyType="done" maxLength={310}
              placeholder="예: 발표 준비, 일정 부담" placeholderTextColor={theme.textMuted}
              style={[styles.keywordInput, {color: theme.text, borderColor: theme.border}]} />
            <View style={styles.keywordButtons}>
              <Pressable accessibilityRole="button" onPress={cancelKeywords}><Text style={{color: theme.text}}>취소</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={!/[^\s,，#]/.test(keywordText)} onPress={submitKeywords}>
                <Text style={{color: theme.text, fontWeight: '700'}}>추가하기</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>}
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
  quickActions: {flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8},
  modalBackdrop: {flex: 1, backgroundColor: '#0006', justifyContent: 'center', padding: 24},
  keywordCard: {borderRadius: 20, padding: 18, gap: 12},
  keywordTitle: {fontSize: 18, fontWeight: '800'},
  keywordInput: {borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: 46},
  keywordButtons: {flexDirection: 'row', justifyContent: 'flex-end', gap: 24, paddingTop: 6},
  messageListContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    rowGap: 12,
  },
});
