import React from 'react';
import {ChevronRight} from 'lucide-react-native';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useAppTheme} from '../../../theme/ThemeProvider';

interface Props {
  title: string;
  onPress?: () => void;
}

export default function WeeklyReportItem({
  title,
  onPress,
}: Props) {
  const {theme} = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <Text
        style={[
          styles.title,
          {color: theme.text},
        ]}>
        {title}
      </Text>

      <ChevronRight
        size={18}
        color={theme.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});