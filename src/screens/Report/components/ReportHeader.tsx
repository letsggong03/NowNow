import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {reportTabs} from '../constants/reportData';
import type {ReportTab} from '../types';

interface ReportHeaderProps {
  tab: ReportTab;
  onChangeTab: (tab: ReportTab) => void;
}

export default function ReportHeader({
  tab,
  onChangeTab,
}: ReportHeaderProps) {
  const {theme} = useAppTheme();

  return (
    <View style={styles.container}>
      {reportTabs.map(item => {
        const active = tab === item.key;

        return (
          <Pressable
            key={item.key}
            style={styles.tab}
            onPress={() => onChangeTab(item.key)}>
            <Text
              style={[
                styles.tabText,
                {color: active ? theme.text : theme.textMuted},
              ]}>
              {item.label}
            </Text>

            {active && (
              <View
                style={[styles.indicator, {backgroundColor: theme.accent}]}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },

  tab: {
    alignItems: 'center',
    flex: 1,
    paddingBottom: 10,
  },

  tabText: {
    fontSize: 15,
    fontWeight: '700',
  },

  indicator: {
    width: '70%',
    height: 3,
    marginTop: 8,
    borderRadius: 999,
  },
});
