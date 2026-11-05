import type {MoodType, PreferenceKey} from '../types';

export const moods: {label: string; value: MoodType; face: string}[] = [
  {label: '좋지 않아', value: 'sad', face: '😢'},
  {label: '그냥 그래', value: 'neutral', face: '😐'},
  {label: '행복해', value: 'happy', face: '😊'},
];

export const characterMessages: Record<MoodType, string> = {
  sad: '오늘 기분이 좋지 않아 보여...\n무슨 일 있어?',
  neutral: '오늘은 차분한 하루였나 봐.\n조금 더 들려줄래?',
  happy: '기분이 좋아 보여서 나도 좋아!\n오늘 좋은 일이 있었어?',
};

// 행동 버튼과 상태 게이지에 쓰는 아이콘(이모지)·색. color는 버튼 바탕, shade는 버튼 아래 입체 테두리.
export const interactionActions: {
  key: PreferenceKey;
  label: string;
  emoji: string;
  gauge: string;
  color: string;
  shade: string;
}[] = [
  {key: 'feed', label: '먹이', emoji: '🍙', gauge: '배부름', color: '#FFE2C4', shade: '#F2B98A'},
  {key: 'play', label: '놀이', emoji: '🎾', gauge: '즐거움', color: '#D6EBFF', shade: '#9CC6EE'},
  {key: 'music', label: '음악', emoji: '🎧', gauge: '흥', color: '#EADDFB', shade: '#C2A9EA'},
  {key: 'hobby', label: '휴식', emoji: '🛁', gauge: '휴식', color: '#D5F1DF', shade: '#97D2AE'},
];

export const completedMessages: Record<PreferenceKey, string> = {
  feed: '배불러요!',
  play: '즐거워요!',
  music: '흥얼거려요!',
  hobby: '편안해요!',
};
