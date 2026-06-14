import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';

import {useAppTheme} from '../../../theme/ThemeProvider';

interface HealthCardProps {
  title: string;
  value: string;
  unit?: string;
  Icon: LucideIcon;
  selected?: boolean;
  onPress?: () => void;
}

export default function HealthCard({
  title,
  value,
  unit,
  Icon,
  selected = false,
  onPress,
}: HealthCardProps) {
  const {theme} = useAppTheme();

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({pressed}) => [
        styles.card,
        {
          backgroundColor: selected ? theme.accent : theme.surface,
          borderColor: selected ? theme.accent : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <Icon color={selected ? theme.accentText : theme.accent} size={23} />

      <Text
        style={[
          styles.title,
          {color: selected ? theme.accentText : theme.textMuted},
        ]}>
        {title}
      </Text>

      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            {color: selected ? theme.accentText : theme.text},
          ]}>
          {value}
        </Text>

        {unit && (
          <Text
            style={[
              styles.unit,
              {color: selected ? theme.accentText : theme.textMuted},
            ]}>
            {unit}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 9,
  },
  valueRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
  },
  unit: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
});