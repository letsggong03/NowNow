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
import {chatAiConfig} from '../../services/api/chatAiConfig';

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
  const [healthStatus, setHealthStatus] = useState('건강 데이터 조회 중');

  useEffect(() => {
    const loadHealthData = async () => {
      // 에뮬레이터처럼 Health Connect를 쓸 수 없는 개발 환경에서는 목업 데이터로 UI를 확인한다.
      if (!HealthConnectModule) {
        setHealthStatus('Health Connect 연결 필요 · 건강 데이터 없음');
        return;
      }

      try {
        const data = await HealthConnectModule.getHealthData();
        setHealthData(data);
        setHealthStatus(data.heartRateSamples?.length || data.latestSleepMinutes || data.stepsTotal
          ? 'Health Connect 실제 조회 데이터 · 항목별 미측정 값은 - 표시'
          : '조회 완료 · 저장된 건강 데이터 없음');
        if (chatAiConfig.demoMode !== true) await saveRawHealthData(data);
      } catch (e) {
        console.log('HealthConnect 에러:', e);
        setHealthStatus('건강 데이터 조회 실패 · Health Connect 권한/연결 확인 필요');
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

    if (data.heartRateSamples?.length > 0) {
      await supabase.from('heart_rate_records').upsert(
        data.heartRateSamples.map((item: any) => ({
          user_id: userId,
          measured_at: item.time,
          bpm: item.bpm,
        })),
        {onConflict: 'user_id,measured_at'},
      );
    }

    if (data.bloodPressureSamples?.length > 0) {
      await supabase.from('blood_pressure_records').upsert(
        data.bloodPressureSamples.map((item: any) => ({
          user_id: userId,
          measured_at: item.time,
          systolic: item.systolic,
          diastolic: item.diastolic,
        })),
        {onConflict: 'user_id,measured_at'},
      );
    }

    if (data.oxygenSamples?.length > 0) {
      await supabase.from('oxygen_records').upsert(
        data.oxygenSamples.map((item: any) => ({
          user_id: userId,
          measured_at: item.time,
          percentage: item.percentage,
        })),
        {onConflict: 'user_id,measured_at'},
      );
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
        <Text style={{color: theme.textMuted}}>
          {tab === 'daily' ? healthStatus : '주간 차트는 팀 원본의 화면 예시 데이터입니다. 실제 사용자 분석은 백엔드 서버 연결 필요.'}
        </Text>
        {chatAiConfig.demoMode === true && (
          <Text style={{color: theme.textMuted}}>로그인 생략으로 Supabase 계정 저장은 사용하지 않습니다.</Text>
        )}

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
        value={healthData?.latestHeartRate > 0 ? formatNumber(healthData.latestHeartRate) : '-'}
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
      <Text style={{color: theme.textMuted}}>아래 스트레스 원인·요약은 팀 원본의 화면 예시입니다. 실제 기록 분석은 백엔드 서버 연결 필요.</Text>

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
