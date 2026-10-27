import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';

import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {moods} from '../constants/homeContent';
import type {MoodType} from '../types';

interface MoodSelectorProps {
  selectedMood: MoodType;
  onMoodChange: (mood: MoodType) => void;
}

interface MoodOptionProps {
  label: string;
  value: MoodType;
  face: string;
  selected: boolean;
  onMoodChange: (mood: MoodType) => void;
}

function MoodOption({
  label,
  value,
  face,
  selected,
  onMoodChange,
}: MoodOptionProps) {
  const {theme} = useAppTheme();
  const selectedAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(selectedAnim, {
      duration: 360,
      toValue: selected ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [selected, selectedAnim]);

  const backgroundColor = selectedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.surfaceMuted, theme.nav],
  });

  const borderColor = selectedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.border, theme.navIndicator],
  });

  return (
    <Pressable
      onPress={() => onMoodChange(value)}
      style={({pressed}) => [
        styles.optionPressable,
        pressed && styles.pressedOption,
      ]}>
      <Animated.View style={[styles.option, {backgroundColor, borderColor}]}>
        <Text style={[styles.face, {color: theme.text}]}>{face}</Text>
        <Text style={[styles.label, {color: theme.text}]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function MoodSelector({
  selectedMood,
  onMoodChange,
}: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      {moods.map(mood => {
        const selected = selectedMood === mood.value;

        return (
          <MoodOption
            key={mood.value}
            label={mood.label}
            value={mood.value}
            face={mood.face}
            selected={selected}
            onMoodChange={onMoodChange}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    ...shadows.subtle,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 0,
    paddingVertical: 12,
    width: '100%',
  },
  optionPressable: {
    flex: 1,
  },
  pressedOption: {
    opacity: 0.75,
  },
  face: {
    fontSize: 22,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    marginTop: 5,
  },
});
