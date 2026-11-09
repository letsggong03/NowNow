import React, {useEffect, useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {loadPreferences, mbtiPattern, preferenceFields, savePreferences, type Preferences} from '../../../services/personalization';
import {useAppTheme} from '../../../theme/ThemeProvider';

export default function PersonalizationModal({onClose}: {onClose: () => void}) {
  const {theme} = useAppTheme();
  const [initial, setInitial] = useState<Preferences>();
  const [draft, setDraft] = useState<Preferences>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadPreferences().then(preferences => {
      if (active) {
        setInitial(preferences);
        setDraft(preferences);
      }
    }).catch(() => {
      if (active) setError('기억해 둔 취향을 불러오지 못했어요. 다시 열어 주세요.');
    });
    return () => {active = false;};
  }, []);

  const save = async () => {
    if (!draft || saving) return;
    if (draft.nownow_mbti && !mbtiPattern.test(draft.nownow_mbti.trim().toUpperCase())) {
      setError('MBTI를 네 글자로 입력해 주세요. 예: INFP');
      return;
    }
    if (draft.nownow_age && (!/^\d+$/.test(draft.nownow_age) || +draft.nownow_age < 18 || +draft.nownow_age > 120)) {
      setError('나이는 18~120세로 입력해 주세요.');
      return;
    }
    if (draft.nownow_step_goal && (!/^\d+$/.test(draft.nownow_step_goal) || +draft.nownow_step_goal < 100 || +draft.nownow_step_goal > 100000)) {
      setError('걸음 목표는 100~100,000 사이로 입력해 주세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const changes = Object.fromEntries(preferenceFields
        .filter(({key}) => draft[key] !== initial?.[key])
        .map(({key}) => [key, draft[key]]));
      await savePreferences(changes);
      onClose();
    } catch {
      setError('저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.');
      setSaving(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={saving ? undefined : onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, {backgroundColor: theme.surface}]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, {color: theme.text}]}>뿡뿡이가 기억하는 것</Text>
            <Text style={{color: theme.textMuted}}>답변과 추천에 참고해요. 지우고 저장하면 기억에서 삭제돼요.</Text>
            {draft ? preferenceFields.map(({key, label, placeholder, maxLength}) => (
              <View key={key} style={styles.field}>
                <Text style={{color: theme.text}}>{label}</Text>
                <TextInput accessibilityLabel={label} placeholder={placeholder} placeholderTextColor={theme.textMuted}
                  maxLength={maxLength} value={draft[key]} editable={!saving}
                  autoCapitalize={key === 'nownow_mbti' ? 'characters' : 'none'}
                  keyboardType={key === 'nownow_age' || key === 'nownow_step_goal' ? 'number-pad' : 'default'}
                  onChangeText={value => setDraft(previous => previous && {...previous, [key]: value})}
                  style={[styles.input, {color: theme.text, borderColor: theme.border}]} />
              </View>
            )) : !error && <Text style={{color: theme.textMuted}}>불러오는 중…</Text>}
            {!!error && <Text accessibilityLiveRegion="polite" style={{color: theme.text}}>{error}</Text>}
            <View style={styles.actions}>
              <Pressable disabled={saving} onPress={onClose}><Text style={{color: theme.text}}>닫기</Text></Pressable>
              <Pressable disabled={!draft || saving} onPress={save}>
                <Text style={{color: draft && !saving ? theme.accent : theme.textMuted}}>{saving ? '저장 중…' : '저장'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0006'},
  card: {borderRadius: 24, padding: 20, maxHeight: '85%'},
  title: {fontSize: 20, fontWeight: '800', marginBottom: 8},
  field: {gap: 4, marginTop: 12},
  input: {borderWidth: 1, borderRadius: 12, paddingHorizontal: 12},
  actions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 20},
});
