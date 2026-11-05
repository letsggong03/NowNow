import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';

import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {completedMessages, interactionActions} from '../constants/homeContent';
import {preferenceLabels} from '../constants/preferenceOptions';
import type {PreferenceKey, PreferenceOption, UserPreferences} from '../types';

interface InteractionButtonsProps {
  selectedAction: PreferenceKey | null;
  options: PreferenceOption[];
  completedPreferences: UserPreferences;
  onActionSelect: (action: PreferenceKey) => void;
  onOptionSelect: (choice: string) => void;
  onCancelOptions: () => void;
}

// 버튼 아래 입체 테두리 두께. 누르면 그만큼 내려가 눌린 느낌을 준다.
const BUTTON_DEPTH = 5;

const actionStyle = (key: PreferenceKey) =>
  interactionActions.find(action => action.key === key)!;

export default function InteractionButtons({
  selectedAction,
  options,
  completedPreferences,
  onActionSelect,
  onOptionSelect,
  onCancelOptions,
}: InteractionButtonsProps) {
  const {theme} = useAppTheme();
  const transitionAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    transitionAnim.setValue(0);
    Animated.spring(transitionAnim, {
      friction: 7,
      tension: 90,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [selectedAction, transitionAnim]);

  const animatedStyle = {
    opacity: transitionAnim,
    transform: [
      {
        translateY: transitionAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };

  if (selectedAction) {
    const {emoji, color, shade} = actionStyle(selectedAction);

    return (
      <Animated.View
        style={[
          styles.optionPanel,
          {backgroundColor: theme.surface},
          animatedStyle,
        ]}>
        <View style={styles.optionHeader}>
          <Pressable
            onPress={onCancelOptions}
            style={({pressed}) => [
              styles.backButton,
              {backgroundColor: theme.surfaceMuted},
              pressed && styles.pressedSoft,
            ]}>
            <ChevronLeft color={theme.icon} size={18} />
          </Pressable>
          <Text style={[styles.optionTitle, {color: theme.text}]}>
            {emoji} 오늘은 어떤 {preferenceLabels[selectedAction]}?
          </Text>
        </View>

        {options.map(option => (
          <Pressable
            key={option.label}
            onPress={() => onOptionSelect(option.label)}
            style={({pressed}) => [
              styles.optionCard,
              {backgroundColor: color, borderBottomColor: shade},
              pressed && styles.pressedDepth,
            ]}>
            <View style={styles.optionEmojiWrap}>
              <Text style={styles.optionEmoji}>{emoji}</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
          </Pressable>
        ))}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.dock, animatedStyle]}>
      {interactionActions.map(({key, label, emoji, color, shade}) => {
        const completed = Boolean(completedPreferences[key]);

        return (
          <View key={key} style={styles.dockItem}>
            <Pressable
              disabled={completed}
              onPress={() => onActionSelect(key)}
              style={({pressed}) => [
                styles.actionButton,
                {backgroundColor: color, borderBottomColor: shade},
                completed && styles.completedButton,
                pressed && styles.pressedDepth,
              ]}>
              <Text style={[styles.actionEmoji, completed && styles.completedEmoji]}>
                {emoji}
              </Text>
              {completed && (
                <View style={[styles.doneBadge, {backgroundColor: theme.accent}]}>
                  <Text style={styles.doneMark}>✓</Text>
                </View>
              )}
            </Pressable>
            <Text
              numberOfLines={1}
              style={[
                styles.actionLabel,
                {color: completed ? theme.textMuted : theme.text},
              ]}>
              {completed ? completedMessages[key] : label}
            </Text>
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dockItem: {
    alignItems: 'center',
    rowGap: 6,
    width: '23%',
  },
  actionButton: {
    ...shadows.raised,
    alignItems: 'center',
    aspectRatio: 1,
    borderBottomWidth: BUTTON_DEPTH,
    borderRadius: 26,
    justifyContent: 'center',
    width: '100%',
  },
  // 완료한 버튼은 바탕을 평평하게 눌러 두고 아이콘만 흐리게 해서 ✓ 표시는 또렷하게 남긴다.
  completedButton: {
    borderBottomWidth: 1,
    marginTop: BUTTON_DEPTH - 1,
  },
  completedEmoji: {
    opacity: 0.45,
  },
  pressedDepth: {
    borderBottomWidth: 1,
    marginTop: BUTTON_DEPTH - 1,
  },
  pressedSoft: {
    opacity: 0.72,
  },
  actionEmoji: {
    fontSize: 34,
  },
  doneBadge: {
    alignItems: 'center',
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    top: -4,
    width: 22,
  },
  doneMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionPanel: {
    ...shadows.raised,
    borderRadius: 24,
    padding: 12,
    rowGap: 10,
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 32,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  optionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    marginRight: 32,
    textAlign: 'center',
  },
  optionCard: {
    alignItems: 'center',
    borderBottomWidth: BUTTON_DEPTH,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionEmojiWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionText: {
    flex: 1,
  },
  // 버튼 바탕이 늘 밝은 파스텔이라 다크 모드에서도 진한 글씨를 쓴다.
  optionLabel: {
    color: '#2F352F',
    fontSize: 15,
    fontWeight: '800',
  },
  optionDescription: {
    color: '#5C6459',
    fontSize: 12,
    marginTop: 2,
  },
});
