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
import { getChatMessages, saveChatMessage } from '../../../services/api/chat';
import { requestReply, type ChatTurn } from '../../../services/api/chatAi';
import { analyzeStory } from '../utils/analyzeStory';
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
  const [userStory, setUserStory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [saveError, setSaveError] = useState('');
  const lock = useRef(false);
  const active = useRef(true);
  const queue = useRef<Message[]>([]);
  const saving = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
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
    } catch {
      if (active.current)
        setSaveError(
          '대화를 서버에 저장하지 못했어요. 화면을 나가기 전에 다시 저장해 주세요.',
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
      setUserStory(restored.filter(m => m.role === 'user').map(m => m.content));
    } catch {
      if (active.current)
        setError(
          '대화 기록을 불러오지 못했어요. 로그인과 백엔드 연결을 확인하고 다시 불러와 주세요.',
        );
    } finally {
      if (active.current) setLoading(false);
    }
  };
  useEffect(() => {
    active.current = true;
    restore();
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

  const handleSend = async () => {
    const trimmedInput = input.trim();
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
      const reply = await requestReply(trimmedInput, history.slice(-10));
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

  const handleButtonClick = (action: ChatAction) => {
    if (lock.current || loading || error || saveError) return;
    switch (action) {
      case 'summarize_yes': {
        const analysis = analyzeStory(userStory);

        appendMessages(
          createMessage(
            'bot',
            `${analysis.summary}\n\n${
              chatScript.keywordsLabel
            }: ${analysis.keywords.join(' ')}`,
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
        const analysis = analyzeStory(userStory);

        appendMessages(
          ...analysis.solutions.map(solution => createMessage('bot', solution)),
        );

        later(() => {
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
