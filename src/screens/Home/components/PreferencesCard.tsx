import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {CHARACTER_NAME} from '../../../constants/app';
import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {withJosa} from '../../../utils/josa';
import {preferenceLabels} from '../constants/preferenceOptions';
import type {PreferenceKey, UserPreferences} from '../types';

interface PreferencesCardProps {
  preferences: UserPreferences;
}

const formatInteractionText = (key: PreferenceKey, value: string) =>
  `${withJosa(preferenceLabels[key], '으로/로')} ${value}`;

export default function PreferencesCard({preferences}: PreferencesCardProps) {
  const {theme} = useAppTheme();
  const entries = Object.entries(preferences) as [PreferenceKey, string][];

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={[styles.card, {backgroundColor: theme.surface}]}>
      <Text style={[styles.title, {color: theme.text}]}>
        {withJosa(CHARACTER_NAME, '과/와')} 함께한 것들
      </Text>
      {entries.map(([key, value]) => (
        <View key={key} style={styles.row}>
          <View style={[styles.dot, {backgroundColor: theme.accent}]} />
          <Text style={[styles.text, {color: theme.text}]}>
            {formatInteractionText(key, value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    borderRadius: 20,
    padding: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 25,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  text: {
    fontSize: 14,
  },
});
