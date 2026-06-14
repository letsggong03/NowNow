import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, NativeModules, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import InsightCard from './components/InsightCard';
import MetricCards from './components/MetricCards';
import ReportHeader from './components/ReportHeader';
import SleepCard from './components/SleepCard';
import StressCauseCard from './components/StressCauseCard';
import TrendChart from './components/TrendChart';
import {useReport} from './hooks/useReport';
import {useAppTheme} from '../../theme/ThemeProvider';

const {HealthConnectModule} = NativeModules;

export default function ReportPage() {
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

  const [steps, setSteps] = useState<number | null>(null);

  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    const loadHealthData = async () => {
      try {
        const data = await HealthConnectModule.getHealthData();
        console.log('Health data:', data);

        setHealthData(data);
        setSteps(data.stepsTotal);
      } catch (e) {
        console.log('HealthConnect 에러:', e);
      }
    };

    loadHealthData();
   }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, {backgroundColor: theme.background}]}
      edges={['top']}>
      <ScrollView
        alwaysBounceVertical
        keyboardShouldPersistTaps="handled"
        scrollEnabled
        style={[styles.container, {backgroundColor: theme.background}]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <ReportHeader />
        <View style={[styles.healthCard, {backgroundColor: theme.surface}]}>
          <Text style={[styles.healthTitle, {color: theme.text}]}>
            Health Connect 데이터
          </Text>
          <Text style={[styles.healthValue, {color: theme.text}]}>
            최근 7일 걸음 수: {steps === null ? '불러오는 중...' : `${steps} 걸음`}
          </Text>
          <Text>걸음 수: {healthData?.stepsTotal ?? '-'}</Text>
          <Text>심박수: {healthData?.latestHeartRate ?? '-'}</Text>
          <Text>산소포화도: {healthData?.latestOxygen ?? '-'}</Text>
          <Text>수면시간: {healthData?.latestSleepHours ?? '-'}</Text>
          <Text>
            혈압: {healthData ? `${healthData.latestSystolic}/${healthData.latestDiastolic}` : '-'}
          </Text>
        </View>
        <MetricCards
          selectedMetric={selectedMetric}
          onSelectMetric={setSelectedMetric}
        />
        <TrendChart selectedMetric={selectedMetric} />
        <StressCauseCard
          causes={stressCauses}
          period={stressPeriod}
          onPeriodChange={setStressPeriod}
        />
        <SleepCard />
        <InsightCard
          peakStress={peakStress}
          lowestStress={lowestStress}
          topCause={stressCauses[0]}
        />
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
  healthCard: {
  borderRadius: 20,
  padding: 16,
  rowGap: 8,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  healthValue: {
    fontSize: 15,
    fontWeight: '600',
  },
});
