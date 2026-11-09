import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

import type {MoodType} from '../types';

interface CharacterPetProps {
  mood: MoodType;
  isInteracting: boolean;
}

const characterImage = require('../../../assets/images/charactor.png');

export default function CharacterPet({isInteracting, mood}: CharacterPetProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const bounceDirectionRef = useRef(-1);

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
    <View style={styles.stage}>
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
      {mood !== 'neutral' && <Text accessibilityLabel={mood === 'happy' ? '기쁜 뿡뿡이' : '곁에 있어주는 뿡뿡이'}
        style={styles.mood}>{mood === 'happy' ? '✨' : '🤍'}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    height: 190,
    justifyContent: 'center',
    width: '100%',
  },
  character: {
    height: 168,
    width: 168,
  },
  mood: {position: 'absolute', top: 12, right: '27%', fontSize: 25},
});
