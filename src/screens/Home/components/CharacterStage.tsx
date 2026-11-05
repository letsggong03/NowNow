import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

import {useAppTheme} from '../../../theme/ThemeProvider';
import type {MoodType} from '../types';
import CharacterMessage from './CharacterMessage';
import CharacterPet from './CharacterPet';

interface CharacterStageProps {
  mood: MoodType;
  isInteracting: boolean;
}

// 방 색. 다크 모드에서는 어둡게 바꾼다.
const ROOM = {
  light: {wall: '#FFF7EC', floor: '#F6E4CB', shadow: '#E9CFAE'},
  dark: {wall: '#2C2A26', floor: '#3A352D', shadow: '#2A251F'},
};

// 돌봐 주면 떠오르는 하트 (가로 위치, 늦게 출발하는 정도)
const HEARTS = [
  {left: -46, delay: 0},
  {left: 4, delay: 120},
  {left: 50, delay: 240},
];

// 캐릭터가 사는 방: 벽·바닥·장식, 말풍선, 캐릭터, 하트 효과
export default function CharacterStage({mood, isInteracting}: CharacterStageProps) {
  const {theme} = useAppTheme();
  const room = ROOM[theme.mode];
  const heartAnims = useRef(HEARTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!isInteracting) return;

    heartAnims.forEach(anim => anim.setValue(0));
    Animated.stagger(
      HEARTS[1].delay,
      heartAnims.map(anim =>
        Animated.timing(anim, {
          duration: 900,
          toValue: 1,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [heartAnims, isInteracting]);

  return (
    <View style={[styles.room, {backgroundColor: room.wall}]}>
      {/* 장식: 창문과 반짝이 */}
      <View style={[styles.window, {borderColor: room.floor}]}>
        <Text style={styles.windowSky}>☁️</Text>
      </View>
      <Text style={[styles.sparkle, styles.sparkleLeft]}>✨</Text>
      <Text style={[styles.sparkle, styles.sparkleRight]}>⭐</Text>

      <View style={[styles.floor, {backgroundColor: room.floor}]}>
        <Text style={styles.plant}>🪴</Text>
      </View>

      <View style={styles.content}>
        <CharacterMessage userMood={mood} />

        <View style={styles.characterArea}>
          {HEARTS.map(({left}, index) => (
            <Animated.Text
              key={left}
              pointerEvents="none"
              style={[
                styles.heart,
                {
                  marginLeft: left,
                  opacity: heartAnims[index].interpolate({
                    inputRange: [0, 0.2, 1],
                    outputRange: [0, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: heartAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -70],
                      }),
                    },
                    {
                      scale: heartAnims[index].interpolate({
                        inputRange: [0, 0.3, 1],
                        outputRange: [0.4, 1.1, 0.9],
                      }),
                    },
                  ],
                },
              ]}>
              💗
            </Animated.Text>
          ))}
          <View style={[styles.groundShadow, {backgroundColor: room.shadow}]} />
          <CharacterPet mood={mood} isInteracting={isInteracting} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  room: {
    borderRadius: 26,
    overflow: 'hidden',
    paddingTop: 16,
  },
  window: {
    alignItems: 'center',
    backgroundColor: '#D9EEFF',
    borderRadius: 14,
    borderWidth: 5,
    height: 64,
    justifyContent: 'center',
    left: 18,
    position: 'absolute',
    top: 100,
    width: 72,
  },
  windowSky: {
    fontSize: 24,
  },
  sparkle: {
    fontSize: 16,
    position: 'absolute',
  },
  sparkleLeft: {
    left: 22,
    top: 30,
  },
  sparkleRight: {
    right: 24,
    top: 28,
  },
  floor: {
    bottom: 0,
    height: 74,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  plant: {
    bottom: 18,
    fontSize: 34,
    position: 'absolute',
    right: 20,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 18,
  },
  characterArea: {
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  groundShadow: {
    borderRadius: 50,
    bottom: 2,
    height: 16,
    opacity: 0.7,
    position: 'absolute',
    width: 120,
  },
  heart: {
    fontSize: 22,
    left: '50%',
    position: 'absolute',
    top: 30,
    zIndex: 2,
  },
});
