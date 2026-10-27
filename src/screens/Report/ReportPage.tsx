import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, NativeModules, View, Text, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Activity, Footprints, HeartPulse, Moon} from 'lucide-react-native';
import HealthCard from './components/HealthCard';
import ReportHeader from './components/ReportHeader';
import StressCauseCard from './components/StressCauseCard';
import StepsStatistics from './components/StepsStatistics';
import TrendChart from './components/TrendChart';
import WeeklyReport from './components/WeeklyReport';
import {metricConfig} from './constants/reportData';
import {useReport} from './hooks/useReport';
import type {ReportTab} from './types';
import {SCREEN_BOTTOM_INSET, SCREEN_HORIZONTAL_PADDING} from '../../theme/layout';
import {useAppTheme} from '../../theme/ThemeProvider';
import {syncHealth} from '../../services/health/sync';

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
    daily,
    recommendation,
    reportStatus,
    causeStatus,
    stressCauses,
  } = useReport();

  const [healthData, setHealthData] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState('건강 데이터 조회 중');
  const [connecting, setConnecting] = useState(false);
  const connectHealth = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      if (!HealthConnectModule?.requestPermissions) {
        setHealthStatus('Health Connect 설치/앱 업데이트가 필요합니다.');
        return;
      }
      const allowed = await HealthConnectModule.requestPermissions();
      if (!allowed) {
        setHealthStatus('건강 읽기 권한이 일부 허용되지 않았습니다. 연결 버튼에서 권한을 확인해 주세요.');
        return;
      }
      const data = await HealthConnectModule.getHealthData();
      setHealthData(data);
      setHealthStatus(data.heartRateSamples?.length || data.latestSleepMinutes || data.stepsTotal
        ? 'Health Connect 실제 조회 데이터 · 항목별 미측정 값은 - 표시'
        : '권한 허용 · 데이터 없음. 삼성 헬스의 Health Connect 데이터 쓰기 설정을 확인해 주세요.');
      const syncErrors = await syncHealth(data);
      if (syncErrors.length) setHealthStatus(syncErrors.join(' · '));
    } catch {
      setHealthStatus('건강 조회 실패 · Health Connect 설치/권한/삼성 헬스 연결을 확인해 주세요.');
    } finally {
      setConnecting(false);
    }
  };

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
        const syncErrors = await syncHealth(data);
        if (syncErrors.length) setHealthStatus(syncErrors.join(' · '));
      } catch (e) {
        console.log('HealthConnect 에러:', e);
        setHealthStatus('건강 데이터 조회 실패 · Health Connect 권한/연결 확인 필요');
      }
    };

    loadHealthData();
  }, []);

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
        {tab === 'daily' && <Pressable accessibilityRole="button" disabled={connecting}
          onPress={connectHealth} style={{paddingVertical: 12}}>
          <Text style={{color: theme.accent, fontWeight: '700'}}>
            {connecting ? '건강 데이터 연결 중…' : 'Health Connect 연결 / 새로고침'}
          </Text>
        </Pressable>}
        <Text style={{color: theme.textMuted}}>
          {tab === 'daily' ? healthStatus : '주간 리포트 · 본인 계정에 저장된 실제 기록'}
        </Text>

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
      <StepsStatistics refreshKey={healthData} />
      <Text style={{color: theme.textMuted}}>{reportStatus}</Text>
      <Text style={{color: theme.text}}>오늘 스트레스 지표: {daily?.finalDailyStressScore ?? '데이터 없음'}{daily?.finalDailyStressScore != null ? ' / 100' : ''}</Text>
      {!!daily?.missing?.length && <Text style={{color: theme.textMuted}}>부족한 자료: {daily.missing.join(', ')}</Text>}
      {!!recommendation?.message && <Text style={{color: theme.text}}>{recommendation.message}</Text>}
      {!!recommendation?.routine && <Text style={{color: theme.text}}>{recommendation.routine.title}{'\n'}{recommendation.routine.steps.join('\n')}</Text>}

      <StressCauseCard
        causes={stressCauses}
        period={stressPeriod}
        onPeriodChange={setStressPeriod}
      />

      <Text style={{color: theme.textMuted}}>{causeStatus}</Text>
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
