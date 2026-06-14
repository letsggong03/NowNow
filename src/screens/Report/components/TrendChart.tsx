import React, {useEffect, useRef} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import {useAppTheme} from '../../../theme/ThemeProvider';
import type {MetricType} from '../types';
import ReportCard from './ReportCard';

interface TrendChartProps {
  selectedMetric: MetricType;
  healthData: any;
}

interface ChartItem {
  time: string;
  value: number;
}

interface AnimatedBarProps {
  colorStyle: ViewStyle;
  height: number;
  index: number;
  metricKey: MetricType;
}

function AnimatedBar({colorStyle, height, index, metricKey}: AnimatedBarProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      delay: index * 35,
      duration: 320,
      toValue: 1,
      useNativeDriver: false,
    }).start();
  }, [index, metricKey, progress]);

  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });

  return (
    <Animated.View style={[styles.bar, colorStyle, {height: animatedHeight}]} />
  );
}

export default function TrendChart({selectedMetric, healthData}: TrendChartProps) {
  const {theme} = useAppTheme();

  const isBloodPressure = selectedMetric === 'bloodPressure';
  const maxValue = isBloodPressure ? 150 : 120;
  const title = isBloodPressure ? '최근 24시간 혈압 변화' : '최근 24시간 심박수 변화';
  const unit = isBloodPressure ? 'mmHg' : 'bpm';

  const rawData = isBloodPressure
    ? healthData?.bloodPressureSamples ?? []
    : healthData?.heartRateSamples ?? [];

    const chartData: ChartItem[] = Array.from({length: 24}, (_, hour) => ({
    time: hour.toString().padStart(2, '0'),
    value: 0,
    }));

    rawData.forEach((item: any) => {
      if (!item.time) return;

      const hour = new Date(item.time).getHours();

      const value = isBloodPressure
        ? item.systolic
        : item.bpm;

      chartData[hour].value = value;
    });
          
  return (
    <ReportCard>
      <Text style={[styles.title, {color: theme.text}]}>{title}</Text>
    
      <View style={styles.chart}>
        {chartData.map((item, index) => {
          const height =
            item.value > 0
              ? Math.max(18, (item.value / maxValue) * 140)
              : 2;

          const hour = item.time;

          const shouldShowHour =
            Number(hour) % 3 === 0 || hour === '23';

         return (
          <View key={`${item.time}-${index}`} style={styles.barColumn}>
            <Text style={[styles.valueLabel, {color: theme.textMuted}]}>
              {item.value > 0 ? Math.round(item.value) : ''}
            </Text>

            <AnimatedBar
              colorStyle={
                isBloodPressure
                  ? {backgroundColor: theme.nav}
                  : {backgroundColor: theme.accent}
              }
              height={height}
              index={index}
              metricKey={selectedMetric}
            />

            <Text style={[styles.timeLabel, {color: theme.textMuted}]}>
               {shouldShowHour ? (hour === '23' ? '24' : hour) : ''}
            </Text>
          </View>
          );
        })}
      </View>

      <View
        style={[
          styles.xAxis,
          {backgroundColor: theme.border},
        ]}
      />
      
      

      <Text style={[styles.unitText, {color: theme.textMuted}]}>
        단위: {unit}
      </Text>
    </ReportCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 18,
  },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 3,
    height: 170,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 8,
    width: '100%',
  },
  timeLabel: {
    fontSize: 9,
    marginTop: 12,
    width :22,
    textAlign: 'center',
  },
  valueLabel: {
    fontSize: 8,
    marginBottom: 8,
  },
  unitText: {
    fontSize: 11,
    marginTop: 12,
    textAlign: 'right',
  },
  emptyBox: {
    alignItems: 'center',
    height: 170,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  xAxis: {
  height: 1,
  width: '100%',
  marginTop: 4,
},
});