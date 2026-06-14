import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import CharacterMessage from './components/CharacterMessage';
import CharacterPet from './components/CharacterPet';
import InteractionButtons from './components/InteractionButtons';
import MoodSelector from './components/MoodSelector';
import PreferencesCard from './components/PreferencesCard';
import {useCharacterHome} from './hooks/useCharacterHome';
import {useAppTheme} from '../../theme/ThemeProvider';


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
        scrollEnabled
        style={[styles.container, {backgroundColor: theme.background}]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.moodSection, {backgroundColor: theme.surface}]}>
          <Text style={[styles.title, {color: theme.text}]}>
            오늘 기분은 어떠세요?
          </Text>
          <MoodSelector selectedMood={userMood} onMoodChange={setUserMood} />
        </View>

        <View style={[styles.petCard, {backgroundColor: theme.background}]}>
          <CharacterPet mood={userMood} isInteracting={isInteracting} />
        </View>

        <CharacterMessage userMood={userMood} />
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
    paddingBottom: 110,
    paddingHorizontal: 18,
    paddingTop: 16,
    rowGap: 14,
  },
  moodSection: {
    borderRadius: 22,
    padding: 12,
    rowGap: 11,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    paddingTop: 4,
    textAlign: 'center',
  },
  petCard: {
    alignItems: 'center',
    borderRadius: 22,
    minHeight: 252,
    justifyContent: 'center',
    paddingVertical: 34,
  },
});
