import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {Circle, Line, Path, Text as SvgText} from 'react-native-svg';
import {format, parseISO} from 'date-fns';
import {ko} from 'date-fns/locale';

import {useAppTheme} from '../../../theme/ThemeProvider';
import {
  getStressLevel,
  STRESS_SCORE_MAX,
  stressLevels,
} from '../constants/reportData';
import type {DailyStress} from '../types';
import ReportCard from './ReportCard';

const CHART_HEIGHT = 160;
// 점 위에 단계 라벨을 그릴 공간
const CHART_TOP_PADDING = 30;
const CHART_BOTTOM_PADDING = 10;
const POINT_RADIUS = 6;
const HIGHLIGHT_RADIUS = 9;
const FADE_DURATION = 300;

interface WeeklyStressChartProps {
  days: DailyStress[];
  highlightedDates: Set<string>;
  animationKey: string;
}

export default function WeeklyStressChart({
  days,
  highlightedDates,
  animationKey,
}: WeeklyStressChartProps) {
  const {theme} = useAppTheme();
  const [width, setWidth] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      duration: FADE_DURATION,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [animationKey, fadeAnim]);

  const averageLevel = getStressLevel(
    days.reduce((sum, day) => sum + day.score, 0) / days.length,
  );

  const columnWidth = width / days.length;
  const plotHeight = CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING;
  const toX = (index: number) => columnWidth * (index + 0.5);
  const toY = (score: number) =>
    CHART_TOP_PADDING + (1 - score / STRESS_SCORE_MAX) * plotHeight;

  const points = days.map((day, index) => ({
    ...day,
    x: toX(index),
    y: toY(day.score),
    level: getStressLevel(day.score),
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');

  // 단계가 바뀌는 기준선 (보통/나쁨, 나쁨/최악 경계)
  const thresholds = stressLevels.filter(level => level.min > 0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <ReportCard>
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.text}]}>
          일일 스트레스 지수 변화
        </Text>
        <Text style={[styles.average, {color: theme.textMuted}]}>
          주간 평균{' '}
          <Text
            style={[styles.averageValue, {color: theme[averageLevel.colorKey]}]}>
            {averageLevel.label}
          </Text>
        </Text>
      </View>

      <Animated.View
        onLayout={handleLayout}
        style={[styles.chart, {opacity: fadeAnim}]}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {thresholds.map(level => (
              <Line
                key={level.min}
                x1={0}
                x2={width}
                y1={toY(level.min)}
                y2={toY(level.min)}
                stroke={theme.border}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            ))}

            <Path
              d={linePath}
              fill="none"
              stroke={theme.textMuted}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />

            {points.map(point => {
              const highlighted = highlightedDates.has(point.date);
              const color = theme[point.level.colorKey];

              return (
                <React.Fragment key={point.date}>
                  {highlighted && (
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={HIGHLIGHT_RADIUS}
                      fill={color}
                      opacity={0.25}
                    />
                  )}
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={POINT_RADIUS}
                    fill={color}
                    stroke={theme.surface}
                    strokeWidth={2}
                  />
                  <SvgText
                    x={point.x}
                    y={point.y - HIGHLIGHT_RADIUS - 6}
                    fill={color}
                    fontSize={highlighted ? 12 : 11}
                    fontWeight="700"
                    textAnchor="middle">
                    {point.level.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        )}
      </Animated.View>

      <View style={styles.labels}>
        {days.map(day => {
          const highlighted = highlightedDates.has(day.date);
          const date = parseISO(day.date);

          return (
            <View key={day.date} style={styles.labelColumn}>
              <Text
                style={[
                  styles.dayLabel,
                  {color: highlighted ? theme.text : theme.textMuted},
                ]}>
                {format(date, 'EEEEE', {locale: ko})}
              </Text>
              <Text style={[styles.dateLabel, {color: theme.textMuted}]}>
                {format(date, 'M/d')}
              </Text>
            </View>
          );
        })}
      </View>
    </ReportCard>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  average: {
    fontSize: 12,
    fontWeight: '600',
  },
  averageValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  chart: {
    height: CHART_HEIGHT,
  },
  labels: {
    flexDirection: 'row',
    marginTop: 4,
  },
  labelColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
