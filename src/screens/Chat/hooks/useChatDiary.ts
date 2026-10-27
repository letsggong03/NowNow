import { useEffect, useRef, useState } from 'react';

import {
  chatDelays,
  chatScript,
  reliefButtons,
  reliefResponses,
  solutionButtons,
  SUMMARY_OFFER_THRESHOLD,
  summaryButtons,
} from '../constants/chatScript';
import {
  getChatMessages,
  clearDemoMessages,
  persistSummary,
  getServerSyncStatus,
  saveChatMessage,
} from '../../../services/chatStorage';
import { requestReply, type ChatTurn } from '../../../services/api/chatAi';
import {retrieveHealthContext, type HealthContext} from '../../../services/health/context';
const {groundedPrompt} = require('../../../../shared/healthRetrieval');
import { chatAiConfig } from '../../../services/api/chatAiConfig';
import {
  summarizeDay,
  suggestSolutions,
  type DaySummary,
  type DaySolutions,
} from '../../../services/api/chatAiFeatures';
import type { ChatAction, ChatStage, Message, MessageRole } from '../types';

const getCurrentMessageTime = () =>
  new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  }).format(new Date());

const createMessage = (
  role: MessageRole,
  content: string,
  buttons?: Message['buttons'],
): Message => ({
  role,
  content,
  createdAt: getCurrentMessageTime(),
  buttons,
});

