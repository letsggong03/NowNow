import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useAppTheme} from '../../../theme/ThemeProvider';
import {metricConfig} from '../constants/reportData';
import type {MetricType} from '../types';
import AnimatedBar from './AnimatedBar';
import ReportCard from './ReportCard';

const HOURS_PER_DAY = 24;
const CHART_HEIGHT = 170;
const BAR_MAX_HEIGHT = 140;
const BAR_MIN_HEIGHT = 18;
const EMPTY_BAR_HEIGHT = 2;
const HOUR_LABEL_INTERVAL = 3;

interface TrendChartProps {
  selectedMetric: MetricType;
  healthData: any;
}

interface ChartItem {
  time: string;
  value: number;
}

export default function TrendChart({selectedMetric, healthData}: TrendChartProps) {
  const {theme} = useAppTheme();

  const isBloodPressure = selectedMetric === 'bloodPressure';
  const {chartTitle: title, unit, chartBaseMax} = metricConfig[selectedMetric];

  const rawData = isBloodPressure
    ? healthData?.bloodPressureSamples ?? []
    : healthData?.heartRateSamples ?? [];

    const chartData: ChartItem[] = Array.from({length: HOURS_PER_DAY}, (_, hour) => ({
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

  // 기준값보다 큰 측정값이 있으면 막대가 차트 밖으로 넘치지 않도록 최댓값을 늘린다.
  const maxValue = Math.max(chartBaseMax, ...chartData.map(item => item.value));
  const lastHour = (HOURS_PER_DAY - 1).toString();

  return (
    <ReportCard>
      <Text style={[styles.title, {color: theme.text}]}>{title}</Text>
    
      <View style={styles.chart}>
        {chartData.map((item, index) => {
          const height =
            item.value > 0
              ? Math.max(BAR_MIN_HEIGHT, (item.value / maxValue) * BAR_MAX_HEIGHT)
              : EMPTY_BAR_HEIGHT;

          const hour = item.time;

          const shouldShowHour =
            Number(hour) % HOUR_LABEL_INTERVAL === 0 || hour === lastHour;

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
              animationKey={selectedMetric}
            />

            <Text style={[styles.timeLabel, {color: theme.textMuted}]}>
               {shouldShowHour ? (hour === lastHour ? HOURS_PER_DAY : hour) : ''}
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
    height: CHART_HEIGHT,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
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
    height: CHART_HEIGHT,
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