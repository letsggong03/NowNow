import React, {useEffect, useState} from 'react';
import {NativeModules, StyleSheet, Text, View} from 'react-native';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {metricConfig} from '../constants/reportData';
import ReportCard from './ReportCard';
import AnimatedBar from './AnimatedBar';
import TrendChart from './TrendChart';

type Trend = {start: string; end: string; points: {time: string; value: number}[]};
const HOUR_MS = 60 * 60 * 1000;
const timeLabel = (ms: number) => new Date(ms).toLocaleTimeString('ko-KR', {
  hour: '2-digit', minute: '2-digit', hour12: false,
});

export default function ActivityTrendCard({metric, revision}: {metric: 'steps' | 'sleep'; revision: number}) {
  const {theme} = useAppTheme();
  const config = metricConfig[metric];
  const [trend, setTrend] = useState<Trend | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setTrend(null);
    setError('');
    const native = NativeModules.HealthConnectModule;
    if (!native?.getActivityTrend) {
      setError('시간대별 기록을 보려면 앱을 업데이트해 주세요.');
      return;
    }
    native.getActivityTrend(metric).then((result: Trend) => {
      if (active) setTrend(result);
    }).catch(() => {
      if (active) setError('Health Connect의 기록 읽기 권한을 확인해 주세요.');
    });
    return () => {active = false;};
  }, [metric, revision]);

  if (metric === 'steps') {
    return <TrendChart selectedMetric="steps" hourlySteps={trend?.points} stepsStatus={error} />;
  }

  const start = trend ? Date.parse(trend.start) : 0;
  const points = new Map<number, number>();
  for (const point of trend?.points ?? []) {
    const time = new Date(point.time);
    const hour = Math.round((time.getTime() - start) / HOUR_MS);
    points.set(hour, (points.get(hour) ?? 0) + point.value);
  }
  const max = Math.max(config.chartBaseMax, ...points.values());
  const total = [...points.values()].reduce((sum, value) => sum + value, 0);

  return <ReportCard>
    <Text style={[styles.title, {color: theme.text}]}>{config.chartTitle}</Text>
    {trend && points.size > 0 ? <>
      {points.size > 0 && <Text style={[styles.summary, {color: theme.text}]}>{Math.round(total).toLocaleString()} {config.unit}</Text>}
      <Text style={{color: theme.textMuted}}>어제 {timeLabel(start)} ~ 오늘 {timeLabel(Date.parse(trend.end))}</Text>
      <View style={styles.chart}>
        {Array.from({length: 24}, (_, index) => {
          const value = points.get(index);
          const hour = timeLabel(start + index * HOUR_MS);
          return <View key={index} style={styles.column} accessible
            accessibilityLabel={`${hour}부터 1시간, ${value === undefined ? '기록 없음' : `${Math.round(value)}${config.unit}`}`}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}
              style={[styles.valueLabel, {color: theme.textMuted}]}>{value === undefined ? '' : Math.round(value)}</Text>
            <AnimatedBar index={index} animationKey={`${metric}-${trend.start}`} height={value ? Math.max(18, value / max * 140) : 2}
              colorStyle={{backgroundColor: value === undefined ? theme.border : theme.nav}} />
          </View>;
        })}
      </View>
      <View style={styles.labels}>
        {[0, 3, 6, 9, 12, 15, 18, 21, 24].map(hour => <Text key={hour} style={{color: theme.textMuted, fontSize: 9}}>{timeLabel(start + hour * HOUR_MS)}</Text>)}
      </View>
      <Text style={{color: theme.textMuted, fontSize: 12}}>막대는 각 시간대에 기록된 수면 시간이에요.</Text>
    </> : <Text style={{color: theme.textMuted}}>{error || (trend ? '최근 24시간에 공유된 기록이 없어요.' : '기록을 불러오고 있어요…')}</Text>}
  </ReportCard>;
}

const styles = StyleSheet.create({
  title: {fontSize: 17, fontWeight: '800', marginBottom: 10},
  summary: {fontSize: 24, fontWeight: '800', marginBottom: 4},
  chart: {height: 170, flexDirection: 'row', gap: 3, alignItems: 'flex-end', marginTop: 12},
  column: {flex: 1, justifyContent: 'flex-end'},
  valueLabel: {fontSize: 8, textAlign: 'center', marginBottom: 8, width: '100%'},
  labels: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 10},
});
