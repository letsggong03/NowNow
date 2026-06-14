import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useAppTheme} from '../../../theme/ThemeProvider';

interface ReportHeaderProps {
  tab: 'daily' | 'weekly';
  onChangeTab: (tab: 'daily' | 'weekly') => void;
}

export default function ReportHeader({
  tab,
  onChangeTab,
}: ReportHeaderProps) {

  
  const {theme} = useAppTheme();

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.tab}
        onPress={() => onChangeTab('daily')}>
        <Text
          style={[
            styles.tabText,
            {
              color:
                tab === 'daily'
                  ? theme.text
                  : theme.textMuted,
            },
          ]}>
          실시간 리포트
        </Text>

        {tab === 'daily' && (
          <View style={styles.indicator} />
        )}
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => onChangeTab('weekly')}>
        <Text
          style={[
            styles.tabText,
            {
              color:
                tab === 'weekly'
                  ? theme.text
                  : theme.textMuted,
            },
          ]}>
          주간 리포트
        </Text>

        {tab === 'weekly' && (
          <View style={styles.indicator} />
        )}
      </Pressable>
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
    backgroundColor: '#E8A5B8',
  },
});