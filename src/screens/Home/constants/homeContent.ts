import {Gamepad2, Music, PartyPopper, Utensils} from 'lucide-react-native';
import type {LucideIcon} from 'lucide-react-native';

import type {MoodType, PreferenceKey} from '../types';

export const moods: {label: string; value: MoodType; face: string}[] = [
  {label: '좋지 않아', value: 'sad', face: '☹'},
  {label: '그냥 그래', value: 'neutral', face: '😐'},
  {label: '행복해', value: 'happy', face: '☺'},
];

export const characterMessages: Record<MoodType, string> = {
  sad: '오늘 기분이 좋지 않아 보여...\n무슨 일 있어?',
  neutral: '오늘은 차분한 하루였나 봐.\n조금 더 들려줄래?',
  happy: '기분이 좋아 보여서 나도 좋아!\n오늘 좋은 일이 있었어?',
};

export const interactionActions: {
  key: PreferenceKey;
  label: string;
  Icon: LucideIcon;
}[] = [
  {key: 'feed', label: '먹이 주기', Icon: Utensils},
  {key: 'play', label: '놀아 주기', Icon: Gamepad2},
  {key: 'music', label: '음악 듣기', Icon: Music},
  {key: 'hobby', label: '휴식 취하기', Icon: PartyPopper},
];

export const completedMessages: Record<PreferenceKey, string> = {
  feed: '배불러요!',
  play: '즐거워요!',
  music: '흥얼거려요!',
  hobby: '편안해요!',
};
