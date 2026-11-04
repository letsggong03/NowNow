import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {CHARACTER_NAME} from '../../../constants/app';
import {
  deliveryApps,
  openDeliveryApp,
  type DeliveryApp,
} from '../../../services/delivery/deliveryApps';
import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {withJosa} from '../../../utils/josa';
import {preferenceLabels} from '../constants/preferenceOptions';
import MusicRecommendation from './MusicRecommendation';
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
        <View key={key}>
          <View style={styles.row}>
            <View style={[styles.dot, {backgroundColor: theme.accent}]} />
            <Text style={[styles.text, {color: theme.text}]}>
              {formatInteractionText(key, value)}
            </Text>
          </View>
          {key === 'feed' && (
            <View style={styles.deliveryRow}>
              {(Object.keys(deliveryApps) as DeliveryApp[]).map(app => (
                <Pressable
                  key={app}
                  onPress={() =>
                    openDeliveryApp(app).catch(error =>
                      console.log('[deliveryApps] 앱 열기 실패:', error),
                    )
                  }
                  style={({pressed}) => [
                    styles.deliveryButton,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressedButton,
                  ]}>
                  <Text style={[styles.deliveryLabel, {color: theme.text}]}>
                    {deliveryApps[app].label} 열기
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {key === 'music' && <MusicRecommendation choice={value} />}
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
  deliveryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    marginTop: 4,
    paddingLeft: 16,
  },
  deliveryButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deliveryLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressedButton: {
    opacity: 0.72,
  },
});
