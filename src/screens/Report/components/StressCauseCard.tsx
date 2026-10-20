import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {TrendingUp} from 'lucide-react-native';

import {useAppTheme} from '../../../theme/ThemeProvider';
import {stressPeriodOptions} from '../constants/reportData';
import type {StressCause, StressPeriod} from '../types';
import ReportCard from './ReportCard';

interface StressCauseCardProps {
  causes: StressCause[];
  period: StressPeriod;
  onPeriodChange: (period: StressPeriod) => void;
}

export default function StressCauseCard({
  causes,
  period,
  onPeriodChange,
}: StressCauseCardProps) {
  const {theme} = useAppTheme();
  const totalCount = causes.reduce((sum, item) => sum + item.count, 0);
  const getCauseColor = (index: number) =>
    theme.chart[index % theme.chart.length];

  return (
    <ReportCard>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconWrap, {backgroundColor: theme.iconSurface}]}>
            <TrendingUp color={theme.icon} size={20} />
          </View>
          <Text style={[styles.title, {color: theme.text}]}>
            스트레스 원인 분석
          </Text>
        </View>
        <View style={[styles.toggle, {backgroundColor: theme.surfaceMuted}]}>
          {stressPeriodOptions.map(item => (
            <Pressable
              key={item.key}
              onPress={() => onPeriodChange(item.key)}
              style={[
                styles.toggleButton,
                period === item.key && {backgroundColor: theme.nav},
              ]}>
              <Text
                style={[
                  styles.toggleText,
                  {color: period === item.key ? theme.text : theme.textMuted},
                ]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={[styles.count, {color: theme.text}]}>
        {totalCount}
        <Text style={[styles.countUnit, {color: theme.textMuted}]}>
          건의 스트레스 기록
        </Text>
      </Text>

      <View style={styles.causes}>
        {causes.map((item, index) => (
          <View key={item.cause}>
            <View style={styles.causeRow}>
              <View style={styles.causeLabelRow}>
                <View
                  style={[
                    styles.dot,
                    {backgroundColor: getCauseColor(index)},
                  ]}
                />
                <Text style={[styles.causeLabel, {color: theme.text}]}>
                  {item.cause}
                </Text>
              </View>
              <Text style={[styles.causeValue, {color: theme.textMuted}]}>
                {item.count}회 · {item.percentage}%
              </Text>
            </View>
            <View style={[styles.track, {backgroundColor: theme.surfaceMuted}]}>
              <View
                style={[
                  styles.progress,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor: getCauseColor(index),
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </ReportCard>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 14,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 11,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  toggle: {
    borderRadius: 13,
    flexDirection: 'row',
    padding: 4,
  },
  toggleButton: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    paddingVertical: 9,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  count: {
    fontSize: 30,
    fontWeight: '800',
    marginTop: 18,
  },
  countUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
  causes: {
    marginTop: 18,
    rowGap: 14,
  },
  causeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  causeLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  causeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  causeValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    borderRadius: 5,
    height: 9,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 5,
    height: '100%',
  },
});
