import {useEffect, useRef, useState} from 'react';
import {Alert, Linking} from 'react-native';

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
import {loadPreferences, offerPreference, savePreferences} from '../../../services/personalization';
import {openDeliveryApp} from '../../../services/delivery/deliveryApps';
import {careForButton, careForMessage, healthCare, petCard} from '../utils/careSuggestions';
import {hasUrgentSymptoms, healthSafetyReply} from '../../../../shared/careSafety';
import {supabase} from '../../../services/supabase';
import type {ChatAction, ChatStage, Message, MessageRole} from '../types';
import type {MoodType} from '../../Home/types';

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
  saveChatMessage(message.role === 'user' ? 'USER' : 'ASSISTANT', message.content).catch(
    error => console.log('[chat] 메시지 저장 실패:', error),
  );
};

const HEALTH_REQUEST = '오늘의 건강 기록 알려줘';
const HEALTH_MESSAGE = '뿡뿡아, 오늘 내 건강 기록은 어때? 확인된 수치와 지금 할 수 있는 작은 실천 하나를 다정하게 알려줘.';
const stressExpression = /스트레스.{0,12}(받|쌓|많|심|힘들)|힘들어|지쳤어|속상해|부담돼|막막해/;
const positiveExpression = /스트레스.{0,8}(안\s*받|없|풀렸)|기분.{0,8}(좋|최고)|기뻐|행복해|신나|뿌듯|즐거웠/;
const isPositive = (message: string) => positiveExpression.test(message);
const summaryChoices = [...summaryButtons, {label: '키워드 추가', action: 'summary_add_keywords' as const}];

