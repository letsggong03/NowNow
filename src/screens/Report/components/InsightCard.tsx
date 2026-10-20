import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {AlertCircle, ChevronRight, Sparkles} from 'lucide-react-native';

import {useAppTheme} from '../../../theme/ThemeProvider';
import {withJosa} from '../../../utils/josa';
import {insightFallbacks} from '../constants/reportData';
import type {HrvPoint, StressCause} from '../types';
import ReportCard from './ReportCard';

interface InsightCardProps {
  peakStress: HrvPoint;
  lowestStress: HrvPoint;
  topCause: StressCause;
}

export default function InsightCard({
  peakStress,
  lowestStress,
  topCause,
}: InsightCardProps) {
  const {theme} = useAppTheme();

  return (
    <>
      <ReportCard style={styles.analysisCard}>
        <View style={styles.titleRow}>
          <AlertCircle color={theme.warning} size={21} />
          <Text style={[styles.title, {color: theme.text}]}>스트레스 분석</Text>
        </View>
        <View style={[styles.analysisBox, {backgroundColor: theme.accentMuted}]}>
          <Text style={[styles.caption, {color: theme.textMuted}]}>
            가장 스트레스가 높은 시간
          </Text>
          <Text style={[styles.pointText, {color: theme.accent}]}>
            {peakStress.time}
          </Text>
          <Text style={[styles.description, {color: theme.text}]}>
            {peakStress.note ?? insightFallbacks.peakNote}
          </Text>
        </View>
        <View style={[styles.analysisBox, {backgroundColor: theme.accentMuted}]}>
          <Text style={[styles.caption, {color: theme.textMuted}]}>
            가장 안정적인 시간
          </Text>
          <Text style={[styles.pointText, {color: theme.accent}]}>
            {lowestStress.time}
          </Text>
          <Text style={[styles.description, {color: theme.text}]}>
            {lowestStress.note ?? insightFallbacks.lowestNote}
          </Text>
        </View>
      </ReportCard>

      <ReportCard style={styles.recommendCard}>
        <View style={styles.titleRow}>
          <Sparkles color={theme.accent} size={21} />
          <Text style={[styles.title, {color: theme.text}]}>AI 추천</Text>
        </View>
        <Text style={[styles.recommendText, {color: theme.text}]}>
          이번 기록에서는 {withJosa(topCause.cause, '이/가')} 가장 크게 나타났어요. 짧은
          호흡 루틴이나 10분 산책이 도움이 될 수 있어요.
        </Text>
        <Pressable
          style={({pressed}) => [
            styles.button,
            {backgroundColor: theme.accent},
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.buttonText, {color: theme.accentText}]}>
            맞춤형 루틴 시작하기
          </Text>
          <ChevronRight color={theme.accentText} size={18} />
        </Pressable>
      </ReportCard>
    </>
  );
}

const styles = StyleSheet.create({
  analysisCard: {
    rowGap: 12,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  analysisBox: {
    borderRadius: 14,
    padding: 14,
  },
  caption: {
    fontSize: 12,
    fontWeight: '700',
  },
  pointText: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 5,
  },
  description: {
    fontSize: 13,
    marginTop: 3,
  },
  recommendCard: {
    rowGap: 13,
  },
  recommendText: {
    fontSize: 14,
    lineHeight: 21,
  },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
  },
  pressed: {
    opacity: 0.82,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
