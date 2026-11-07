import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {getSettings, updateStressThreshold} from '../../../services/api/profile';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {DEFAULT_STRESS_CARE_THRESHOLD, stressLevels} from '../../Report/constants/reportData';

export default function StressThresholdSettings() {
  const {theme} = useAppTheme();
  const [value, setValue] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  useEffect(() => {
    let active = true;
    getSettings().then(settings => {
      if (active) setValue(String(settings?.stress_threshold ?? DEFAULT_STRESS_CARE_THRESHOLD));
    }).catch(() => {
      if (active) setStatus('서버 연결을 확인한 뒤 다시 열어 주세요.');
    });
    return () => {active = false;};
  }, []);

  const save = async () => {
    if (saving || value === undefined) return;
    if (!/^\d{1,3}$/.test(value) || Number(value) > 100) {
      setStatus('0에서 100 사이의 정수를 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      await updateStressThreshold(Number(value));
      setStatus('스트레스 기준을 저장했어요.');
    } catch {
      setStatus('기준을 저장하지 못했어요. 서버 연결을 확인해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const levels = [...stressLevels].reverse();

  return <>
    <View style={[styles.card, {backgroundColor: theme.surface}]}>
      <Text style={[styles.heading, {color: theme.text}]}>점수는 어떻게 읽나요?</Text>
      <View style={styles.levels}>{levels.map((level, index) => {
        const upper = levels[index + 1]?.min;
        const range = upper === undefined ? `${level.min}~100점` : `${level.min}점 이상 · ${upper}점 미만`;
        return <View key={level.min} style={[styles.level, {backgroundColor: theme.background}]}>
          <View style={styles.levelTitle}>
            <View style={[styles.dot, {backgroundColor: theme[level.colorKey]}]} />
            <Text style={[styles.label, {color: theme.text}]}>{level.label}</Text>
          </View>
          <Text style={{color: theme.textMuted}}>{range}</Text>
        </View>;
      })}</View>
      <Text style={[styles.body, {color: theme.textMuted}]}>나우나우의 생활관리 참고 지표예요. 심박 기록이 충분한 시간에는 평균 심박수와 심박수 변화 폭을 점수로 만들어요. 하루 점수는 그 점수들의 평균·높았던 시간의 비율·최고점에 혈압과 걸음수를 반영하고, 수면시간으로 보정해요.</Text>
    </View>
    <View style={[styles.card, {backgroundColor: theme.surface}]}>
    <Text style={[styles.heading, {color: theme.text}]}>뿡뿡이의 제안 기준</Text>
    <Text style={[styles.body, {color: theme.textMuted}]}>건강 기록을 물었을 때 점수가 이 기준에 닿으면 뿡뿡이가 쉬어가는 방법을 제안해요. 더 일찍 받고 싶으면 기준을 낮추면 돼요. 리포트의 점수와 구간은 그대로예요.</Text>
    <Text style={[styles.body, {color: theme.textMuted}]}>기본값은 70점이에요. 팀 계산 코드가 70점부터 높은 시간대로 세어서, 뿡뿡이의 제안도 같은 지점에서 시작해요.</Text>
    {value !== undefined && <>
      <TextInput accessibilityLabel="스트레스 기준 점수" keyboardType="number-pad" value={value}
        maxLength={3} editable={!saving} onChangeText={setValue} style={[styles.input, {color: theme.text, borderColor: theme.border}]} />
      <Pressable accessibilityRole="button" disabled={saving} onPress={save} style={[styles.save, {backgroundColor: theme.accent}]}>
        <Text style={{color: theme.accentText}}>{saving ? '저장 중…' : '기준 저장'}</Text>
      </Pressable>
    </>}
    {!!status && <Text accessibilityLiveRegion="polite" style={{color: theme.textMuted}}>{status}</Text>}
    </View>
  </>;
}

const styles = StyleSheet.create({
  card: {padding: 16, borderRadius: 20, gap: 12},
  heading: {fontSize: 17, fontWeight: '800'},
  body: {lineHeight: 20},
  levels: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  level: {width: '48%', flexGrow: 1, padding: 10, borderRadius: 12, gap: 4},
  levelTitle: {flexDirection: 'row', alignItems: 'center', gap: 6},
  label: {fontWeight: '700'},
  dot: {width: 8, height: 8, borderRadius: 4},
  input: {borderWidth: 1, borderRadius: 12, minHeight: 44, paddingHorizontal: 12},
  save: {borderRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
});
