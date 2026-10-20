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
      friction: 8,
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
      {
        scale: transitionAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1],
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
              pressed && styles.pressedButton,
            ]}>
            <ChevronLeft color={theme.icon} size={18} />
          </Pressable>
          <Text style={[styles.optionTitle, {color: theme.text}]}>
            {preferenceLabels[selectedAction]} 취향 고르기
          </Text>
        </View>

        {options.map(option => (
          <Pressable
            key={option.label}
            onPress={() => onOptionSelect(option.label)}
            style={({pressed}) => [
              styles.optionButton,
              {backgroundColor: theme.surfaceMuted, borderColor: theme.border},
              pressed && styles.pressedButton,
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
    <Animated.View style={[styles.grid, animatedStyle]}>
      {interactionActions.map(({key, label, Icon}) => {
        const completed = Boolean(completedPreferences[key]);

        return (
          <Pressable
            key={key}
            disabled={completed}
            onPress={() => onActionSelect(key)}
            style={({pressed}) => [
              styles.button,
              {backgroundColor: theme.surface},
              completed && styles.completedButton,
              completed && {backgroundColor: theme.surfaceMuted},
              pressed && !completed && styles.pressedButton,
            ]}>
            <Icon color={completed ? theme.textMuted : theme.icon} size={24} />
            <Text
              style={[
                styles.label,
                {color: theme.text},
                completed && {color: theme.textMuted},
              ]}>
              {completed ? completedMessages[key] : label}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    ...shadows.raised,
    alignItems: 'center',
    borderRadius: 18,
    flexBasis: '47%',
    flexDirection: 'row',
    gap: 9,
    minHeight: 58,
    justifyContent: 'center',
  },
  completedButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  pressedButton: {
    opacity: 0.72,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionPanel: {
    ...shadows.raised,
    borderRadius: 20,
    padding: 12,
    rowGap: 9,
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 32,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  optionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 30,
    textAlign: 'center',
  },
  optionButton: {
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 4,
  },
});
