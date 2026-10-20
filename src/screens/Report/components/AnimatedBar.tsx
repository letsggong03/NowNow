import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, type ViewStyle} from 'react-native';

const BAR_STAGGER_DELAY = 35;
const BAR_GROW_DURATION = 320;

interface AnimatedBarProps {
  colorStyle: ViewStyle;
  height: number;
  index: number;
  // 값이 바뀌면 막대가 0부터 다시 자라는 애니메이션을 재생한다.
  animationKey: string;
}

export default function AnimatedBar({
  colorStyle,
  height,
  index,
  animationKey,
}: AnimatedBarProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      delay: index * BAR_STAGGER_DELAY,
      duration: BAR_GROW_DURATION,
      toValue: 1,
      useNativeDriver: false,
    }).start();
  }, [index, animationKey, progress]);

  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });

  return (
    <Animated.View style={[styles.bar, colorStyle, {height: animatedHeight}]} />
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: 8,
    width: '100%',
  },
});
