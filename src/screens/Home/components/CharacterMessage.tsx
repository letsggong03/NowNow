import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';

import Text from '../../../components/AppText';
import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {characterMessages} from '../constants/homeContent';
import type {MoodType} from '../types';

interface CharacterMessageProps {
  userMood: MoodType;
}

// 캐릭터 머리 위 말풍선. 기분이 바뀌면 톡 튀어나온다.
export default function CharacterMessage({userMood}: CharacterMessageProps) {
  const {theme} = useAppTheme();
  const popAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    popAnim.setValue(0);
    Animated.spring(popAnim, {
      friction: 6,
      tension: 140,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [popAnim, userMood]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: popAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
          transform: [
            {
              scale: popAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1],
              }),
            },
          ],
        },
      ]}>
      <View style={[styles.bubble, {backgroundColor: theme.surface}]}>
        <Text style={[styles.message, {color: theme.text}]}>
          {characterMessages[userMood]}
        </Text>
      </View>
      <View style={[styles.tail, {borderTopColor: theme.surface}]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  bubble: {
    ...shadows.subtle,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  tail: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 9,
    borderRightColor: 'transparent',
    borderRightWidth: 9,
    borderTopWidth: 10,
    height: 0,
    marginTop: -1,
    width: 0,
  },
});
