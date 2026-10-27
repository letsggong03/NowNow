import React, {useRef} from 'react';
import {Animated, Pressable, StyleSheet, TextInput, View} from 'react-native';
import {Send} from 'lucide-react-native';

import {useAppTheme} from '../../../theme/ThemeProvider';

interface ChatInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
}

export default function ChatInput({value, onChangeText, onSend}: ChatInputProps) {
  const {theme} = useAppTheme();
  const sendScale = useRef(new Animated.Value(1)).current;

  const handleSendPress = () => {
    Animated.sequence([
      Animated.timing(sendScale, {
        duration: 70,
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(sendScale, {
        friction: 3,
        tension: 150,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    onSend();
  };

  return (
    <View style={[styles.inputArea, {backgroundColor: theme.background}]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSend}
        placeholder="오늘 하루를 이야기해 주세요..."
        placeholderTextColor={theme.textMuted}
        returnKeyType="send"
        style={[
          styles.input,
          {backgroundColor: theme.input, color: theme.text},
        ]}
      />
      <Pressable
        onPress={handleSendPress}
        style={({pressed}) => [
          pressed && styles.pressedSendButton,
        ]}>
        <Animated.View
          style={[
            styles.sendButton,
            {backgroundColor: theme.accent, transform: [{scale: sendScale}]},
          ]}>
          <Send color={theme.accentText} size={20} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputArea: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  input: {
    borderRadius: 18,
    flex: 1,
    fontSize: 13,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 44,
    width: 48,
  },
  pressedSendButton: {
    opacity: 0.82,
  },
});
