import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';

import {useAppTheme} from '../../../theme/ThemeProvider';
import type {ChatAction, Message} from '../types';

interface MessageBubbleProps {
  message: Message;
  onButtonPress: (action: ChatAction) => void;
}

export default function MessageBubble({
  message,
  onButtonPress,
}: MessageBubbleProps) {
  const {theme} = useAppTheme();
  const isUser = message.role === 'user';
  const appearAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(appearAnim, {
      damping: 16,
      mass: 0.8,
      stiffness: 130,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [appearAnim]);

  const animatedStyle = {
    opacity: appearAnim,
    transform: [
      {
        translateY: appearAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
      {
        scale: appearAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.userMessageRow : styles.botMessageRow,
        animatedStyle,
      ]}>
      {isUser && (
        <Text style={[styles.timeText, {color: theme.textMuted}]}>
          {message.createdAt}
        </Text>
      )}
      <View
        style={[
          styles.messageBubble,
          {backgroundColor: theme.bubble},
        ]}>
        <Text
          style={[
            styles.messageText,
            {color: theme.text},
          ]}>
          {message.content}
        </Text>

        {message.buttons && (
          <View style={styles.buttonGroup}>
            {message.buttons.map((button, index) => (
              <Pressable
                key={`${button.action}-${index}`}
                onPress={() => onButtonPress(button.action)}
                style={({pressed}) => [
                  styles.choiceButton,
                  {backgroundColor: theme.accent},
                  pressed && styles.pressedChoiceButton,
                ]}>
                <Text
                  style={[styles.choiceButtonText, {color: theme.accentText}]}>
                  {button.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      {!isUser && (
        <Text style={[styles.timeText, {color: theme.textMuted}]}>
          {message.createdAt}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 6,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    maxWidth: '78%',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  timeText: {
    fontSize: 10,
    marginBottom: 3,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  choiceButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pressedChoiceButton: {
    opacity: 0.82,
  },
  choiceButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
