import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, NativeModules, View, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Activity, Footprints, HeartPulse, Moon} from 'lucide-react-native';
import HealthCard from './components/HealthCard';
import InsightCard from './components/InsightCard';
import ReportHeader from './components/ReportHeader';
import StressCauseCard from './components/StressCauseCard';
import TrendChart from './components/TrendChart';
import {useReport} from './hooks/useReport';
import {useAppTheme} from '../../theme/ThemeProvider';
import {supabase} from '../../services/supabase';

import WeeklyReportItem from './components/WeeklyReportItem';

const {HealthConnectModule} = NativeModules;

const formatSleep = (minutes?: number) => {
  if (!minutes) return '-';

  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);

  return `${h}시간 ${m}분`;
};

const today = new Date();

const dateText = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(new Date());

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return Math.round(value).toLocaleString();
};

export default function ReportPage() {
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const {theme} = useAppTheme();

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
      try {
        const data = await HealthConnectModule.getHealthData();
        console.log('Health data:', data);

        setHealthData(data);
        await saveRawHealthData(data);
      } catch (e) {
        console.log('HealthConnect 에러:', e);
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
        title="심박수"
        value={formatNumber(healthData?.latestHeartRate)}
        unit="bpm"
        Icon={HeartPulse}
        selected={selectedMetric === 'heartRate'}
        onPress={() => setSelectedMetric('heartRate')}
      />

      <HealthCard
        title="혈압"
        value={
          healthData?.latestSystolic && healthData?.latestDiastolic
            ? `${Math.round(healthData.latestSystolic)}/${Math.round(
                healthData.latestDiastolic,
              )}`
            : '-'
        }
        unit="mmHg"
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
      <>
        <WeeklyReportItem title="2026년 6월 둘째 주" />
        <WeeklyReportItem title="2026년 6월 첫째 주" />
        <WeeklyReportItem title="2026년 5월 넷째 주" />
        <WeeklyReportItem title="2026년 5월 셋째 주" />
      </>
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
    paddingBottom: 110,
    paddingHorizontal: 18,
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