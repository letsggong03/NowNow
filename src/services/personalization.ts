import {supabase} from './supabase';

export const mbtiPattern = /^[EI][SN][TF][JP]$/;
export const preferenceFields = [
  {key: 'nownow_mbti', label: 'MBTI', placeholder: '예: INFP', maxLength: 4},
  {key: 'nownow_preferred_activity', label: '좋아하는 활동', placeholder: '예: 저녁 산책', maxLength: 40},
  {key: 'nownow_preferred_music', label: '좋아하는 음악', placeholder: '예: 재즈', maxLength: 40},
  {key: 'nownow_preferred_food', label: '좋아하는 음식', placeholder: '예: 칼국수', maxLength: 40},
  {key: 'nownow_age', label: '나이', placeholder: '만 나이 · 성인 수면 비교에 사용', maxLength: 3},
  {key: 'nownow_step_goal', label: '하루 걸음 목표', placeholder: '예: 6000', maxLength: 6},
] as const;

type PreferenceKey = typeof preferenceFields[number]['key'];
export type Preferences = Record<PreferenceKey, string>;

export async function offerPreference(message: string): Promise<{key: PreferenceKey; label: string; value: string} | null> {
  const mbti = /^(?:(?:내|제)\s*)?(?:MBTI|엠비티아이|엠티비아이)\s*(?:는|가|:)?\s*([EI][SN][TF][JP])(?:\s*(?:이야|야|예요|이에요|입니다|라고 기억해(?:줘)?))?[.!]?$/i.exec(message);
  const taste = /^(?:(?:내가|제가)\s*)?좋아하는\s*(활동|음악|음식)(?:은|는|:)[ ]*(.{1,40}?)(?:이야|야|예요|이에요|입니다)[.!]?$/.exec(message);
  const walk = /^(?:난|나는|저는)?\s*(저녁에\s*)?산책(?:하는\s*(?:거|걸)|을)?\s*좋아해(?:요)?[.!]?$/.exec(message);
  const key = mbti ? 'nownow_mbti'
    : taste?.[1] === '음악' ? 'nownow_preferred_music'
    : taste?.[1] === '음식' ? 'nownow_preferred_food' : 'nownow_preferred_activity';
  const value = mbti?.[1].toUpperCase() ?? taste?.[2].trim() ?? (walk ? (walk[1] ? '저녁 산책' : '산책') : '');
  if (!value || (await loadPreferences())[key] === value) return null;
  const label = preferenceFields.find(field => field.key === key)!.label;
  return {key, label, value};
}

export async function loadPreferences(): Promise<Preferences> {
  const {data, error} = await supabase.auth.getUser();
  if (error) throw error;
  const metadata = data.user?.user_metadata ?? {};
  return Object.fromEntries(preferenceFields.map(({key, maxLength}) => [
    key, typeof metadata[key] === 'string' ? metadata[key].slice(0, maxLength) : '',
  ])) as Preferences;
}

export async function savePreferences(updates: Partial<Preferences>) {
  const data = Object.fromEntries(preferenceFields.flatMap(({key, maxLength}) => {
    const input = updates[key];
    if (input === undefined) return [];
    const value = key === 'nownow_mbti' ? input.trim().toUpperCase() : input.trim();
    if (value.length > maxLength || (key === 'nownow_mbti' && value && !mbtiPattern.test(value))) {
      throw new Error('MBTI를 확인해 주세요. 예: INFP');
    }
    if (value && key === 'nownow_age' && (!/^\d+$/.test(value) || Number(value) < 18 || Number(value) > 120)) {
      throw new Error('나이는 18~120세로 입력해 주세요.');
    }
    if (value && key === 'nownow_step_goal' && (!/^\d+$/.test(value) || Number(value) < 100 || Number(value) > 100000)) {
      throw new Error('걸음 목표는 100~100,000 사이로 입력해 주세요.');
    }
    return [[key, value || null]];
  }));
  if (!Object.keys(data).length) return;
  const {error} = await supabase.auth.updateUser({data});
  if (error) throw error;
}
