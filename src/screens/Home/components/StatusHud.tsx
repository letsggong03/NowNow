import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';

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

// 아직 안 한 행동의 게이지 높이. 비어 보이지 않게 조금 채워 둔다.
const EMPTY_GAUGE = 0.25;

function Gauge({ratio, color}: {ratio: number; color: string}) {
  const {theme} = useAppTheme();
  const fill = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    Animated.spring(fill, {
      friction: 7,
      toValue: ratio,
      useNativeDriver: false,
    }).start();
  }, [fill, ratio]);

  return (
    <View style={[styles.gaugeTrack, {backgroundColor: theme.surfaceMuted}]}>
      <Animated.View
        style={[
          styles.gaugeFill,
          {
            backgroundColor: color,
            width: fill.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

// 게임 상태창: 오늘의 돌봄 진행도, 행동별 게이지, 오늘 기분
export default function StatusHud({
  preferences,
  mood,
  onMoodChange,
}: StatusHudProps) {
  const {theme} = useAppTheme();
  const doneCount = interactionActions.filter(({key}) => preferences[key]).length;

  return (
    <View style={[styles.card, {backgroundColor: theme.surface}]}>
      <View style={styles.headerRow}>
        <View style={[styles.nameBadge, {backgroundColor: theme.accentMuted}]}>
          <Text style={[styles.name, {color: theme.text}]}>
            {CHARACTER_NAME}
          </Text>
        </View>
        <View style={styles.careBox}>
          <Text style={[styles.careLabel, {color: theme.textMuted}]}>
            오늘의 돌봄{' '}
            <Text style={[styles.careCount, {color: theme.text}]}>
              {'❤️'.repeat(doneCount)}
              {'🤍'.repeat(interactionActions.length - doneCount)}
            </Text>
          </Text>
          <Gauge
            ratio={doneCount / interactionActions.length}
            color={theme.accent}
          />
        </View>
      </View>

      <View style={styles.gaugeGrid}>
        {interactionActions.map(({key, emoji, gauge, shade}) => (
          <View key={key} style={styles.gaugeItem}>
            <Text style={styles.gaugeEmoji}>{emoji}</Text>
            <View style={styles.gaugeBody}>
              <Text style={[styles.gaugeLabel, {color: theme.textMuted}]}>
                {gauge}
              </Text>
              <Gauge ratio={preferences[key] ? 1 : EMPTY_GAUGE} color={shade} />
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.moodRow, {borderTopColor: theme.border}]}>
        <Text style={[styles.moodTitle, {color: theme.text}]}>오늘 기분</Text>
        <View style={styles.moodOptions}>
          {moods.map(({label, value, face}) => {
            const selected = mood === value;
            return (
              <Pressable
                key={value}
                accessibilityLabel={label}
                onPress={() => onMoodChange(value)}
                style={({pressed}) => [
                  styles.moodButton,
                  {
                    backgroundColor: selected ? theme.nav : theme.surfaceMuted,
                    borderColor: selected ? theme.icon : 'transparent',
                  },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.moodFace}>{face}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    borderRadius: 22,
    padding: 14,
    rowGap: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  nameBadge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  careBox: {
    flex: 1,
    rowGap: 5,
  },
  careLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  careCount: {
    fontSize: 11,
  },
  gaugeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  gaugeItem: {
    alignItems: 'center',
    flexBasis: '50%',
    flexDirection: 'row',
    gap: 6,
    paddingRight: 10,
  },
  gaugeEmoji: {
    fontSize: 18,
  },
  gaugeBody: {
    flex: 1,
    rowGap: 3,
  },
  gaugeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  gaugeTrack: {
    borderRadius: 6,
    height: 9,
    overflow: 'hidden',
  },
  gaugeFill: {
    borderRadius: 6,
    height: '100%',
  },
  moodRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  moodTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  moodOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  moodButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  moodFace: {
    fontSize: 20,
  },
  pressed: {
    transform: [{scale: 0.92}],
  },
});
