import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import CharacterStage from './components/CharacterStage';
import InteractionButtons from './components/InteractionButtons';
import PreferencesCard from './components/PreferencesCard';
import StatusHud from './components/StatusHud';
import {useCharacterHome} from './hooks/useCharacterHome';
import {SCREEN_BOTTOM_INSET, SCREEN_HORIZONTAL_PADDING} from '../../theme/layout';
import {useAppTheme} from '../../theme/ThemeProvider';

// 캐릭터 키우기 게임 느낌의 홈: 상태창 → 캐릭터 방 → 행동 버튼 → 오늘 함께한 것들
export default function HomePage() {
  const {theme} = useAppTheme();
  const {
    userMood,
    setUserMood,
    isInteracting,
    userPreferences,
    selectedAction,
    currentOptions,
    handleActionSelect,
    handleOptionSelect,
    handleCancelOptions,
  } = useCharacterHome();

  return (
    <SafeAreaView
      style={[styles.safeArea, {backgroundColor: theme.background}]}
      edges={['top']}>
      <ScrollView
        alwaysBounceVertical
        keyboardShouldPersistTaps="handled"
        style={[styles.container, {backgroundColor: theme.background}]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <StatusHud
          preferences={userPreferences}
          mood={userMood}
          onMoodChange={setUserMood}
        />

        <CharacterStage mood={userMood} isInteracting={isInteracting} />

        <InteractionButtons
          selectedAction={selectedAction}
          options={currentOptions}
          completedPreferences={userPreferences}
          onActionSelect={handleActionSelect}
          onOptionSelect={handleOptionSelect}
          onCancelOptions={handleCancelOptions}
        />

        <PreferencesCard preferences={userPreferences} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: SCREEN_BOTTOM_INSET,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingTop: 12,
    rowGap: 14,
  },
});
