import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ScrollView, StyleSheet, NativeModules, View, Text, Button, TextInput} from 'react-native';
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
import {getTodayBloodPressure, saveHealthRecords} from '../../services/api/health';

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
  const [bloodPressure, setBloodPressure] = useState<Awaited<ReturnType<typeof getTodayBloodPressure>>>([]);
  const [healthStatus, setHealthStatus] = useState('');
  const [inputOpen, setInputOpen] = useState(false);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [saving, setSaving] = useState(false);
  const [manualTime, setManualTime] = useState('');
  const [syncing, setSyncing] = useState(false);
  const healthOperation = useRef(false);

  const loadHealthData = async (requestPermissions = false) => {
    if (healthOperation.current) return;
    healthOperation.current = true;
    setSyncing(true);
    setHealthStatus('');
    if (HealthConnectModule) {
      try {
        if (requestPermissions) await HealthConnectModule.requestHealthPermissions();
        const data = await HealthConnectModule.getHealthData();
        setHealthData(data);
        await saveHealthRecords(data).catch(() => setHealthStatus('건강 기록을 서버에 동기화하지 못했어요.'));
      } catch {
        setHealthStatus('Health Connect의 데이터 읽기 권한을 확인해 주세요.');
      }
    }
    try {
      setBloodPressure(await getTodayBloodPressure());
    } catch {
      setHealthStatus(previous => previous || '저장된 혈압 기록을 불러오지 못했어요.');
    } finally {
      healthOperation.current = false;
      setSyncing(false);
    }
  };

  useEffect(() => {
    void loadHealthData();
  }, []);

  const saveManualBloodPressure = async () => {
    if (healthOperation.current) return;
    const upper = Number(systolic);
    const lower = Number(diastolic);
    if (!/^\d+$/.test(systolic) || !/^\d+$/.test(diastolic) || upper < 40 || upper > 300 || lower < 20 || lower > 200 || upper <= lower) {
      setHealthStatus('혈압계에 표시된 수축기·이완기 혈압을 확인해 주세요.');
      return;
    }
    const time = manualTime || new Date().toISOString();
    healthOperation.current = true;
    setManualTime(time);
    setSaving(true);
    try {
      await saveHealthRecords({bloodPressureSamples: [{time, systolic: upper, diastolic: lower}]});
      setBloodPressure(previous => [...previous.filter(row => Date.parse(row.time) !== Date.parse(time)), {time, systolic: upper, diastolic: lower}]);
      setInputOpen(false);
      setSystolic('');
      setDiastolic('');
      setManualTime('');
      setHealthStatus('혈압 기록을 저장했어요.');
    } catch {
      setHealthStatus('혈압 기록을 저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.');
    } finally {
      healthOperation.current = false;
      setSaving(false);
    }
  };

  const pressureByTime = new Map<number, (typeof bloodPressure)[number]>();
  for (const row of [...bloodPressure, ...(healthData?.bloodPressureSamples ?? [])]) {
    pressureByTime.set(Date.parse(row.time), row);
  }
  const pressureSamples = [...pressureByTime.values()].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  const latestPressure = pressureSamples[pressureSamples.length - 1];

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
          latestPressure
            ? `${Math.round(latestPressure.systolic)}/${Math.round(latestPressure.diastolic)}`
            : '-'
        }
        unit={metricConfig.bloodPressure.unit}
        Icon={Activity}
        selected={selectedMetric === 'bloodPressure'}
        onPress={() => setSelectedMetric('bloodPressure')}
      />
      </View>

      <TrendChart selectedMetric={selectedMetric} healthData={{...healthData, bloodPressureSamples: pressureSamples}} />
      <Button title={syncing ? '건강 기록 동기화 중' : '건강 기록 동기화'} disabled={syncing || saving} onPress={() => void loadHealthData(true)} />
      <Button title={inputOpen ? '혈압 입력 닫기' : '혈압 직접 입력'} onPress={() => setInputOpen(!inputOpen)} disabled={saving} />
      {inputOpen && <View>
        <TextInput accessibilityLabel="수축기 혈압" placeholder="수축기 혈압 (mmHg)" placeholderTextColor={theme.textMuted} style={{color: theme.text}} keyboardType="number-pad" editable={!saving} value={systolic} onChangeText={setSystolic} />
        <TextInput accessibilityLabel="이완기 혈압" placeholder="이완기 혈압 (mmHg)" placeholderTextColor={theme.textMuted} style={{color: theme.text}} keyboardType="number-pad" editable={!saving} value={diastolic} onChangeText={setDiastolic} />
        <Button title="현재 시각으로 저장" disabled={saving || syncing} onPress={() => void saveManualBloodPressure()} />
      </View>}
      {!!healthStatus && <Text style={{color: theme.text}}>{healthStatus}</Text>}

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
