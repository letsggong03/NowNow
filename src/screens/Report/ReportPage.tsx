import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, NativeModules, View, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Activity, Footprints, HeartPulse, Moon} from 'lucide-react-native';
import HealthCard from './components/HealthCard';
import InsightCard from './components/InsightCard';
import ReportHeader from './components/ReportHeader';
import StressCauseCard from './components/StressCauseCard';
import TrendChart from './components/TrendChart';
import WeeklyReport from './components/WeeklyReport';
import {metricConfig} from './constants/reportData';
import {useReport} from './hooks/useReport';
import type {ReportTab} from './types';
import {SCREEN_BOTTOM_INSET, SCREEN_HORIZONTAL_PADDING} from '../../theme/layout';
import {useAppTheme} from '../../theme/ThemeProvider';
import {supabase} from '../../services/supabase';
import {createMockHealthData} from '../../services/health/mockHealthData';

const {HealthConnectModule} = NativeModules;

const formatSleep = (minutes?: number) => {
  if (!minutes) return '-';

  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);

  return `${h}시간 ${m}분`;
};

const formatToday = () =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return Math.round(value).toLocaleString();
};

export default function ReportPage() {
  const [tab, setTab] = useState<ReportTab>('daily');
  const {theme} = useAppTheme();
  // 모듈 로드 시점이 아니라 화면이 열릴 때의 날짜를 기준으로 한다.
  const dateText = useMemo(formatToday, []);

  const {
    selectedMetric,
    setSelectedMetric,
    stressPeriod,
    setStressPeriod,
    peakStress,
    lowestStress,
    stressCauses,
  } = useReport();

  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    const loadHealthData = async () => {
      // 에뮬레이터처럼 Health Connect를 쓸 수 없는 개발 환경에서는 목업 데이터로 UI를 확인한다.
      if (!HealthConnectModule) {
        if (__DEV__) setHealthData(createMockHealthData());
        return;
      }

      try {
        const data = await HealthConnectModule.getHealthData();
        console.log('Health data:', data);

        setHealthData(data);
        await saveRawHealthData(data);
      } catch (e) {
        console.log('HealthConnect 에러:', e);
        if (__DEV__) setHealthData(createMockHealthData());
      }
    };

    loadHealthData();
  }, []);

  const saveRawHealthData = async (data: any) => {
    const {
      data: {user},
    } = await supabase.auth.getUser();

    if (!user) return;

    const userId = user.id;

    // 실패해도 화면 표시는 계속하되, RLS·스키마 문제를 알 수 있게 로그는 남긴다.
    const logSaveError = (table: string, error: {message: string} | null) => {
      if (error) {
        console.log(`[saveRawHealthData] ${table} 저장 실패:`, error.message);
      }
    };

    if (data.heartRateSamples?.length > 0) {
      const {error} = await supabase.from('heart_rate_records').upsert(
        data.heartRateSamples.map((item: any) => ({
          user_id: userId,
          measured_at: item.time,
          bpm: item.bpm,
        })),
        {onConflict: 'user_id,measured_at'},
      );
      logSaveError('heart_rate_records', error);
    }

    if (data.bloodPressureSamples?.length > 0) {
      const {error} = await supabase.from('blood_pressure_records').upsert(
        data.bloodPressureSamples.map((item: any) => ({
          user_id: userId,
          measured_at: item.time,
          systolic: item.systolic,
          diastolic: item.diastolic,
        })),
        {onConflict: 'user_id,measured_at'},
      );
      logSaveError('blood_pressure_records', error);
    }

    if (data.oxygenSamples?.length > 0) {
      const {error} = await supabase.from('oxygen_records').upsert(
        data.oxygenSamples.map((item: any) => ({
          user_id: userId,
          measured_at: item.time,
          percentage: item.percentage,
        })),
        {onConflict: 'user_id,measured_at'},
      );
      logSaveError('oxygen_records', error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, {backgroundColor: theme.background}]}
      edges={['top']}>
      <ScrollView
        style={[styles.container, {backgroundColor: theme.background}]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, {color: theme.text}]}>
            건강 리포트
          </Text>

          <Text style={[styles.dateText, {color: theme.textMuted}]}>
            {dateText}
          </Text>
        </View>

        <ReportHeader tab={tab} onChangeTab={setTab} />

    {tab === 'daily' ? (
    <>
    <View style={styles.healthGrid}>
      <HealthCard
        title="오늘 걸음수"
        value={formatNumber(healthData?.stepsTotal)}
        unit="걸음"
        Icon={Footprints}
      />

      <HealthCard
        title="수면시간"
        value={formatSleep(healthData?.latestSleepMinutes)}
        Icon={Moon}
      />
    </View>

    <View style={styles.healthGrid}>
      <HealthCard
        title={metricConfig.heartRate.label}
        value={formatNumber(healthData?.latestHeartRate)}
        unit={metricConfig.heartRate.unit}
        Icon={HeartPulse}
        selected={selectedMetric === 'heartRate'}
        onPress={() => setSelectedMetric('heartRate')}
      />

      <HealthCard
        title={metricConfig.bloodPressure.label}
        value={
          healthData?.latestSystolic && healthData?.latestDiastolic
            ? `${Math.round(healthData.latestSystolic)}/${Math.round(
                healthData.latestDiastolic,
              )}`
            : '-'
        }
        unit={metricConfig.bloodPressure.unit}
        Icon={Activity}
        selected={selectedMetric === 'bloodPressure'}
        onPress={() => setSelectedMetric('bloodPressure')}
      />
      </View>

      <TrendChart selectedMetric={selectedMetric} healthData={healthData} />

      <StressCauseCard
        causes={stressCauses}
        period={stressPeriod}
        onPeriodChange={setStressPeriod}
      />

      <InsightCard
        peakStress={peakStress}
        lowestStress={lowestStress}
        topCause={stressCauses[0]}
      />
      </>
    ) : (
      <WeeklyReport />
    )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: SCREEN_BOTTOM_INSET,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingTop: 18,
    rowGap: 16,
  },
  healthGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: -4,
  },
  titleRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
});