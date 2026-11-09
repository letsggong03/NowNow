import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';

import Text from '../../../components/AppText';
import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {preferenceLabels} from '../constants/preferenceOptions';
import type {PreferenceKey, PreferenceOption} from '../types';

interface OptionPickerProps {
  selectedAction: PreferenceKey | null;
  options: PreferenceOption[];
  onOptionSelect: (choice: string) => void;
  onCancelOptions: () => void;
}

// 카드 아래 입체 테두리 두께. 누르면 그만큼 내려가 눌린 느낌을 준다.
const BUTTON_DEPTH = 4;

// 행동 버튼을 누르면 방 아래에 열리는 오늘의 선택지
export default function OptionPicker({
  selectedAction,
  options,
  onOptionSelect,
  onCancelOptions,
}: OptionPickerProps) {
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

  if (!selectedAction) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.optionPanel,
        {backgroundColor: theme.surface},
        animatedStyle,
      ]}
    >
      <View style={styles.optionHeader}>
        <Pressable
          onPress={onCancelOptions}
          style={({pressed}) => [
            styles.backButton,
            {backgroundColor: theme.surfaceMuted},
            pressed && styles.pressedSoft,
          ]}
        >
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
            {
              backgroundColor: theme.surfaceMuted,
              borderBottomColor: theme.nav,
            },
            pressed && styles.pressedDepth,
          ]}
        >
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

const styles = StyleSheet.create({
  pressedDepth: {
    borderBottomWidth: 1,
    marginTop: BUTTON_DEPTH - 1,
  },
  pressedSoft: {
    opacity: 0.72,
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
