import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet} from 'react-native';

import type {MoodType} from '../types';

interface CharacterPetProps {
  mood: MoodType;
  isInteracting: boolean;
}

// 캐릭터 그림. 팀원이 새 캐릭터 파일을 주면 이 파일만 바꾸면 된다.
const characterImage = require('../../../assets/images/charactor.png');

const IDLE_DURATION = 1400;

export default function CharacterPet({isInteracting}: CharacterPetProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const bounceDirectionRef = useRef(-1);
  // 가만히 있을 때도 숨 쉬듯 살짝 커졌다 작아진다.
  const idleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(idleAnim, {
          duration: IDLE_DURATION,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(idleAnim, {
          duration: IDLE_DURATION,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    breathing.start();
    return () => breathing.stop();
  }, [idleAnim]);

  useEffect(() => {
    if (!isInteracting) {
      return;
    }

    bounceDirectionRef.current *= -1;
    bounceAnim.setValue(0);

    Animated.sequence([
      Animated.timing(bounceAnim, {
        duration: 130,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        duration: 130,
        toValue: -0.45,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        friction: 4,
        tension: 120,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bounceAnim, isInteracting]);

  const translateY = bounceAnim.interpolate({
    inputRange: [-0.45, 0, 1],
    outputRange: [3, 0, -13],
  });

  const scale = bounceAnim.interpolate({
    inputRange: [-0.45, 0, 1],
    outputRange: [0.98, 1, 1.08],
  });

  const direction = bounceDirectionRef.current;

  const translateX = bounceAnim.interpolate({
    inputRange: [-0.45, 0, 1],
    outputRange: [-3 * direction, 0, 9 * direction],
  });

  const rotate = bounceAnim.interpolate({
    inputRange: [-0.45, 0, 1],
    outputRange:
      direction > 0 ? ['-3deg', '0deg', '5deg'] : ['3deg', '0deg', '-5deg'],
  });

  return (
    <Animated.View
      style={[
        styles.stage,
        {
          transform: [
            {
              scaleY: idleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.035],
              }),
            },
            {
              translateY: idleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -3],
              }),
            },
          ],
        },
      ]}>
      <Animated.Image
        source={characterImage}
        resizeMode="contain"
        style={[
          styles.character,
          {
            transform: [{translateX}, {translateY}, {scale}, {rotate}],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    height: 210,
    justifyContent: 'flex-end',
    width: '100%',
  },
  character: {
    height: 200,
    width: 200,
  },
});