export const useChatDiary = () => {
  const [messages, setMessages] = useState<Message[]>(() => [
    createMessage('bot', chatScript.greeting),
  ]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState<ChatStage>('initial');
  const summaryCache = useRef<{ key: string; data: DaySummary } | null>(null);
  const summarySavedKey = useRef<string | null>(null);
  const solutionsCache = useRef<{ key: string; data: DaySolutions } | null>(
    null,
  );
  const [userStory, setUserStory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [healthContext, setHealthContext] = useState<HealthContext | null>(null);
  const [storageStatus, setStorageStatus] = useState('대화는 이 폰에 저장');
  const [error, setError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [saveError, setSaveError] = useState('');
  const lock = useRef(false);
  const active = useRef(true);
  const queue = useRef<Message[]>([]);
  const saving = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resetConversation = async () => {
    if (lock.current || loading || saving.current) {
      setRequestError('답변과 저장이 끝난 뒤 다시 초기화해 주세요.');
      return;
    }
    lock.current = true;
    setResetting(true);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    try {
      await clearDemoMessages();
      timers.current.forEach(clearTimeout);
      timers.current = [];
      queue.current = [];
      summaryCache.current = null;
      summarySavedKey.current = null;
      solutionsCache.current = null;
      if (active.current) {
        setMessages([createMessage('bot', chatScript.greeting)]);
        setInput('');
        setUserStory([]);
        setHealthContext(null);
        setStage('initial');
        setError('');
        setSaveError('');
        setRequestError('');
      }
    } catch {
      if (active.current) setRequestError('대화를 지우지 못했어요. 다시 시도해 주세요.');
    } finally {
      lock.current = false;
      if (active.current) setResetting(false);
    }
  };
  const later = (callback: () => void, delay: number) => {
    timers.current.push(
      setTimeout(() => {
        if (active.current) callback();
      }, delay),
    );
  };
  const retrySave = async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      while (queue.current.length) {
        const message = queue.current[0];
        await saveChatMessage(
          message.role === 'user' ? 'USER' : 'AI',
          message.content,
        );
        queue.current.shift();
      }
      if (active.current) setSaveError('');
      if (active.current) setStorageStatus(getServerSyncStatus());
    } catch {
      if (active.current)
        setSaveError(
          chatAiConfig.demoMode
            ? '대화를 폰에 저장하지 못했어요. 저장 공간을 확인하고 다시 저장해 주세요.'
            : '대화를 서버에 저장하지 못했어요. 화면을 나가기 전에 다시 저장해 주세요.',
        );
    } finally {
      saving.current = false;
    }
  };
  const restore = async () => {
    setLoading(true);
    setError('');
    try {
      const saved = await getChatMessages();
      if (!active.current) return;
      const restored: Message[] = saved.map(row => ({
        role: row.chat_role === 'USER' ? 'user' : 'bot',
        content: row.message,
        createdAt: new Intl.DateTimeFormat('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date(row.created_at)),
      }));
      setMessages(
        restored.length
          ? restored
          : [createMessage('bot', chatScript.greeting)],
      );
      setUserStory(
        saved
          .filter(
            row =>
              row.chat_role === 'USER' &&
              new Date(row.created_at).toDateString() ===
                new Date().toDateString(),
          )
          .map(row => row.message),
      );
    } catch {
      if (active.current)
        setError(
          chatAiConfig.demoMode
            ? '폰의 시연 대화를 불러오지 못했어요. 다시 불러와 주세요.'
            : '대화 기록을 불러오지 못했어요. 로그인과 백엔드 연결을 확인하고 다시 불러와 주세요.',
        );
    } finally {
      if (active.current) setLoading(false);
    }
  };
  useEffect(() => {
    active.current = true;
    restore();
    retrieveHealthContext('오늘 스트레스').then(context => {
      if (!active.current) return;
      setHealthContext(context);
      const score = context.documents.find(doc => doc.kind === 'stress')?.facts.score;
      if (typeof score === 'number' && score >= 70) {
        setMessages(previous => [...previous, createMessage('bot',
          `오늘 기록으로 계산한 앱 내부 스트레스 지표가 ${score}/100이에요. 진단 수치는 아니며 활동과 측정 조건의 영향을 받을 수 있어요. 지금 느끼는 상태를 알려주시면 기록을 함께 보고 무리 없는 휴식 방법을 찾아볼게요.`)]);
      }
    }).catch(() => {});
    const scheduled = timers.current;
    return () => {
      active.current = false;
      scheduled.forEach(clearTimeout);
    };
  }, []);

  const appendMessages = (...nextMessages: Message[]) => {
    setMessages(prev => [...prev, ...nextMessages]);
    queue.current.push(...nextMessages);
    retrySave();
  };

  const handleSend = async (question?: string) => {
    const trimmedInput = (typeof question === 'string' ? question : input).trim();
    if (!trimmedInput || lock.current || loading || error || saveError) return;
    if (trimmedInput.length > 2000) {
      setRequestError('메시지는 2000자 이내로 입력해 주세요.');
      return;
    }
    lock.current = true;
    setSending(true);
    setRequestError('');
    const history: ChatTurn[] = [];
    // Only complete user/AI pairs, excluding scripted button messages.
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'bot') {
        history.push(
          { role: 'user', content: messages[i].content.slice(0, 4000) },
          {
            role: 'assistant',
            content: messages[i + 1].content.slice(0, 4000),
          },
        );
        i++;
      }
    }
    const pendingUser = createMessage('user', trimmedInput);
    setMessages(prev => [...prev, pendingUser]);
    setInput('');
    try {
      let context: HealthContext;
      try {context = await retrieveHealthContext(trimmedInput);}
      catch {context = {range: {from: '', to: ''}, documents: [], missing: [], status: ['건강 기록 조회 실패'], notice: '건강 수치를 확인하지 못했습니다.'};}
      if (!active.current) return;
      setHealthContext(context);
      const reply = await requestReply(groundedPrompt(trimmedInput, context), history.slice(-10));
      if (!active.current) return;
      const user = createMessage('user', trimmedInput);
      const bot = createMessage('bot', reply);
      setMessages(prev => [...prev, bot]);
      queue.current.push(user, bot);
      retrySave();
      const nextStory = [...userStory, trimmedInput];
      setUserStory(nextStory);
      setStage('listening');
      if (
        nextStory.length >= SUMMARY_OFFER_THRESHOLD &&
        (stage === 'initial' || stage === 'listening')
      ) {
        appendMessages(
          createMessage('bot', chatScript.summaryOffer, summaryButtons),
        );
        setStage('summary_confirm');
      }
    } catch (failure) {
      if (active.current) {
        setMessages(prev => prev.filter(message => message !== pendingUser));
        setInput(trimmedInput);
        setRequestError(
          failure instanceof Error ? failure.message : 'AI 연결에 실패했어요.',
        );
      }
    } finally {
      lock.current = false;
      if (active.current) setSending(false);
    }
  };

  const handleButtonClick = async (action: ChatAction) => {
    if (lock.current || loading || error || saveError) return;
    const analysisAction =
      action === 'summarize_yes' || action === 'solution_yes';
    if (analysisAction) {
      lock.current = true;
      setSending(true);
      setRequestError('');
    }
    try {
      switch (action) {
        case 'summarize_yes': {
          const key = JSON.stringify(userStory);
          const analysis =
            summaryCache.current?.key === key
              ? summaryCache.current.data
              : await summarizeDay(userStory);
          if (!active.current) return;
          summaryCache.current = { key, data: analysis };
          if (summarySavedKey.current !== key) {
            const status = await persistSummary(analysis.summary, analysis.keywords);
            setStorageStatus(status);
            if (!status.includes('실패') && !status.includes('필요합니다')) summarySavedKey.current = key;
          }

          appendMessages(
            createMessage(
              'bot',
              `${analysis.summary}\n\n${chatScript.keywordsLabel}: ${
                analysis.keywords.map(word => '#' + word).join(' ') ||
                '기록 근거 없음'
              }`,
            ),
          );
          setStage('summary_shown');

          later(() => {
            appendMessages(
              createMessage('bot', chatScript.solutionOffer, solutionButtons),
            );
            setStage('solution_confirm');
          }, chatDelays.followUp);
          break;
        }
        case 'summarize_no':
          appendMessages(createMessage('bot', chatScript.summaryDeclined));
          break;
        case 'solution_yes': {
          const key = JSON.stringify(userStory);
          const analysis =
            solutionsCache.current?.key === key
              ? solutionsCache.current.data
              : await suggestSolutions(userStory, healthContext);
          if (!active.current) return;
          solutionsCache.current = { key, data: analysis };

          appendMessages(
            ...analysis.solutions.map(solution =>
              createMessage('bot', solution),
            ),
          );

          later(() => {
            appendMessages(
              createMessage(
                'bot',
                chatScript.reliefOffer,
                reliefButtons.filter(button =>
                  analysis.reliefActions.includes(
                    button.action as 'home' | 'meditation' | 'community',
                  ),
                ),
              ),
            );
            setStage('solution_shown');
          }, chatDelays.reliefOffer);
          break;
        }
        case 'solution_no':
          appendMessages(createMessage('bot', chatScript.solutionDeclined));
          break;
        case 'home':
        case 'meditation':
        case 'community':
          appendMessages(createMessage('bot', reliefResponses[action]));
          break;
      }
    } catch (failure) {
      if (active.current)
        setRequestError(
          failure instanceof Error
            ? failure.message
            : 'AI 분석을 다시 시도해 주세요.',
        );
    } finally {
      if (analysisAction) {
        lock.current = false;
        if (active.current) setSending(false);
      }
    }
  };

  return {
    storageStatus,
    healthContext,
    resetting,
    resetConversation,
    loading,
    sending,
    error,
    requestError,
    saveError,
    restore,
    retrySave,
    messages,
    input,
    setInput,
    handleSend,
    handleButtonClick,
  };
};
