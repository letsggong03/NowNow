import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {Check, ChevronLeft} from 'lucide-react-native';

import Text from '../../../components/AppText';
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
const BUTTON_DEPTH = 4;

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
            오늘은 어떤 {preferenceLabels[selectedAction]}?
          </Text>
        </View>

        {options.map(option => (
          <Pressable
            key={option.label}
            onPress={() => onOptionSelect(option.label)}
            style={({pressed}) => [
              styles.optionCard,
              {backgroundColor: theme.surfaceMuted, borderBottomColor: theme.nav},
              pressed && styles.pressedDepth,
            ]}>
            <Text style={[styles.optionLabel, {color: theme.text}]}>
              {option.label}
            </Text>
            <Text style={[styles.optionDescription, {color: theme.textMuted}]}>
              {option.description}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.dock, animatedStyle]}>
      {interactionActions.map(({key, label, emoji}) => {
        const completed = Boolean(completedPreferences[key]);

        return (
          <View key={key} style={styles.dockItem}>
            <Pressable
              disabled={completed}
              onPress={() => onActionSelect(key)}
              style={({pressed}) => [
                styles.actionButton,
                {backgroundColor: theme.surface, borderBottomColor: theme.nav},
                completed && styles.completedButton,
                completed && {backgroundColor: theme.surfaceMuted},
                pressed && styles.pressedDepth,
              ]}>
              <Text style={[styles.actionEmoji, completed && styles.completedEmoji]}>
                {emoji}
              </Text>
              {completed && (
                <View style={[styles.doneBadge, {backgroundColor: theme.accent}]}>
                  <Check color={theme.accentText} size={12} strokeWidth={3.5} />
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
    ...shadows.subtle,
    alignItems: 'center',
    aspectRatio: 1,
    borderBottomWidth: BUTTON_DEPTH,
    borderRadius: 22,
    justifyContent: 'center',
    width: '100%',
  },
  // 완료한 버튼은 평평하게 눌러 두고 아이콘만 흐리게 해서 체크 표시는 또렷하게 남긴다.
  completedButton: {
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  completedEmoji: {
    opacity: 0.4,
  },
  pressedDepth: {
    borderBottomWidth: 1,
    marginTop: BUTTON_DEPTH - 1,
  },
  pressedSoft: {
    opacity: 0.72,
  },
  actionEmoji: {
    fontSize: 30,
  },
  doneBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -3,
    top: -3,
    width: 20,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionPanel: {
    ...shadows.subtle,
    borderRadius: 22,
    padding: 12,
    rowGap: 8,
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
    fontWeight: '700',
    marginRight: 32,
    textAlign: 'center',
  },
  optionCard: {
    borderBottomWidth: BUTTON_DEPTH,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 3,
  },
});
