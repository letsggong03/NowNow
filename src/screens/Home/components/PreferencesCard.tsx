import React, {useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import Text from '../../../components/AppText';
import {
  deliveryApps,
  openDeliveryApp,
  type DeliveryApp,
} from '../../../services/delivery/deliveryApps';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {interactionActions} from '../constants/homeContent';
import MusicRecommendation from './MusicRecommendation';
import type {PreferenceKey, UserPreferences} from '../types';

interface PreferencesCardProps {
  preferences: UserPreferences;
}

// 눌렀을 때 아래 창에서 더 보여 줄 게 있는 종류
const hasDetail = (key: PreferenceKey) => key === 'feed' || key === 'music';

function DeliveryButtons() {
  const {theme} = useAppTheme();

  return (
    <View style={styles.deliveryRow}>
      {(Object.keys(deliveryApps) as DeliveryApp[]).map(app => (
        <Pressable
          key={app}
          onPress={() =>
            openDeliveryApp(app).catch(error =>
              console.log('[deliveryApps] 앱 열기 실패:', error),
            )
          }
          style={({pressed}) => [
            styles.deliveryButton,
            {backgroundColor: theme.surfaceMuted, borderColor: theme.border},
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.deliveryLabel, {color: theme.text}]}>
            {deliveryApps[app].label} 열기
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// 오늘 고른 것들. 먹이·음악을 누르면 아래에서 창이 올라와 배달앱·추천곡을 보여 준다.
export default function PreferencesCard({preferences}: PreferencesCardProps) {
  const {theme} = useAppTheme();
  const insets = useSafeAreaInsets();
  const [detailKey, setDetailKey] = useState<PreferenceKey | null>(null);
  const chosen = interactionActions.filter(({key}) => preferences[key]);

  if (chosen.length === 0) {
    return null;
  }

  const detailChoice = detailKey ? preferences[detailKey] : undefined;

  return (
    <>
      <View style={styles.chips}>
        {chosen.map(({key, emoji}) => (
          <Pressable
            key={key}
            disabled={!hasDetail(key)}
            onPress={() => setDetailKey(key)}
            style={({pressed}) => [
              styles.chip,
              {backgroundColor: theme.surface},
              pressed && styles.pressed,
            ]}>
            <Text style={styles.chipEmoji}>{emoji}</Text>
            <Text numberOfLines={1} style={[styles.chipLabel, {color: theme.text}]}>
              {preferences[key]}
            </Text>
            {hasDetail(key) && (
              <Text style={[styles.chipMore, {color: theme.textMuted}]}>›</Text>
            )}
          </Pressable>
        ))}
      </View>

      <Modal
        animationType="slide"
        navigationBarTranslucent
        onRequestClose={() => setDetailKey(null)}
        statusBarTranslucent
        transparent
        visible={detailKey !== null}>
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDetailKey(null)}
          />
          <View
            style={[
              styles.sheet,
              {backgroundColor: theme.surface, paddingBottom: insets.bottom + 20},
            ]}>
            <View style={[styles.handle, {backgroundColor: theme.border}]} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.sheetTitle, {color: theme.text}]}>
                {detailChoice}
              </Text>
              {detailKey === 'feed' && <DeliveryButtons />}
              {detailKey === 'music' && detailChoice && (
                <MusicRecommendation choice={detailChoice} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 5,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  chipMore: {
    fontSize: 15,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: 3,
    height: 5,
    marginBottom: 14,
    width: 40,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 12,
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deliveryButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
  deliveryLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
