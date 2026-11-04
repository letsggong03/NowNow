import {useEffect, useState} from 'react';

import {
  getTodayInteractions,
  saveInteraction,
} from '../../../services/api/character';
import {
  pickDailyOptions,
  preferenceLabels,
} from '../constants/preferenceOptions';
import type {
  MoodType,
  PreferenceKey,
  PreferenceOption,
  UserPreferences,
} from '../types';

const MOOD_CHANGE_DELAY = 500;
const INTERACTION_DURATION = 1000;

const isPreferenceKey = (action: string): action is PreferenceKey =>
  action in preferenceLabels;

export const useCharacterHome = () => {
  const [userMood, setUserMood] = useState<MoodType>('neutral');
  const [isInteracting, setIsInteracting] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [selectedAction, setSelectedAction] = useState<PreferenceKey | null>(
    null,
  );
  const [currentOptions, setCurrentOptions] = useState<PreferenceOption[]>([]);

  // 오늘 이미 고른 취향을 불러와 앱을 다시 켜도 "함께한 것들"이 남아 있게 한다.
  useEffect(() => {
    let cancelled = false;

    getTodayInteractions()
      .then(interactions => {
        if (cancelled) return;

        // 오래된 순이라 같은 종류는 마지막에 고른 것이 남는다.
        const saved: UserPreferences = {};
        for (const {action, choice} of interactions) {
          if (isPreferenceKey(action) && choice) saved[action] = choice;
        }
        // 불러오는 사이에 새로 고른 것이 있으면 그걸 우선한다.
        setUserPreferences(prev => ({...saved, ...prev}));
      })
      .catch(error =>
        console.log('[character] 오늘 취향 불러오기 실패:', error),
      );

    return () => {
      cancelled = true;
    };
  }, []);

  const handleActionSelect = (action: PreferenceKey) => {
    setSelectedAction(action);
    setCurrentOptions(pickDailyOptions(action));
  };

  const handleOptionSelect = (choice: string) => {
    if (!selectedAction) {
      return;
    }

    setIsInteracting(true);
    setUserPreferences(prev => ({...prev, [selectedAction]: choice}));
    // 저장이 실패해도 화면 반응은 그대로 두고 로그만 남긴다.
    saveInteraction(selectedAction, choice).catch(error =>
      console.log('[character] 취향 저장 실패:', error),
    );
    setSelectedAction(null);
    setCurrentOptions([]);

    if (userMood !== 'happy') {
      setTimeout(() => setUserMood('happy'), MOOD_CHANGE_DELAY);
    }

    setTimeout(() => {
      setIsInteracting(false);
    }, INTERACTION_DURATION);
  };

  const handleCancelOptions = () => {
    setSelectedAction(null);
    setCurrentOptions([]);
  };

  return {
    userMood,
    setUserMood,
    isInteracting,
    userPreferences,
    selectedAction,
    currentOptions,
    handleActionSelect,
    handleOptionSelect,
    handleCancelOptions,
  };
};
