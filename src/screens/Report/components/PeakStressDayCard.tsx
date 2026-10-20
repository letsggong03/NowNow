import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Flame} from 'lucide-react-native';
import {format, parseISO} from 'date-fns';
import {ko} from 'date-fns/locale';

import {useAppTheme} from '../../../theme/ThemeProvider';
import {getStressLevel, STRESS_SCORE_MAX} from '../constants/reportData';
import type {DailyStress} from '../types';
import ReportCard from './ReportCard';

interface PeakStressDayCardProps {
  day: DailyStress;
}

export default function PeakStressDayCard({day}: PeakStressDayCardProps) {
  const {theme} = useAppTheme();
  const level = getStressLevel(day.score);

  return (
    <ReportCard>
      <View style={styles.titleRow}>
        <Flame color={theme.warning} size={21} />
        <Text style={[styles.title, {color: theme.text}]}>
          가장 스트레스가 높았던 날
        </Text>
      </View>

      <View style={[styles.box, {backgroundColor: theme.accentMuted}]}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={[styles.caption, {color: theme.textMuted}]}>날짜</Text>
            <Text style={[styles.date, {color: theme.text}]}>
              {format(parseISO(day.date), 'M월 d일 EEEE', {locale: ko})}
            </Text>
          </View>

          <View style={styles.scoreArea}>
            <Text style={[styles.caption, {color: theme.textMuted}]}>
              스트레스 지수
            </Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.score, {color: theme[level.colorKey]}]}>
                {day.score}
              </Text>
              <Text style={[styles.scoreMax, {color: theme.textMuted}]}>
                /{STRESS_SCORE_MAX}
              </Text>
              <View
                style={[
                  styles.levelBadge,
                  {backgroundColor: theme[level.colorKey]},
                ]}>
                <Text style={[styles.levelText, {color: theme.surface}]}>
                  {level.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.divider, {backgroundColor: theme.border}]} />

        <Text style={[styles.caption, {color: theme.textMuted}]}>원인</Text>
        {day.causes.length > 0 ? (
          <View style={styles.causes}>
            {day.causes.map(cause => (
              <View
                key={cause}
                style={[styles.causeTag, {backgroundColor: theme.surface}]}>
                <Text style={[styles.causeText, {color: theme.text}]}>
                  #{cause}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.empty, {color: theme.textMuted}]}>
            기록된 원인이 없어요.
          </Text>
        )}
      </View>
    </ReportCard>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  box: {
    borderRadius: 14,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caption: {
    fontSize: 12,
    fontWeight: '700',
  },
  date: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  scoreArea: {
    alignItems: 'flex-end',
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 2,
  },
  score: {
    fontSize: 26,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
    marginTop: 8,
  },
  levelBadge: {
    borderRadius: 999,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  causes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  causeTag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  causeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    fontSize: 13,
    marginTop: 8,
  },
});
