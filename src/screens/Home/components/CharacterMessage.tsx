import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {characterMessages} from '../constants/homeContent';
import type {MoodType} from '../types';

interface CharacterMessageProps {
  userMood: MoodType;
}

const FADE_DURATION = 260;

export default function CharacterMessage({userMood}: CharacterMessageProps) {
  const {theme} = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    translateAnim.setValue(8);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        duration: FADE_DURATION,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        duration: FADE_DURATION,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim, userMood]);

  return (
    <View style={[styles.card, {backgroundColor: theme.surface}]}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{translateY: translateAnim}],
        }}>
        <Text style={[styles.message, {color: theme.text}]}>
          {characterMessages[userMood]}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    alignItems: 'center',
    borderRadius: 20,
    minHeight: 82,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
