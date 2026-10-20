import React from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';

interface ReportCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function ReportCard({children, style}: ReportCardProps) {
  const {theme} = useAppTheme();

  return (
    <View style={[styles.card, {backgroundColor: theme.surface}, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    borderRadius: 18,
    padding: 18,
  },
});
