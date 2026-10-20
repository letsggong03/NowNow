import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {useAppTheme} from '../../../theme/ThemeProvider';
import type {WeeklyReport} from '../types';
import ReportCard from './ReportCard';

interface StressKeywordCardProps {
  causes: WeeklyReport['causes'];
  selectedCause: string | null;
  onSelectCause: (cause: string | null) => void;
}

export default function StressKeywordCard({
  causes,
  selectedCause,
  onSelectCause,
}: StressKeywordCardProps) {
  const {theme} = useAppTheme();

  return (
    <ReportCard>
      <Text style={[styles.title, {color: theme.text}]}>
        스트레스 원인 키워드
      </Text>

      {causes.length === 0 ? (
        <Text style={[styles.hint, {color: theme.textMuted}]}>
          이번 주에는 기록된 원인이 없어요.
        </Text>
      ) : (
        <>
          <Text style={[styles.hint, {color: theme.textMuted}]}>
            키워드를 누르면 해당 날짜가 그래프에 표시돼요.
          </Text>
          <View style={styles.chips}>
            {causes.map(({cause, count}) => {
              const selected = selectedCause === cause;

              return (
                <Pressable
                  key={cause}
                  onPress={() => onSelectCause(selected ? null : cause)}
                  style={({pressed}) => [
                    styles.chip,
                    {
                      backgroundColor: selected
                        ? theme.accent
                        : theme.surfaceMuted,
                      borderColor: selected ? theme.accent : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      {color: selected ? theme.accentText : theme.text},
                    ]}>
                    #{cause}
                  </Text>
                  <Text
                    style={[
                      styles.chipCount,
                      {color: selected ? theme.accentText : theme.textMuted},
                    ]}>
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </ReportCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pressed: {
    opacity: 0.8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipCount: {
    fontSize: 12,
    fontWeight: '700',
  },
});
