import React from 'react';
import {StyleSheet, View} from 'react-native';

import {useAppTheme} from '../../../theme/ThemeProvider';

export default function ChatAvatar() {
  const {theme} = useAppTheme();

  return (
    <View style={[styles.avatar, {backgroundColor: theme.accentMuted}]}>
      <View style={[styles.face, {backgroundColor: theme.accent}]}>
        <View style={[styles.eye, {backgroundColor: theme.characterFeature}]} />
        <View
          style={[
            styles.eye,
            styles.rightEye,
            {backgroundColor: theme.characterFeature},
          ]}
        />
        <View
          style={[styles.mouth, {borderBottomColor: theme.characterFeature}]}
        />
      </View>
      <View style={[styles.leftHand, {backgroundColor: theme.accent}]} />
      <View style={[styles.rightHand, {backgroundColor: theme.accent}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  face: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  eye: {
    borderRadius: 2,
    height: 4,
    left: 7,
    position: 'absolute',
    top: 8,
    width: 4,
  },
  rightEye: {
    left: 14,
  },
  mouth: {
    borderBottomWidth: 1,
    borderRadius: 4,
    height: 5,
    left: 9,
    position: 'absolute',
    top: 14,
    width: 7,
  },
  leftHand: {
    borderRadius: 4,
    height: 8,
    left: 7,
    position: 'absolute',
    top: 17,
    width: 8,
  },
  rightHand: {
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    right: 7,
    top: 17,
    width: 8,
  },
});
