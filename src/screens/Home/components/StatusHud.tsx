import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';

import Text from '../../../components/AppText';
import {CHARACTER_NAME} from '../../../constants/app';
import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {interactionActions, moods} from '../constants/homeContent';
import type {MoodType, UserPreferences} from '../types';

interface StatusHudProps {
  preferences: UserPreferences;
  mood: MoodType;
  onMoodChange: (mood: MoodType) => void;
}

// 한 줄 상태창: 이름, 오늘의 돌봄 진행도, 오늘 기분
export default function StatusHud({
  preferences,
  mood,
  onMoodChange,
}: StatusHudProps) {
  const {theme} = useAppTheme();
  const total = interactionActions.length;
  const doneCount = interactionActions.filter(({key}) => preferences[key]).length;
  const fill = useRef(new Animated.Value(doneCount / total)).current;

  useEffect(() => {
    Animated.spring(fill, {
      friction: 7,
      toValue: doneCount / total,
      useNativeDriver: false,
    }).start();
  }, [doneCount, fill, total]);

  return (
    <View style={[styles.card, {backgroundColor: theme.surface}]}>
      <View style={styles.careBox}>
        <View style={styles.careHeader}>
          <Text style={[styles.name, {color: theme.text}]}>{CHARACTER_NAME}</Text>
          <Text style={[styles.careLabel, {color: theme.textMuted}]}>
            오늘의 돌봄 {doneCount}/{total}
          </Text>
        </View>
        <View style={[styles.track, {backgroundColor: theme.surfaceMuted}]}>
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: theme.accent,
                width: fill.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.moodOptions}>
        {moods.map(({label, value, face}) => (
          <Pressable
            key={value}
            accessibilityLabel={label}
            onPress={() => onMoodChange(value)}
            style={({pressed}) => [
              styles.moodButton,
              mood === value && {backgroundColor: theme.nav},
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.moodFace, mood !== value && styles.moodIdle]}>
              {face}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.subtle,
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  careBox: {
    flex: 1,
    rowGap: 7,
  },
  careHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  careLabel: {
    fontSize: 12,
  },
  track: {
    borderRadius: 4,
    height: 6,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
    height: '100%',
  },
  moodOptions: {
    flexDirection: 'row',
    gap: 2,
  },
  moodButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  moodFace: {
    fontSize: 19,
  },
  moodIdle: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
