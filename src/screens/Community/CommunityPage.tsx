import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useAppTheme} from '../../theme/ThemeProvider';

export default function CommunityPage() {
  const {theme} = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.background}]}>
      <View style={styles.container}>
        <Text style={[styles.title, {color: theme.text}]}>커뮤니티</Text>
        <Text style={[styles.description, {color: theme.textMuted}]}>
          마음을 나눌 공간을 준비 중입니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    marginTop: 10,
  },
});
