import {useEffect, useRef, useState} from 'react';

import {
  chatDelays,
  chatScript,
  reliefButtons,
  reliefResponses,
  solutionButtons,
  SUMMARY_OFFER_THRESHOLD,
  summaryButtons,
} from '../constants/chatScript';
import {getChatMessages, requestChatReply, saveChatMessage, saveChatSummary, type ChatTurn} from '../../../services/api/chat';
import {analyzeStory} from '../utils/analyzeStory';
import type {ChatAction, ChatStage, Message, MessageRole} from '../types';

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

// 대화 흐름을 막지 않도록 저장은 백그라운드로 보내고 실패는 로그만 남긴다.
const persistMessage = (message: Message) => {
  saveChatMessage(message.role === 'user' ? 'USER' : 'AI', message.content).catch(
    error => console.log('[chat] 메시지 저장 실패:', error),
  );
};

export const useChatDiary = () => {
  const [messages, setMessages] = useState<Message[]>(() => [
    createMessage('bot', chatScript.greeting),
  ]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState<ChatStage>('initial');
  const [userStory, setUserStory] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const history = useRef<ChatTurn[]>([]);
  const latestUserId = useRef<number | null>(null);
  const summarizedId = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    getChatMessages().then(rows => {
      if (!active || lock.current || latestUserId.current !== null) return;
      const today = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Seoul'});
      const daily = rows.filter(row => new Date(row.created_at).toLocaleDateString('en-CA', {timeZone: 'Asia/Seoul'}) === today);
      if (daily.length) {
        setMessages(daily.map(row => ({
          ...createMessage(row.chat_role === 'USER' ? 'user' : 'bot', row.message),
          createdAt: new Intl.DateTimeFormat('ko-KR', {hour: '2-digit', minute: '2-digit', hour12: false}).format(new Date(row.created_at)),
        })));
        const userRows = daily.filter(row => row.chat_role === 'USER');
        setUserStory(userRows.map(row => row.message));
        latestUserId.current = userRows[userRows.length - 1]?.chat_id ?? null;
      }
    }).catch(() => { if (active && !lock.current) setError('대화 기록을 불러오지 못했어요.'); });
    return () => { active = false; };
  }, []);

  const appendMessages = (...nextMessages: Message[]) => {
    setMessages(prev => [...prev, ...nextMessages]);
    nextMessages.forEach(persistMessage);
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || lock.current) {
      return;
    }
    if (trimmedInput.length > 2000) {
      setError('메시지는 2,000자 이내로 입력해 주세요.');
      return;
    }

    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const saved = await saveChatMessage('USER', trimmedInput);
      latestUserId.current = saved.chat_id;
      const nextStory = [...userStory, trimmedInput];
      setMessages(previous => [...previous, createMessage('user', trimmedInput)]);
      setUserStory(nextStory);
      setInput(previous => previous === input ? '' : previous);

      const reply = await requestChatReply(trimmedInput, history.current);
      const turns: ChatTurn[] = [{role: 'user', content: trimmedInput}, {role: 'assistant', content: reply.slice(0, 4000)}];
      history.current = [...history.current, ...turns].slice(-10);
      setMessages(previous => [...previous, createMessage('bot', reply)]);
      if (nextStory.length >= SUMMARY_OFFER_THRESHOLD && (stage === 'initial' || stage === 'listening')) {
        setMessages(previous => [...previous, createMessage('bot', chatScript.summaryOffer, summaryButtons)]);
        setStage('summary_confirm');
      } else if (stage === 'initial') {
        setStage('listening');
      }
      await saveChatMessage('AI', reply);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '연결을 확인하고 다시 시도해 주세요.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const handleButtonClick = async (action: ChatAction) => {
    if (lock.current) return;
    switch (action) {
      case 'summarize_yes': {
        const analysis = analyzeStory(userStory);
        const chatId = latestUserId.current;
        if (chatId === null || summarizedId.current === chatId) return;
        lock.current = true;
        setBusy(true);
        setError('');
        try {
          const keywords = analysis.keywords.map(keyword => {
            if (keyword === '#부장') return '부장/팀장';
            if (keyword === '#업무스트레스') return '업무 스트레스';
            return keyword.replace(/^#/, '');
          });
          await saveChatSummary(chatId, analysis.summary, keywords);
          summarizedId.current = chatId;
        } catch {
          setError('요약을 저장하지 못했어요. 다시 시도해 주세요.');
          return;
        } finally {
          lock.current = false;
          setBusy(false);
        }

        appendMessages(
          createMessage(
            'bot',
            `${analysis.summary}\n\n${
              chatScript.keywordsLabel
            }: ${analysis.keywords.join(' ')}`,
          ),
        );
        setStage('summary_shown');

        setTimeout(() => {
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
        const analysis = analyzeStory(userStory);

        appendMessages(
          ...analysis.solutions.map(solution => createMessage('bot', solution)),
        );

        setTimeout(() => {
          appendMessages(
            createMessage('bot', chatScript.reliefOffer, reliefButtons),
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
  };

  return {
    error,
    busy,
    messages,
    input,
    setInput,
    handleSend,
    handleButtonClick,
  };
};
