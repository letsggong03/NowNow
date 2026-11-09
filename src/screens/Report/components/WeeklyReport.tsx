import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {BackHandler, Pressable, StyleSheet, Text, View} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import {format, parseISO} from 'date-fns';

import {useAppTheme} from '../../../theme/ThemeProvider';
import {WEEKLY_REPORT_COUNT} from '../constants/reportData';
import {getRecentWeeks} from '../utils/weekLabels';
import {request} from '../../../services/api/client';
import type {WeeklyReport as WeeklyReportData} from '../types';
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
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    request<{data: Omit<WeeklyReportData, 'days'> & {
      days: {date: string; finalDailyStressScore: number | null; missing?: string[]}[];
    }}>('GET', `/api/reports/weekly/${week.key}`)
      .then(({data}) => {
        if (!active) return;
        setReport({...data, days: data.days.flatMap(day =>
          day.finalDailyStressScore !== null && Number.isFinite(day.finalDailyStressScore) && !day.missing?.includes('demo_fixture')
            ? [{date: day.date, score: day.finalDailyStressScore, causes: []}] : [])});
      })
      .catch(() => {if (active) setUnavailable(true);});
    return () => {active = false;};
  }, [week.key]);

  const peakDay = useMemo(
    () =>
      report?.days.reduce<WeeklyReportData['days'][number] | null>(
        (max, day) => (!max || day.score > max.score ? day : max), null) ?? null,
    [report],
  );

  const highlightedDates = useMemo(() => new Set(peakDay ? [peakDay.date] : []), [peakDay]);

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
            {report ? formatRange(report.weekStart, report.weekEnd) : ''}
          </Text>
        </View>

        <View style={styles.backButton} />
      </View>

      {report?.days.length ? <WeeklyStressChart
        days={report.days}
        highlightedDates={highlightedDates}
        animationKey={week.key}
      /> : <Text style={{color: theme.textMuted}}>{unavailable
        ? '주간 기록을 불러오지 못했어요. 서버 연결을 확인해 주세요.'
        : report ? '이 주에 표시할 스트레스 기록이 없어요.' : '주간 기록을 불러오고 있어요…'}</Text>}

      {report && <StressKeywordCard
        causes={report.causes}
        selectedCause={selectedCause}
        onSelectCause={setSelectedCause}
      />}

      {peakDay && <PeakStressDayCard day={peakDay} />}
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
