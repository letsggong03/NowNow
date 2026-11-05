import React from 'react';
import {ScrollView, StyleSheet, useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import CharacterStage from './components/CharacterStage';
import InteractionButtons from './components/InteractionButtons';
import PreferencesCard from './components/PreferencesCard';
import StatusHud from './components/StatusHud';
import {useCharacterHome} from './hooks/useCharacterHome';
import {SCREEN_BOTTOM_INSET, SCREEN_HORIZONTAL_PADDING} from '../../theme/layout';
import {useAppTheme} from '../../theme/ThemeProvider';

// 상태창·행동 버튼·오늘 고른 것·탭바가 차지하는 높이. 나머지를 캐릭터 방에 준다.
const HOME_CHROME_HEIGHT = 390;
// 선택지가 열리면 행동 버튼보다 높아서 방을 그만큼 줄인다.
const HOME_CHROME_HEIGHT_OPTIONS = 580;
const ROOM_MIN_HEIGHT = 320;
const ROOM_MAX_HEIGHT = 500;

// 캐릭터 키우기 게임 느낌의 홈: 상태창 → 캐릭터 방 → 행동 버튼 → 오늘 고른 것
export default function HomePage() {
  const {theme} = useAppTheme();
  const {height: windowHeight} = useWindowDimensions();
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
  const chromeHeight = selectedAction
    ? HOME_CHROME_HEIGHT_OPTIONS
    : HOME_CHROME_HEIGHT;
  const roomHeight = Math.min(
    ROOM_MAX_HEIGHT,
    Math.max(ROOM_MIN_HEIGHT, windowHeight - chromeHeight),
  );

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

        <CharacterStage
          mood={userMood}
          isInteracting={isInteracting}
          height={roomHeight}
        />

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
    rowGap: 12,
  },
});
