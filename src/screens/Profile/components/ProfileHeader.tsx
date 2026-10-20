import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {User} from 'lucide-react-native';

import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';
import {useProfile} from '../hooks/useProfile';

export default function ProfileHeader() {
  const {theme} = useAppTheme();
  const profile = useProfile();

  return (
    <View style={[styles.card, {backgroundColor: theme.surface}]}>
      <View style={[styles.avatar, {backgroundColor: theme.accent}]}>
        <User color={theme.accentText} size={32} />
      </View>
      <View>
        <Text style={[styles.name, {color: theme.text}]}>{profile.name}</Text>
        <Text style={[styles.message, {color: theme.textMuted}]}>
          {profile.message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 16,
    padding: 20,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    marginTop: 5,
  },
});
