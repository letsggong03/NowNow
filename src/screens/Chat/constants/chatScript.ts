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
    '그랬군요! 더 이야기해 주시겠어요?',
    '정말 힘드셨겠어요.',
    '잘 들었어요. 또 어떤 일이 있었나요?',
  ],
  acknowledge: '알겠습니다.',
  summaryOffer: '오늘 하루 정말 힘들었겠어요. 제가 오늘 하루를 정리해드릴까요?',
  summaryDeclined: '알겠어요! 더 이야기하고 싶으시면 언제든 말씀해 주세요.',
  keywordsLabel: '감정일기 키워드',
  solutionOffer: '해결책도 알려드릴까요?',
  solutionDeclined: '알겠어요! 오늘도 고생하셨어요.',
  reliefOffer: '스트레스 완화를 위해 이런 활동들은 어떠세요?',
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
  {label: '커뮤니티에 털어놓기', action: 'community'},
];

export const reliefResponses: Record<ReliefAction, string> = {
  home: '편안한 조명과 온도로 집안 분위기를 조성해드릴게요.',
  meditation: '명상 도우미를 실행할게요.',
  community: '커뮤니티로 이동합니다.',
};