export const useChatDiary = (mood?: MoodType | null) => {
  const [messages, setMessages] = useState<Message[]>(() => [
    createMessage('bot', mood === 'sad' || mood === 'neutral' ? chatScript.greeting
      : mood === 'happy' ? '오늘 기분이 좋다니 나도 기뻐! 어떤 일이 너를 웃게 했어?'
      : '안녕, 뿡뿡이야! 오늘은 어떤 이야기를 나눠볼까?'),
  ]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState<ChatStage>('initial');
  const [userStory, setUserStory] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingKeywords, setEditingKeywords] = useState(false);
  const [manualKeywords, setManualKeywords] = useState<string[]>([]);
  const lock = useRef(false);
  const history = useRef<ChatTurn[]>([]);
  const latestUserId = useRef<number | null>(null);
  const summarizedId = useRef<number | null>(null);
  const petOffered = useRef(false);
  const awaitingCause = useRef(false);

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
        const userRows = daily.filter(row => row.chat_role === 'USER' && row.message !== HEALTH_REQUEST && row.message !== HEALTH_MESSAGE);
        setUserStory(userRows.map(row => row.message));
        history.current = daily.slice(-10).map(row => ({
          role: row.chat_role === 'USER' ? 'user' : 'assistant', content: row.message,
        }));
        latestUserId.current = userRows[userRows.length - 1]?.chat_id ?? null;
      }
    }).catch(() => { if (active && !lock.current) setError('대화 기록을 불러오지 못했어요.'); });
    return () => { active = false; };
  }, []);

  const appendMessages = (...nextMessages: Message[]) => {
    setMessages(prev => [...prev, ...nextMessages]);
    nextMessages.forEach(persistMessage);
  };

  const handleSend = async (quickMessage?: string) => {
    const trimmedInput = (quickMessage ?? input).trim();

    if (!trimmedInput || lock.current) {
      return;
    }
    if (trimmedInput.length > 2000) {
      setError('메시지는 2,000자 이내로 입력해 주세요.');
      return;
    }

    if (hasUrgentSymptoms(trimmedInput)) {
      setError('');
      setInput('');
      petOffered.current = false;
      const userMessage = createMessage('user', trimmedInput);
      const safetyMessage = createMessage('bot', healthSafetyReply(trimmedInput)!);
      setMessages(previous => [...previous, userMessage, safetyMessage]);
      void saveChatMessage('USER', trimmedInput).then(() => saveChatMessage('ASSISTANT', safetyMessage.content)).catch(() => {});
      return;
    }

    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const saved = await saveChatMessage('USER', trimmedInput);
      if (!quickMessage) latestUserId.current = saved.chat_id;
      const nextStory = quickMessage ? userStory : [...userStory, trimmedInput];
      setMessages(previous => [...previous, createMessage('user', trimmedInput)]);
      setUserStory(nextStory);
      if (!quickMessage) setInput(previous => previous === input ? '' : previous);

      const safety = healthSafetyReply(trimmedInput);
      const acceptedPet = petOffered.current && /^(웅|응|네|좋아|보여줘|그래)[!.~]*$/.test(trimmedInput);
      petOffered.current = false;
      const preferences = !safety && /먹|배고|맛집|음식|음악|노래|플레이리스트/.test(trimmedInput)
        ? await loadPreferences().catch(() => undefined) : undefined;
      const asksForRecord = /혈압|심박|맥박|걸음\s*수|수면\s*(시간|기록)|스트레스\s*(점수|지수)|건강\s*기록/.test(trimmedInput);
      const causeAnswer = !safety && !asksForRecord && awaitingCause.current;
      const askCause = !safety && !asksForRecord && !causeAnswer && !isPositive(trimmedInput) && stressExpression.test(trimmedInput);
      if (causeAnswer) awaitingCause.current = false;
      if (askCause) awaitingCause.current = true;
      const causes = causeAnswer ? analyzeStory([trimmedInput]).keywords : [];
      const card = safety || asksForRecord ? null : askCause
        ? {text: '많이 버거웠겠다. 내가 들어줄게. 오늘 어떤 일 때문에 제일 마음이 힘들었어?', buttons: undefined}
        : causeAnswer ? {text: causes.length
          ? `그 일 때문에 마음이 힘들었구나. ${causes.join(', ')} 쪽 이야기로 들렸어. 맞는지 확인하면서 오늘 이야기를 정리해볼까?`
          : '말해줘서 고마워. 오늘 마음에 남은 일을 어떤 단어로 적어두고 싶어? 직접 키워드를 넣을 수도 있어.',
          buttons: summaryChoices}
        : acceptedPet ? petCard() : careForMessage(trimmedInput, preferences);
      const answer = card ? {reply: card.text, suggestion: undefined}
        : await requestChatReply(trimmedInput, history.current);
      const {reply} = answer;
      let displayedReply = reply;
      if (!safety && Math.random() < 0.25) {
        const session = await supabase.auth.getSession().catch(() => null);
        const name = session?.data.session?.user.user_metadata.nownow_chat_name;
        const nickname = typeof name === 'string' ? name.trim().slice(0, 20) : '';
        if (nickname && !reply.includes(nickname)) displayedReply = `${nickname}, ${reply}`;
      }
      const care = healthCare(answer.suggestion);
      const turns: ChatTurn[] = [{role: 'user', content: trimmedInput}, {role: 'assistant', content: reply.slice(0, 4000)}];
      history.current = [...history.current, ...turns].slice(-10);
      petOffered.current = Boolean((card?.buttons ?? care?.buttons)?.some(button => button.action === 'pet_cat'));
      setMessages(previous => [...previous, createMessage('bot', displayedReply, card?.buttons)]);
      if (care) setMessages(previous => [...previous, createMessage('bot', care.text, care.buttons)]);
      if (!askCause && !causeAnswer && !quickMessage && nextStory.length >= SUMMARY_OFFER_THRESHOLD && (stage === 'initial' || stage === 'listening')) {
        setMessages(previous => [...previous, createMessage('bot', chatScript.summaryOffer, summaryChoices)]);
        setStage('summary_confirm');
      } else if (stage === 'initial') {
        setStage('listening');
      }
      await saveChatMessage('ASSISTANT', displayedReply);
      if (care) persistMessage(createMessage('bot', care.text));
      void offerPreference(trimmedInput).then(preference => {
        if (!preference) return;
        const {key, label, value} = preference;
        Alert.alert('뿡뿡이가 기억해둘까?', `${label} · ${value}\n저장하면 다음 답변이나 추천에 참고해요.`, [
          {text: '이번만', style: 'cancel'},
          {text: '기억해줘', onPress: () => {
            void savePreferences({[key]: value}).catch(() => Alert.alert('취향을 저장하지 못했어요.'));
          }},
        ]);
      }).catch(() => {});
    } catch (failure) {
      const safety = healthSafetyReply(trimmedInput);
      if (safety) setMessages(previous => [...previous, createMessage('bot', safety)]);
      else setError(failure instanceof Error ? failure.message : '연결을 확인하고 다시 시도해 주세요.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const handleButtonClick = async (action: ChatAction, target?: string) => {
    if (lock.current) return;
    const card = careForButton(action);
    if (card) {
      petOffered.current = false;
      appendMessages(createMessage('bot', card.text, card.buttons));
      return;
    }
    if (action === 'open_link' || action === 'open_delivery') {
      try {
        if (action === 'open_link' && target?.startsWith('https://')) await Linking.openURL(target);
        if (action === 'open_delivery' && (target === 'baemin' || target === 'coupangEats')) await openDeliveryApp(target);
      } catch {
        setError('링크를 열지 못했어요. 다시 시도해 주세요.');
      }
      return;
    }
    switch (action) {
      case 'summary_add_keywords':
        setEditingKeywords(true);
        break;
      case 'summarize_yes': {
        const analysis = analyzeStory(userStory);
        const chatId = latestUserId.current;
        if (chatId === null || summarizedId.current === chatId) return;
        lock.current = true;
        setBusy(true);
        setError('');
        const keywords = [...new Set([...manualKeywords.slice(0, 9), analysis.keywords[0] ?? '일상', ...analysis.keywords, ...manualKeywords])].slice(0, 10);
        try {
          await saveChatSummary(chatId, analysis.summary, keywords);
          summarizedId.current = chatId;
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : '요약을 저장하지 못했어요. 다시 시도해 주세요.');
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
            }: ${keywords.join(', ') || '추가한 키워드 없음'}`,
          ),
        );
        setStage('summary_shown');

        const recent = userStory.slice(-3).join(' ');
        const happy = [...userStory].reverse().find(line => isPositive(line) || stressExpression.test(line));
        if (happy ? isPositive(happy) : mood === 'happy') {
          appendMessages(createMessage('bot', '그 기분 조금 더 즐겨볼까? 좋아하는 노래 한 곡 틀고, 찍어두고 싶었던 사진 한 장 남겨봐도 재밌겠다! ✨'));
        } else if (stressExpression.test(recent) || analysis.keywords.length) setTimeout(() => {
          appendMessages(
            createMessage('bot', chatScript.solutionOffer, solutionButtons),
          );
          setStage('solution_confirm');
        }, chatDelays.followUp);
        break;
      }
      case 'summarize_no':
        setEditingKeywords(false);
        appendMessages(createMessage('bot', chatScript.summaryDeclined));
        break;
      case 'solution_yes': {
        lock.current = true;
        setBusy(true);
        try {
          const causes = [...analyzeStory(userStory).keywords, ...manualKeywords].join(', ');
          const {reply} = await requestChatReply(
            `사용자가 말한 오늘의 상황${causes ? `과 정리한 키워드(${causes})` : ''}에 맞춰 부담 없는 해결책 한 가지만 제안해줘. 커뮤니티에 글 올리기는 빼고, 원인은 새로 추정하지 말아줘.`,
            history.current,
          );
          appendMessages(createMessage('bot', reply));
        } catch {
          setError('해결책을 불러오지 못했어요. 다시 시도해 주세요.');
          break;
        } finally {
          lock.current = false;
          setBusy(false);
        }

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
        appendMessages(createMessage('bot', reliefResponses[action]));
        break;
      case 'meditation':
        appendMessages(createMessage('bot', reliefResponses[action]));
        try {
          await Linking.openURL('https://www.youtube.com/watch?v=Vtdi0kCLenU');
        } catch {
          setError('유튜브를 열지 못했어. 다시 시도해 줘.');
        }
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
    editingKeywords,
    closeKeywords: () => setEditingKeywords(false),
    addKeywords: async (text: string) => {
      if (lock.current) return false;
      const added = text.split(/[,，#\n]+/).map(word => word.trim().slice(0, 30)).filter(Boolean);
      if (!added.length) return false;
      const chatId = latestUserId.current;
      if (chatId === null) {
        setError('오늘 있었던 일을 먼저 하나 들려줘.');
        return false;
      }
      const analysis = analyzeStory(userStory);
      const merged = [...new Set([...added, ...manualKeywords])].slice(0, 9);
      const keywords = [...new Set([...merged, ...(analysis.keywords.length ? analysis.keywords : ['일상'])])].slice(0, 10);
      lock.current = true;
      setBusy(true);
      setError('');
      try {
        await saveChatSummary(chatId, analysis.summary, keywords);
        setManualKeywords(merged);
        setEditingKeywords(false);
        setMessages(previous => [...previous, createMessage('bot', `키워드를 저장했어! ${keywords.join(', ')} ♡`)]);
        return true;
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : '키워드를 저장하지 못했어. 다시 시도해 줘.');
        return false;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    openHealthRecord: () => handleSend(HEALTH_MESSAGE),
    offerSummary: () => {
      if (lock.current) return;
      setMessages(previous => [...previous, createMessage('bot', userStory.length
        ? chatScript.summaryOffer : '오늘 있었던 일을 먼저 하나 들려줘. 같이 정리해볼게.',
        userStory.length ? summaryChoices : undefined)]);
    },
  };
};
