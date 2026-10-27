import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {BackHandler, Pressable, StyleSheet, Text, View} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import {format, parseISO} from 'date-fns';

import {useAppTheme} from '../../../theme/ThemeProvider';
import {WEEKLY_REPORT_COUNT} from '../constants/reportData';
import {createMockWeeklyReport} from '../constants/weeklyReportMock';
import {getRecentWeeks} from '../utils/weekLabels';
import PeakStressDayCard from './PeakStressDayCard';
import StressKeywordCard from './StressKeywordCard';
import WeeklyReportItem from './WeeklyReportItem';
import WeeklyStressChart from './WeeklyStressChart';

type Week = ReturnType<typeof getRecentWeeks>[number];

const formatRange = (start: string, end: string) =>
  `${format(parseISO(start), 'M.d')} ~ ${format(parseISO(end), 'M.d')}`;

interface WeeklyReportDetailProps {
  week: Week;
  onBack: () => void;
}

function WeeklyReportDetail({week, onBack}: WeeklyReportDetailProps) {
  const {theme} = useAppTheme();
  const [selectedCause, setSelectedCause] = useState<string | null>(null);
  const report = useMemo(() => createMockWeeklyReport(week.start), [week]);

  const peakDay = useMemo(
    () =>
      report.days.reduce((max, day) => (day.score > max.score ? day : max)),
    [report],
  );

  // 키워드를 고르면 그 원인이 있던 날을, 아니면 가장 높았던 날을 강조한다.
  const highlightedDates = useMemo(
    () =>
      new Set(
        selectedCause
          ? report.days
              .filter(day => day.causes.includes(selectedCause))
              .map(day => day.date)
          : [peakDay.date],
      ),
    [report, selectedCause, peakDay],
  );

  // 안드로이드 뒤로가기 버튼으로도 목록으로 돌아간다.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onBack();
        return true;
      },
    );

    return () => subscription.remove();
  }, [onBack]);

  return (
    <>
      <View style={[styles.detailHeader, {backgroundColor: theme.surface}]}>
        <Pressable
          onPress={onBack}
          style={({pressed}) => [
            styles.backButton,
            pressed && {backgroundColor: theme.pressed},
          ]}>
          <ChevronLeft color={theme.text} size={22} />
        </Pressable>

        <View style={styles.weekInfo}>
          <Text style={[styles.weekLabel, {color: theme.text}]}>
            {week.label}
          </Text>
          <Text style={[styles.weekRange, {color: theme.textMuted}]}>
            {formatRange(report.weekStart, report.weekEnd)}
          </Text>
        </View>

        <View style={styles.backButton} />
      </View>

      <WeeklyStressChart
        days={report.days}
        highlightedDates={highlightedDates}
        animationKey={week.key}
      />

      <StressKeywordCard
        causes={report.causes}
        selectedCause={selectedCause}
        onSelectCause={setSelectedCause}
      />

      <PeakStressDayCard day={peakDay} />
    </>
  );
}

export default function WeeklyReport() {
  const weeks = useMemo(() => getRecentWeeks(WEEKLY_REPORT_COUNT), []);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const handleBack = useCallback(() => setSelectedWeek(null), []);

  if (selectedWeek) {
    return (
      <WeeklyReportDetail
        week={selectedWeek}
        onBack={handleBack}
      />
    );
  }

  return (
    <>
      {weeks.map(week => (
        <WeeklyReportItem
          key={week.key}
          title={week.label}
          onPress={() => setSelectedWeek(week)}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  detailHeader: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  weekInfo: {
    alignItems: 'center',
    flex: 1,
  },
  weekLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  weekRange: {
    fontSize: 12,
    marginTop: 2,
  },
});
