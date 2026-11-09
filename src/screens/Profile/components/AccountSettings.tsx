import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {KeyRound, Mail, UserRound} from 'lucide-react-native';
import {supabase} from '../../../services/supabase';
import {useAppTheme} from '../../../theme/ThemeProvider';
import SettingsSection from './SettingsSection';

const genders = [
  {key: 'female', label: '여성'}, {key: 'male', label: '남성'},
  {key: 'other', label: '기타'}, {key: '', label: '미입력'},
];

export default function AccountSettings({onProfileSaved}: {onProfileSaved: () => void}) {
  const {theme} = useAppTheme();
  const [tab, setTab] = useState<'profile' | 'email' | 'password'>('profile');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(auth => {
      if (!active) return;
      if (auth.error || !auth.data.user) throw auth.error ?? new Error();
      const {user} = auth.data;
      const metadata = user.user_metadata;
      setNickname(typeof metadata.nownow_chat_name === 'string' ? metadata.nownow_chat_name : '');
      setEmail(user.email ?? '');
      setAge(typeof metadata.nownow_age === 'string' ? metadata.nownow_age : '');
      setGender(genders.some(item => item.key === metadata.nownow_gender) ? metadata.nownow_gender : '');
      setReady(true);
    }).catch(() => {if (active) setStatus('계정 정보를 불러오지 못했어요. 다시 열어 주세요.');});
    return () => {active = false;};
  }, []);

  const save = async () => {
    if (!ready || saving || tab === 'email') return;
    const name = nickname.trim();
    if (tab === 'profile' && age && (!/^\d+$/.test(age) || +age < 18 || +age > 120)) {
      return setStatus('나이는 18~120세로 입력해 주세요.');
    }
    if (tab === 'password' && (!currentPassword || password.length < 6 || password !== confirmation)) {
      return setStatus('현재 비밀번호를 입력하고, 새 비밀번호를 6자 이상으로 똑같이 두 번 입력해 주세요.');
    }
    setSaving(true);
    setStatus('');
    try {
      if (tab === 'profile') {
        const {error} = await supabase.auth.updateUser({data: {nownow_chat_name: name || null, nownow_age: age || null, nownow_gender: gender || null}});
        if (error) throw error;
        onProfileSaved();
        setStatus('프로필을 저장했어요.');
      } else {
        const {error} = await supabase.auth.updateUser({password, current_password: currentPassword});
        if (error) throw error;
        setCurrentPassword('');
        setPassword('');
        setConfirmation('');
        setStatus('비밀번호를 변경했어요.');
      }
    } catch {
      setStatus(tab === 'profile' ? '프로필 정보를 모두 저장하지 못했어요. 연결을 확인해 주세요.'
        : '비밀번호를 변경하지 못했어요. 현재 비밀번호와 연결 상태를 확인해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const select = (next: typeof tab) => {
    if (saving || next === tab) return;
    setTab(next);
    if (ready) setStatus('');
    setCurrentPassword('');
    setPassword('');
    setConfirmation('');
  };

  const inputStyle = [styles.input, {color: theme.text, borderColor: theme.border}];
  return <>
    <SettingsSection items={[
      {label: '프로필', Icon: UserRound, onPress: () => select('profile')},
      {label: '이메일', Icon: Mail, onPress: () => select('email')},
      {label: '비밀번호', Icon: KeyRound, onPress: () => select('password')},
    ]} />
    <View style={[styles.card, {backgroundColor: theme.surface}]}>
      {ready && tab === 'profile' && <>
        <Text style={{color: theme.text}}>닉네임</Text>
        <TextInput accessibilityLabel="닉네임" placeholder="뿡뿡이가 불러줬으면 하는 별명"
          placeholderTextColor={theme.textMuted} value={nickname} onChangeText={setNickname} maxLength={20} editable={!saving} style={inputStyle} />
        <Text style={{color: theme.text}}>성별</Text>
        <View style={styles.choices}>{genders.map(option => <Pressable key={option.key} disabled={saving}
          accessibilityRole="radio" accessibilityState={{checked: gender === option.key}}
          onPress={() => setGender(option.key)} style={[styles.choice, {backgroundColor: gender === option.key ? theme.accentMuted : theme.background}]}>
          <Text style={{color: theme.text}}>{option.label}</Text>
        </Pressable>)}</View>
        <Text style={{color: theme.text}}>나이</Text>
        <TextInput accessibilityLabel="나이" value={age} onChangeText={setAge} maxLength={3} keyboardType="number-pad"
          editable={!saving} placeholder="만 나이" placeholderTextColor={theme.textMuted} style={inputStyle} />
      </>}
      {ready && tab === 'email' && <Text selectable style={{color: theme.text}}>{email || '등록된 이메일이 없어요.'}</Text>}
      {ready && tab === 'password' && [
        {label: '현재 비밀번호', value: currentPassword, change: setCurrentPassword},
        {label: '새 비밀번호', value: password, change: setPassword},
        {label: '새 비밀번호 확인', value: confirmation, change: setConfirmation},
      ].map(field => <TextInput key={field.label} accessibilityLabel={field.label} placeholder={field.label}
        placeholderTextColor={theme.textMuted} secureTextEntry autoCapitalize="none" autoCorrect={false}
        editable={!saving} value={field.value} onChangeText={field.change} style={inputStyle} />)}
      {ready && tab !== 'email' && <Pressable accessibilityRole="button" onPress={save} disabled={saving}
        style={[styles.save, {backgroundColor: theme.accent}]}>
        <Text style={{color: theme.accentText}}>{saving ? '저장 중…' : tab === 'profile' ? '프로필 저장' : '비밀번호 변경'}</Text>
      </Pressable>}
      {(status || !ready) && <Text accessibilityLiveRegion="polite" style={{color: theme.textMuted}}>{status || '계정 정보를 불러오고 있어요…'}</Text>}
    </View>
  </>;
}

const styles = StyleSheet.create({
  card: {padding: 16, borderRadius: 20, gap: 10},
  input: {minHeight: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12},
  choices: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  choice: {paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12},
  save: {minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12},
});
