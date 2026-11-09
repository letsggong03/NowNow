import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {Check} from 'lucide-react-native';

import Text from '../../../components/AppText';
import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {completedMessages, interactionActions} from '../constants/homeContent';
import type {PreferenceKey, UserPreferences} from '../types';

interface SideActionsProps {
  completedPreferences: UserPreferences;
  selectedAction: PreferenceKey | null;
  onActionSelect: (action: PreferenceKey) => void;
  onCancel: () => void;
}

const BUTTON_SIZE = 54;
const FLOAT_DURATION = 1300;

// 방 왼쪽·오른쪽에 두 개씩
const LEFT = interactionActions.slice(0, 2);
const RIGHT = interactionActions.slice(2);

function ActionBubble({
  action,
  index,
  completed,
  selected,
  onPress,
}: {
  action: (typeof interactionActions)[number];
  index: number;
  completed: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const {theme} = useAppTheme();
  // 아직 안 한 버튼은 둥실둥실 떠 있어서 눌러 달라는 느낌을 준다. 버튼마다 박자를 엇갈린다.
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (completed) {
      floatAnim.setValue(0);
      return;
    }

    const floating = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 220),
        Animated.timing(floatAnim, {
          duration: FLOAT_DURATION,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          duration: FLOAT_DURATION,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    floating.start();
    return () => floating.stop();
  }, [completed, floatAnim, index]);

  return (
    <Animated.View
      style={[
        styles.item,
        {
          transform: [
            {
              translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -4],
              }),
            },
          ],
        },
      ]}>
      <Pressable
        accessibilityLabel={action.label}
        disabled={completed}
        onPress={onPress}
        style={({pressed}) => [
          styles.bubble,
          {backgroundColor: completed ? theme.surfaceMuted : theme.surface},
          selected && {borderColor: theme.accent},
          completed && styles.completedBubble,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.emoji, completed && styles.completedEmoji]}>
          {action.emoji}
        </Text>
        {completed && (
          <View style={[styles.doneBadge, {backgroundColor: theme.accent}]}>
            <Check color={theme.accentText} size={10} strokeWidth={3.5} />
          </View>
        )}
      </Pressable>
      <Text
        style={[
          styles.label,
          {color: completed ? theme.textMuted : theme.text},
        ]}>
        {completed ? completedMessages[action.key] : action.label}
      </Text>
    </Animated.View>
  );
}

// 캐릭터 방 가장자리에 붙는 작은 행동 버튼(먹이·놀이 / 음악·휴식)
export default function SideActions({
  completedPreferences,
  selectedAction,
  onActionSelect,
  onCancel,
}: SideActionsProps) {
  const renderColumn = (
    actions: typeof interactionActions,
    offset: number,
  ) =>
    actions.map((action, index) => (
      <ActionBubble
        key={action.key}
        action={action}
        index={offset + index}
        completed={Boolean(completedPreferences[action.key])}
        selected={selectedAction === action.key}
        // 고르고 있는 버튼을 한 번 더 누르면 선택지를 닫는다.
        onPress={() =>
          selectedAction === action.key ? onCancel() : onActionSelect(action.key)
        }
      />
    ));

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View pointerEvents="box-none" style={[styles.column, styles.left]}>
        {renderColumn(LEFT, 0)}
      </View>
      <View pointerEvents="box-none" style={[styles.column, styles.right]}>
        {renderColumn(RIGHT, LEFT.length)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    bottom: 22,
    position: 'absolute',
    rowGap: 12,
  },
  left: {
    left: 14,
  },
  right: {
    right: 14,
  },
  item: {
    alignItems: 'center',
    rowGap: 3,
  },
  bubble: {
    ...shadows.raised,
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2.5,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE,
  },
  completedBubble: {
    elevation: 0,
    shadowOpacity: 0,
  },
  pressed: {
    transform: [{scale: 0.9}],
  },
  emoji: {
    fontSize: 25,
  },
  completedEmoji: {
    opacity: 0.4,
  },
  doneBadge: {
    alignItems: 'center',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: -3,
    top: -3,
    width: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
