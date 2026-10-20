import {useState} from 'react';

import {
  chatDelays,
  chatScript,
  reliefButtons,
  reliefResponses,
  solutionButtons,
  SUMMARY_OFFER_THRESHOLD,
  summaryButtons,
} from '../constants/chatScript';
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

const pickRandom = <T,>(items: T[]) =>
  items[Math.floor(Math.random() * items.length)];

export const useChatDiary = () => {
  const [messages, setMessages] = useState<Message[]>(() => [
    createMessage('bot', chatScript.greeting),
  ]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState<ChatStage>('initial');
  const [userStory, setUserStory] = useState<string[]>([]);

  const appendMessages = (...nextMessages: Message[]) => {
    setMessages(prev => [...prev, ...nextMessages]);
  };

  const handleSend = () => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    const nextStory = [...userStory, trimmedInput];

    appendMessages(createMessage('user', trimmedInput));
    setUserStory(nextStory);
    setInput('');

    setTimeout(() => {
      if (stage === 'initial' || stage === 'listening') {
        appendMessages(
          createMessage('bot', pickRandom(chatScript.listeningReplies)),
        );
        setStage('listening');
      } else {
        appendMessages(createMessage('bot', chatScript.acknowledge));
      }
    }, chatDelays.reply);

    if (nextStory.length >= SUMMARY_OFFER_THRESHOLD && stage === 'listening') {
      setTimeout(() => {
        appendMessages(
          createMessage('bot', chatScript.summaryOffer, summaryButtons),
        );
        setStage('summary_confirm');
      }, chatDelays.followUp);
    }
  };

  const handleButtonClick = (action: ChatAction) => {
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
    messages,
    input,
    setInput,
    handleSend,
    handleButtonClick,
  };
};
