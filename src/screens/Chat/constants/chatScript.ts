import type {MessageButton, ReliefAction} from '../types';

// 요약 제안을 띄우기까지 필요한 사용자 메시지 수
export const SUMMARY_OFFER_THRESHOLD = 3;

export const chatDelays = {
  reply: 500,
  followUp: 1000,
  reliefOffer: 1500,
};

export const chatScript = {
  greeting: '오늘 기분이 좋지 않아 보여... 무슨 일 있어?',
  listeningReplies: [
    '그랬구나! 조금 더 들려줄래?',
    '정말 힘들었겠다.',
    '잘 들었어. 또 어떤 일이 있었어?',
  ],
  acknowledge: '알겠어!',
  summaryOffer: '오늘 들려준 이야기, 뿡뿡이가 같이 정리해볼까? ♡',
  summaryDeclined: '알겠어! 더 이야기하고 싶을 때 언제든 찾아와.',
  keywordsLabel: '감정일기 키워드',
  solutionOffer: '지금 마음이 조금 가벼워질 방법도 같이 찾아볼까?',
  solutionDeclined: '알겠어! 오늘도 고생 많았어.',
  reliefOffer: '뿡뿡이랑 잠깐 쉬어갈래? ♡',
};

export const summaryButtons: MessageButton[] = [
  {label: '예', action: 'summarize_yes'},
  {label: '아니오', action: 'summarize_no'},
];

export const solutionButtons: MessageButton[] = [
  {label: '예', action: 'solution_yes'},
  {label: '아니오', action: 'solution_no'},
];

export const reliefButtons: MessageButton[] = [
  {label: '편안한 우리집', action: 'home'},
  {label: '명상', action: 'meditation'},
];

export const reliefResponses: Record<ReliefAction, string> = {
  home: '우리 이불 폭 덮고 같이 쉴까? 뿡뿡이도 옆에서 쿨쿨할게. (˶ᵔ ᵕ ᵔ˶) zzZ',
  meditation: '뿡뿡이랑 잠깐 숨을 고르자. 명상 영상도 열어줄게 🌿',
};
