import type {MessageButton, ReliefAction} from '../types';

// 요약 제안을 띄우기까지 필요한 사용자 메시지 수
export const SUMMARY_OFFER_THRESHOLD = 3;

export const chatDelays = {
  reply: 500,
  followUp: 1000,
  reliefOffer: 1500,
};

export const chatScript = {
  greeting: '안녕하세요! 오늘 하루는 어떠셨나요? 편하게 들려주세요.',
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
  home: '편안한 공간에서 잠시 쉬어보세요. 이 버튼은 활동 제안이며 기기를 제어하지 않아요.',
  meditation: '편안하게 앉아 잠시 천천히 호흡해보세요.',
  community: '믿을 만한 사람에게 이야기를 나눠보는 것도 좋아요. 커뮤니티 연결은 준비 중이에요.',
};
